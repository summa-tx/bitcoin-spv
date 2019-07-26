pragma solidity ^0.5.10;

/** @title BitcoinSPV */
/** @author Summa (https://summa.one) */

import {BytesLib} from "./BytesLib.sol";
import {BTCUtils} from "./BTCUtils.sol";
import {ValidateSPV} from "./ValidateSPV.sol";


contract Relay {
    using BytesLib for bytes;
    using BTCUtils for bytes;
    using ValidateSPV for bytes;

    bytes32 relayGenesis;
    mapping (bytes32 => bytes32) internal previousBlock;
    mapping (bytes32 => uint64) internal blockHeight;


    /// @notice                   Gives a starting point for the relay
    /// @dev                      We don't check this AT ALL really. Don't use relays with bad genesis
    /// @param  _genesisHeader    The starting header
    /// @param  _height           The starting height
    constructor(bytes memory _genesisHeader, uint64 _height) public {
        require(_genesisHeader.length == 80, "Stop being dumb");
        bytes32 _genesisDigest = _genesisHeader.hash256();
        relayGenesis = _genesisDigest;
        blockHeight[_genesisDigest] = _height;
    }

    /// @notice             Adds headers to storage after validating
    /// @dev                We check integrity and consistency of the header chain
    /// @param  _headers    A tightly-packed list of 80-byte Bitcoin headers
    /// @return             True if successfully written, error otherwise
    function _addHeaders(bytes memory _headers) internal returns (bool) {
        bytes memory _header;
        bytes32 _currentDigest;
        bytes32 _previousDigest;
        uint256 _target;

        require(_headers.length % 80 == 0, "Header array lenght must be divisible by 80");
        require(_headers.length / 80 >= 5, "Must supply an even number of headers");

        for (uint64 i = 0; i < _headers.length; i += 80) {
            _header = _headers.slice(i, 80);
            _previousDigest = _currentDigest;   /* NB: Does nothing on first loop */
            _currentDigest = _header.hash256();

            if (i == 0) {
                /*
                NB: We build off an existing header
                    This means that all headers should have the same difficulty
                */
                require(
                    previousBlock[_currentDigest] == _header.extractPrevBlockLE().toBytes32(),
                    "First header must be known already");
                require(blockHeight[_currentDigest] != 0, "First header must be at a known height");
                _target = _header.extractTarget();
            } else {
                /*
                NB: After the first header
                1. check that headers are in a chain
                2. check that the target hasn't changed
                3. Store the block connection
                4. Store the height
                */
                require(_header.validateHeaderPrevHash(_currentDigest), "Headers not a consistent chain");
                require(_header.extractTarget() == _target, "Target changed unexpectedly");
                previousBlock[_currentDigest] = _previousDigest;
                if (i % 320 == 0) {
                    /* NB: We store the height only every 4th header to save gas */
                    blockHeight[_currentDigest] = blockHeight[_previousDigest] + 1;
                }
            }

            // Require that the header has sufficient work
            require(
                abi.encodePacked(_currentDigest).reverseEndianness().bytesToUint() <= _target,
                "Header work is insufficient");
        }
    }

    /// @notice             Adds headers to storage after validating
    /// @dev                We check integrity and consistency of the header chain
    /// @param  _headers    A tightly-packed list of 80-byte Bitcoin headers
    /// @return             True if successfully written, error otherwise
    function addHeaders(bytes calldata _headers) external returns (bool) {
        return _addHeaders(_headers);
    }

    /// @notice                 Adds headers to storage, performs additional validation of retarget
    /// @dev                    Checks the retarget, the heights, and the linkage
    /// @param  _oldPeriodStart The first header in the difficulty period being closed
    /// @param  _headers        A tightly-packed list of 80-byte Bitcoin headers
    /// @return                 True if successfully written, error otherwise
    function addHeadersWithRetarget(
        bytes calldata _oldPeriodStart,
        bytes calldata _headers
    ) external returns (bool) {
        bytes memory _oldPeriodEnd = _headers.slice(0, 80);
        bytes memory _newPeriodStart = _headers.slice(80, 80);

        uint64 _pastHeight = _findHeight(_oldPeriodStart.hash256());
        uint64 _currentHeight = _findHeight(_oldPeriodEnd.hash256());

        uint256 _actualTarget = _newPeriodStart.extractTarget();
        uint256 _expectedTarget = BTCUtils.retargetAlgorithm(
            _oldPeriodStart.extractTarget(),
            _oldPeriodStart.extractTimestamp(),
            _oldPeriodEnd.extractTimestamp()
        );

        require(
            _newPeriodStart.extractPrevBlockLE().toBytes32() == _oldPeriodEnd.hash256(),
            "Chain is not an extension of the last header of the period");
        require(_oldPeriodStart.length == 80, "Past retarget is the wrong size");
        require(
            _pastHeight % 2016 == 0,
            "Must provide the first header of the difficulty period");
        require(
            _currentHeight == _pastHeight + 2015,
            "Must provide exactly 1 difficulty period");
        require(
            (_actualTarget & _expectedTarget) == _expectedTarget,
            "Invalid retarget provided");

        // Pass all but the first through to be added
        return _addHeaders(_headers.slice(80, _headers.length - 80));
    }

    /// @notice         Finds the height of a header by its digest
    /// @dev            Will fail if the header is unknown
    /// @param _digest  The header digest to search for
    /// @return         The height of the header
    function _findHeight(bytes32 _digest) internal view returns (uint64) {
        uint64 _height = 0;
        bytes32 _current = _digest;
        for (uint8 i = 0; i < 5; i++) {
            _height = blockHeight[_current];
            if (_height == 0) {
                _current = previousBlock[_current];
            } else {
                return _height + i;
            }
        }
        require(false, "Unknown block");
    }

    /// @notice         Finds the height of a header by its digest
    /// @dev            Will fail if the header is unknown
    /// @param _digest  The header digest to search for
    /// @return         The height of the header, or error if unknown
    function findHeight(bytes32 _digest) external view returns (uint64) {
        return _findHeight(_digest);
    }

    /// @notice         Finds an ancestor for a block by its
    /// @dev            Will fail if the header is unknown
    /// @param _digest  The header digest to search for
    /// @return         The height of the header, or error if unknown
    function _findAncestor(bytes32 _digest, uint8 _offset) internal view returns (bytes32) {
        bytes32 _current = _digest;
        for (uint8 i = 0; i < _offset; i++) {
            _current = previousBlock[_current];
        }
        require(_current != bytes32(0), "Unknown ancestor");
        return _current;
    }

    /// @notice         Finds an ancestor for a block by its
    /// @dev            Will fail if the header is unknown
    /// @param _digest  The header digest to search for
    /// @return         The height of the header, or error if unknown
    function findAncestor(bytes32 _digest, uint8 _offset) external view returns (bytes32) {
        return _findAncestor(_digest, _offset);
    }


    /// @notice             Checks if a digest is an ancestor of the current one
    /// @dev                Limit the amount of lookups (and thus gas usage) with _limit
    /// @param _ancestor    The prospective ancestor
    /// @param _descendant  The descendant to check
    /// @param _limit       The maximum number of blocks to check
    /// @return             true if ancestor is at most limit blocks lower than descendant, otherwise false
    function _isAncestor(bytes32 _ancestor, bytes32 _descendant, uint64 _limit) internal view returns (bool) {
        bytes32 _current = _descendant;
        /* NB: 200 gas/read, so gas is capped at ~200 * limit */
        for (uint16 i = 0; i < _limit; i += 1) {
            if (_current == _ancestor) {
                return true;
            }
            _current = previousBlock[_current];
        }
        return false;
    }

    /// @notice             Checks if a digest is an ancestor of the current one
    /// @dev                Limit the amount of lookups (and thus gas usage) with _limit
    /// @param _ancestor    The prospective ancestor
    /// @param _descendant  The descendant to check
    /// @param _limit       The maximum number of blocks to check
    /// @return             true if ancestor is at most limit blocks lower than descendant, otherwise false
    function isAncestor(bytes32 _ancestor, bytes32 _descendant, uint64 _limit) external view returns (bool) {
        return _isAncestor(_ancestor, _descendant, _limit);
    }
}
