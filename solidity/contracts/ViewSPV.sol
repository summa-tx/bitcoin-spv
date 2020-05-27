pragma solidity ^0.5.10;

/** @title ValidateSPV*/
/** @author Summa (https://summa.one) */

import {TypedMemView} from "./TypedMemView.sol";
import {ViewBTC} from "./ViewBTC.sol";
import {SafeMath} from "./SafeMath.sol";


library ValidateSPV {
    using TypedMemView for bytes;
    using TypedMemView for bytes29;
    using ViewBTC for bytes29;
    using SafeMath for uint256;

    uint256 constant ERR_BAD_LENGTH = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    uint256 constant ERR_INVALID_CHAIN = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe;
    uint256 constant ERR_LOW_WORK = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd;

    function getErrBadLength() internal pure returns (uint256) {
        return ERR_BAD_LENGTH;
    }

    function getErrInvalidChain() internal pure returns (uint256) {
        return ERR_INVALID_CHAIN;
    }

    function getErrLowWork() internal pure returns (uint256) {
        return ERR_LOW_WORK;
    }

    /// @notice                     Validates a tx inclusion in the block
    /// @dev                        `index` is not a reliable indicator of location within a block
    /// @param _txid                The txid (LE)
    /// @param _merkleRoot          The merkle root (as in the block header)
    /// @param _intermediateNodes   The proof's intermediate nodes (digests between leaf and root)
    /// @param _index               The leaf's index in the tree (0-indexed)
    /// @return                     true if fully valid, false otherwise
    function prove(
        bytes32 _txid,
        bytes32 _merkleRoot,
        bytes29 _intermediateNodes,
        uint _index
    ) internal view returns (bool) {
        // Shortcut the empty-block case
        if (_txid == _merkleRoot && _index == 0 && _intermediateNodes.len() == 0) {
            return true;
        }

        bytes29 _nodes = _intermediateNodes.tryAsMerkleArray().assertValid();

        return ViewBTC.checkMerkle(_txid, _nodes, _merkleRoot, _index);
    }

    /// @notice             Hashes transaction to get txid
    /// @dev                Supports Legacy and Witness
    /// @param _version     4-bytes version
    /// @param _vin         Raw bytes length-prefixed input vector
    /// @param _vout        Raw bytes length-prefixed output vector
    /// @param _locktime    4-byte tx locktime
    /// @return             32-byte transaction id, little endian
    function calculateTxId(
        bytes4 _version,
        bytes29 _vin,
        bytes29 _vout,
        bytes4 _locktime
    ) internal view returns (bytes32) {
        bytes29 _ins = _vin.tryAsVin().assertValid();
        bytes29 _outs = _vout.tryAsVin().assertValid();
        // lazy. causes an extra allocation of vin and vout
        // TODO: write in assembly
        return abi.encodePacked(_version, _ins.clone(), _outs.clone(), _locktime).ref(0).hash256();
    }

    /// @notice             Checks validity of header work
    /// @param _header      Header view
    /// @param _target      The target threshold
    /// @return             true if header work is valid, false otherwise
    function checkWork(bytes29 _header, uint256 _target) internal view returns (bool) {
        return _header.work() < _target;
    }


    /// @notice                     Checks validity of header chain
    /// @dev                        Compares current header parent to previous header's digest
    /// @param _header              The raw bytes header
    /// @param _prevHeaderDigest    The previous header's digest
    /// @return                     true if the connect is valid, false otherwise
    function checkParent(bytes29 _header, bytes32 _prevHeaderDigest) internal pure returns (bool) {
        return _header.parent() == _prevHeaderDigest;
    }

    /// @notice             Checks validity of header chain
    /// @notice             Compares the hash of each header to the prevHash in the next header
    /// @param _headers     Raw byte array of header chain
    /// @return             The total accumulated difficulty of the header chain, or an error code
    function validateHeaderChain(bytes29 _headers) internal view returns (uint256 _totalDifficulty) {
        bytes29 _headerChain = _headers.tryAsHeaderArray().assertValid();
        bytes32 _digest;

        for (uint256 i = 0; i < _headerChain.len() / 80; i += 1) {
            bytes29 _header = _headerChain.indexHeaderArray(i);
            if (i != 0) {
                if (!checkParent(_header, _digest)) {return ERR_INVALID_CHAIN;}
            }
            // ith header target
            uint256 _target = _header.target();
            if (!checkWork(_header, _target)) {
                return ERR_LOW_WORK;
            }

            _totalDifficulty += ViewBTC.toDiff(_target);
        }
    }
}
