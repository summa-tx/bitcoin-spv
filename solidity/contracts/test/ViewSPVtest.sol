pragma solidity ^0.5.10;

/** @title ViewSPV */
/** @author Summa (https://summa.one) */

import {TypedMemView} from "@summa-tx/memview.sol/contracts/TypedMemView.sol";
import {ViewBTC} from "../ViewBTC.sol";
import {ViewSPV} from "../ViewSPV.sol";

contract ViewSPVTest {
    using TypedMemView for bytes;
    using TypedMemView for bytes29;
    using ViewBTC for bytes29;
    using ViewSPV for bytes29;

    function getErrBadLength() public pure returns (uint256) {
        return ViewSPV.getErrBadLength();
    }

    function getErrInvalidChain() public pure returns (uint256) {
        return ViewSPV.getErrInvalidChain();
    }

    function getErrLowWork() public pure returns (uint256) {
        return ViewSPV.getErrLowWork();
    }

    /// @notice                 Valides a tx inclusion in the block
    /// @param _txid            The txid (LE)
    /// @param _merkleRoot      The merkle root
    /// @param _proof           The proof (concatenated LE hashes)
    /// @param _index           The proof index
    /// @return                 true if fully valid, false otherwise
    function prove(
        bytes32 _txid,
        bytes32 _merkleRoot,
        bytes memory _proof,
        uint _index
    ) public view returns (bool) {
        bytes29 _proof_ref = _proof.ref(0).tryAsMerkleArray();
        return ViewSPV.prove(_txid, _merkleRoot, _proof_ref, _index);
    }

    /// @notice             Hashes transaction to get txid
    /// @dev                This supports legacy now
    /// @param _version     4-bytes version
    /// @param _vin         Raw bytes length-prefixed input vector
    /// @param _vout        Raw bytes length-prefixed output vector
    /// @ param _locktime   4-byte tx locktime
    /// @return             32-byte transaction id, little endian
    function calculateTxId(
        bytes4 _version,
        bytes memory _vin,
        bytes memory _vout,
        bytes4 _locktime
    ) public view returns (bytes32) {
        bytes29 _ins = _vin.ref(0).tryAsVin().assertValid();
        bytes29 _outs = _vout.ref(0).tryAsVout().assertValid();
        return ViewSPV.calculateTxId(_version, _ins, _outs, _locktime);
    }

    /// @notice             Checks validity of header work
    /// @param _header      Header view
    /// @param _target      The target threshold
    /// @return             true if header work is valid, false otherwise
    function checkWork(bytes memory _header, uint256 _target) public view returns (bool) {
        return _header.ref(0).tryAsHeader().assertValid().checkWork(_target);
    }

    /// @notice             Checks validity of header chain
    /// @notice             Compares the hash of each header to the prevHash in the next header
    /// @param _headers     Raw byte array of header chain
    /// @return             The total accumulated difficulty of the header chain
    function checkChain(bytes memory _headers) public view returns (uint256 _reqDiff) {
        return _headers.ref(0).tryAsHeaderArray().assertValid().checkChain();
    }

    /// @notice             Checks validity of header chain
    /// @notice             Compares the hash of each header to the prevHash in the next header
    /// @param _headers     Raw byte array of header chain
    /// @return             The total accumulated difficulty of the header chain
    function checkChainTx(bytes memory _headers) public view returns (uint256 _reqDiff) {
        return _headers.ref(0).tryAsHeaderArray().assertValid().checkChain();
    }

    /// @notice                     Checks validity of header chain
    /// @dev                        Compares current header prevHash to previous header's digest
    /// @param _header              The raw bytes header
    /// @param _prevHeaderDigest    The previous header's digest
    /// @return                     true if header chain is valid, false otherwise
    function checkParent(bytes memory _header, bytes32 _prevHeaderDigest) public pure returns (bool) {
        return _header.ref(0).tryAsHeader().assertValid().checkParent(_prevHeaderDigest);
    }
}
