pragma solidity ^0.5.10;

/** @title ValidateSPV*/
/** @author Summa (https://summa.one) */

import {ValidateSPV} from "./ValidateSPV.sol";


library ValidateSPVDelegate {
    function getErrBadLength() public pure returns (uint256) {
        return ValidateSPV.getErrBadLength();
    }

    function getErrInvalidChain() public pure returns (uint256) {
        return ValidateSPV.getErrInvalidChain();
    }

    function getErrLowWork() public pure returns (uint256) {
        return ValidateSPV.getErrLowWork();
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
    ) public pure returns (bool) {
        return ValidateSPV.prove(_txid, _merkleRoot, _proof, _index);
    }

    /// @notice             Hashes transaction to get txid
    /// @dev                This supports legacy now
    /// @param _version     4-bytes version
    /// @param _vin         Raw bytes length-prefixed input vector
    /// @param _vout        Raw bytes length-prefixed output vector
    /// @ param _locktime   4-byte tx locktime
    /// @return             32-byte transaction id, little endian
    function calculateTxId(
        bytes memory _version,
        bytes memory _vin,
        bytes memory _vout,
        bytes memory _locktime
    ) public pure returns (bytes32) {
        return ValidateSPV.calculateTxId(_version, _vin, _vout, _locktime);
    }

    /// @notice         Parses a tx input from raw input bytes
    /// @dev            Supports Legacy Inputs now too
    /// @param _input   Raw bytes tx input
    /// @return         Tx input sequence number, tx hash, and index
    function parseInput(bytes memory _input) public pure returns (uint32 _sequence, bytes32 _hash, uint32 _index, uint8 _inputType) {
        return ValidateSPV.parseInput(_input);
    }

    /// @notice         Parses a tx output from raw output bytes
    /// @dev            Differentiates by output script prefix
    /// @param _output  Raw bytes tx output
    /// @return         Tx output value, output type, payload
    function parseOutput(bytes memory _output) public pure returns (uint64 _value, uint8 _outputType, bytes memory _payload) {
        return ValidateSPV.parseOutput(_output);
    }

    /// @notice             Parses a block header struct from a bytestring
    /// @dev                Block headers are always 80 bytes, see Bitcoin docs
    /// @return             Header digest, version, previous block header hash, merkle root, timestamp, target, nonce
    function parseHeader(bytes memory _header) public pure returns (
        bytes32 _digest,
        uint32 _version,
        bytes32 _prevHash,
        bytes32 _merkleRoot,
        uint32 _timestamp,
        uint256 _target,
        uint32 _nonce
    ) {
        return ValidateSPV.parseHeader(_header);
    }
    /// @notice             Checks validity of header chain
    /// @notice             Compares the hash of each header to the prevHash in the next header
    /// @param _headers     Raw byte array of header chain
    /// @return             The total accumulated difficulty of the header chain
    function validateHeaderChain(bytes memory _headers) public pure returns (uint256 _reqDiff) {
        return ValidateSPV.validateHeaderChain(_headers);
    }

    /// @notice             Checks validity of header work
    /// @param _digest      Header digest
    /// @param _target      The target threshold
    /// @return             true if header work is valid, false otherwise
    function validateHeaderWork(bytes32 _digest, uint256 _target) public pure returns (bool) {
        return ValidateSPV.validateHeaderWork(_digest, _target);
    }

    /// @notice                     Checks validity of header chain
    /// @dev                        Compares current header prevHash to previous header's digest
    /// @param _header              The raw bytes header
    /// @param _prevHeaderDigest    The previous header's digest
    /// @return                     true if header chain is valid, false otherwise
    function validateHeaderPrevHash(bytes memory _header, bytes32 _prevHeaderDigest) public pure returns (bool) {
        return ValidateSPV.validateHeaderPrevHash(_header, _prevHeaderDigest);
    }
}
