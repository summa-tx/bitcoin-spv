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

    event Extension(bytes32 indexed _first, bytes32 indexed _last);

    bytes32 relayGenesis;
    bytes32 bestKnownDigest;
    bytes32 lastReorgCommonAncestor;
    mapping (bytes32 => bytes32) internal previousBlock;
    mapping (bytes32 => uint32) internal blockHeight;


    /// @notice                   Gives a starting point for the relay
    /// @dev                      We don't check this AT ALL really. Don't use relays with bad genesis
    /// @param  _genesisHeader    The starting header
    /// @param  _height           The starting height
    constructor(bytes memory _genesisHeader, uint32 _height) public {
        require(_genesisHeader.length == 80, "Stop being dumb");
        bytes32 _genesisDigest = _genesisHeader.hash256();
        relayGenesis = _genesisDigest;
        bestKnownDigest = _genesisDigest;
        lastReorgCommonAncestor = _genesisDigest;
        blockHeight[_genesisDigest] = _height;
    }

    /// @notice                   Gives a starting point for the relay
    /// @dev                      We don't check this AT ALL really. Don't use relays with bad genesis
    /// @param  _ancestor         The digest of the most recent common ancestor
    /// @param  _currentBest      The 80-byte header referenced by bestKnownDigest
    /// @param  _newBest          The 80-byte header to mark as the new best
    /// @param  _limit            Limit the amount of traversal of the chain
    /// @return                   True if successfully updates bestKnownDigest, error otherwise
    function _markNewHeaviest(
        bytes32 _ancestor,
        bytes memory _currentBest,
        bytes memory _newBest,
        uint32 _limit
    ) internal returns (bool) {
        require(_currentBest.hash256() == bestKnownDigest, "Passed in best is not best known");
        bytes32 _newBestDigest = _newBest.hash256();
        require(
            previousBlock[_newBestDigest] != bytes32(0),
            "New best is unknown");
        require(
            _isHeaviestCommonAncestor(_ancestor, bestKnownDigest, _newBestDigest, _limit),
            "Ancestor must be heaviest common ancestor");
        require(
            _heaviestFromAncestor(_ancestor, _currentBest, _newBest) == _newBestDigest,
            "New best hash does not have more work than previous");

        bestKnownDigest = _newBestDigest;
        lastReorgCommonAncestor = _ancestor;
        return true;
    }

    /// @notice                   Gives a starting point for the relay
    /// @dev                      We don't check this AT ALL really. Don't use relays with bad genesis
    /// @param  _ancestor         The digest of the most recent common ancestor
    /// @param  _currentBest      The 80-byte header referenced by bestKnownDigest
    /// @param  _newBest          The 80-byte header to mark as the new best
    /// @param  _limit            Limit the amount of traversal of the chain
    /// @return                   True if successfully updates bestKnownDigest, error otherwise
    function markNewHeaviest(
        bytes32 _ancestor,
        bytes calldata _currentBest,
        bytes calldata _newBest,
        uint32 _limit
    ) external returns (bool) {
        return _markNewHeaviest(_ancestor, _currentBest, _newBest, _limit);
    }

    /// @notice             Adds headers to storage after validating
    /// @dev                We check integrity and consistency of the header chain
    /// @param  _headers    A tightly-packed list of 80-byte Bitcoin headers
    /// @return             True if successfully written, error otherwise
    function _addHeaders(bytes memory _headers) internal returns (bool) {
        bytes memory _header;
        bytes32 _currentDigest;
        bytes32 _previousDigest;
        uint256 _target = _headers.slice(80, 80).extractTarget();

        require(_headers.length % 80 == 0, "Header array length must be divisible by 80");
        require(_headers.length / 80 >= 5, "Must supply at least 5 headers");

        for (uint32 i = 0; i < _headers.length; i += 80) {
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
            } else {
                /*
                NB: After the first header
                1. check that headers are in a chain
                2. check that the header has sufficient work
                3. Store the block connection
                4. Store the height
                */
                require(
                    abi.encodePacked(_currentDigest).reverseEndianness().bytesToUint() <= _target,
                    "Header work is insufficient");
                require(_header.validateHeaderPrevHash(_currentDigest), "Headers not a consistent chain");
                require(_header.extractTarget() == _target, "Target changed unexpectedly");
                previousBlock[_currentDigest] = _previousDigest;
                if (i % 320 == 0) {
                    /* NB: We store the height only every 4th header to save gas */
                    blockHeight[_currentDigest] = blockHeight[_previousDigest] + 1;
                }
            }
        }

        emit Extension(
            _headers.slice(0, 80).hash256(),
            _currentDigest);
        return true;
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
    /// @param  _oldPeriodEnd   The last header in the difficulty period being closed
    /// @param  _headers        A tightly-packed list of 80-byte Bitcoin headers
    /// @return                 True if successfully written, error otherwise
    function addHeadersWithRetarget(
        bytes calldata _oldPeriodStart,
        bytes calldata _oldPeriodEnd,
        bytes calldata _headers
    ) external returns (bool) {
        bytes memory _newPeriodStart = _headers.slice(0, 80);

        require(_oldPeriodStart.length == 80, "Old period start header is the wrong size");
        require(_oldPeriodEnd.length == 80, "Old period end header is the wrong size");

        /* NB: This comparison looks weird because header nBits encoding truncates targes */
        uint256 _actualTarget = _newPeriodStart.extractTarget();
        uint256 _expectedTarget = BTCUtils.retargetAlgorithm(
            _oldPeriodStart.extractTarget(),
            _oldPeriodStart.extractTimestamp(),
            _oldPeriodEnd.extractTimestamp()
        );
        require(
            (_actualTarget & _expectedTarget) == _expectedTarget,
            "Invalid retarget provided");

        /* NB: Redundant check here. It checks the connection to the previ*/
        require(
            _newPeriodStart.extractPrevBlockLE().toBytes32() == _oldPeriodEnd.hash256(),
            "Chain is not an extension of the last header of the period");

        /* NB: retargets should happen at 2016 block intervals */
        uint32 _startHeight = _findHeight(_oldPeriodStart.hash256());
        uint32 _endHeight = _findHeight(_oldPeriodEnd.hash256());
        require(
            _startHeight % 2016 == 0,
            "Must provide the first header of the difficulty period");
        require(
            _endHeight == _startHeight + 2015,
            "Must provide exactly 1 difficulty period");

        // Pass all but the first through to be added
        return _addHeaders(abi.encodePacked(_oldPeriodEnd, _headers));
    }

    /// @notice         Finds the height of a header by its digest
    /// @dev            Will fail if the header is unknown
    /// @param _digest  The header digest to search for
    /// @return         The height of the header
    function _findHeight(bytes32 _digest) internal view returns (uint32) {
        uint32 _height = 0;
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
    function findHeight(bytes32 _digest) external view returns (uint32) {
        return _findHeight(_digest);
    }

    /// @notice         Finds an ancestor for a block by its digest
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

    /// @notice         Finds an ancestor for a block by its digest
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
    function _isAncestor(bytes32 _ancestor, bytes32 _descendant, uint32 _limit) internal view returns (bool) {
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
    function isAncestor(bytes32 _ancestor, bytes32 _descendant, uint32 _limit) external view returns (bool) {
        return _isAncestor(_ancestor, _descendant, _limit);
    }

    /// @notice             Checks if a digest is an ancestor of the current one
    /// @dev                Limit the amount of lookups (and thus gas usage) with _limit
    /// @param _ancestor    The prospective shared ancestor
    /// @param _left        A chain tip
    /// @param _right       A chain tip
    /// @param _limit       The maximum number of blocks to check
    /// @return             true if it is the most recent common ancestor within _limit, false otherwise
    function _isHeaviestCommonAncestor(
        bytes32 _ancestor,
        bytes32 _left,
        bytes32 _right,
        uint32 _limit
    ) internal view returns (bool) {
        bytes32 _leftCurrent = _left;
        bytes32 _rightCurrent = _right;
        bytes32 _leftPrev = previousBlock[_leftCurrent];
        bytes32 _rightPrev = previousBlock[_rightCurrent];
        for(uint32 i = 0; i < _limit; i++) {
            if (_leftPrev != _ancestor) {
                _leftCurrent = _leftPrev;  // cheap
                _leftPrev = previousBlock[_leftPrev];  // expensive
            }
            if (_rightPrev != _ancestor) {
                _rightCurrent = _rightPrev;  // cheap
                _rightPrev = previousBlock[_rightPrev];  // expensive
            }
        }
        if (_leftCurrent == _rightCurrent) {return false;} /* NB: If the same, they're a nearer ancestor */
        if (_leftPrev != _rightPrev) {return false;} /* NB: Both must be ancestor */
        return true;
    }

    /// @notice             Checks if a digest is an ancestor of the current one
    /// @dev                Limit the amount of lookups (and thus gas usage) with _limit
    /// @param _ancestor    The prospective shared ancestor
    /// @param _left        A chain tip
    /// @param _right       A chain tip
    /// @param _limit       The maximum number of blocks to check
    /// @return             true if it is the most recent common ancestor within _limit, false otherwise
    function isHeaviestCommonAncestor(
        bytes32 _ancestor,
        bytes32 _left,
        bytes32 _right,
        uint32 _limit
    ) external view returns (bool) {
        return _isHeaviestCommonAncestor(_ancestor, _left, _right, _limit);
    }

    /// @notice             Decides which header is heaviest from the ancestor
    /// @dev                Does not support reorgs above 2017 blocks (:
    /// @param _ancestor    The prospective shared ancestor
    /// @param _left        A chain tip
    /// @param _right       A chain tip
    /// @return             true if it is the most recent common ancestor within _limit, false otherwise
    function _heaviestFromAncestor(
        bytes32 _ancestor,
        bytes memory _left,
        bytes memory _right
    ) internal view returns (bytes32) {
        uint32 _ancestorHeight = _findHeight(_ancestor);
        uint32 _leftHeight = _findHeight(_left.hash256());
        uint32 _rightHeight = _findHeight(_right.hash256());

        require(
            _leftHeight > _ancestorHeight && _rightHeight > _ancestorHeight,
            "A descendant height is below the ancestor height");

        uint32 _nextPeriodStart = _ancestorHeight + (2016 - _ancestorHeight % 2016);
        bool _leftInPeriod = _leftHeight < _nextPeriodStart;
        bool _rightInPeriod = _rightHeight < _nextPeriodStart;

        /*
        NB:
        1. Left is in a new window, right is in the old window. Left is heavier
        2. Right is in a new window, left is in the old window. Right is heavier
        3. Both are in the same window, choose the higher one
        4. They're in different new windows. Choose the heavier one
        */
        if (!_leftInPeriod && _rightInPeriod) {return _left.hash256();}
        if (_leftInPeriod && !_rightInPeriod) {return _right.hash256();}
        if (_leftInPeriod && _rightInPeriod) {
            return _leftHeight >= _rightHeight ? _left.hash256() : _right.hash256();
        }
        if (!_leftInPeriod && !_rightInPeriod) {
            if (((_leftHeight % 2016) * _left.extractDifficulty()) <
                (_rightHeight % 2016 * _right.extractDifficulty())) {
                return _right.hash256();
            } else {
                return _left.hash256();
            }
        }
    }

    /// @notice             Decides which header is heaviest from the ancestor
    /// @dev                Does not support reorgs above 2017 blocks (:
    /// @param _ancestor    The prospective shared ancestor
    /// @param _left        A chain tip
    /// @param _right       A chain tip
    /// @return             true if it is the most recent common ancestor within _limit, false otherwise
    function heaviestFromAncestor(
        bytes32 _ancestor,
        bytes calldata _left,
        bytes calldata _right
    ) external view returns (bytes32) {
        return _heaviestFromAncestor(_ancestor, _left, _right);
    }
}
