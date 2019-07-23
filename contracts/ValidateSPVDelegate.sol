pragma solidity ^0.5.10;

/** @title ValidateSPV*/
/** @author Summa (https://summa.one) */

import {ValidateSPV} from "./ValidateSPV.sol";


contract ValidateSPVDelegate {

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
        return ValidateSPV.prove(
            _txid,
            _merkleRoot,
            _proof,
            _index);
    }

    /// @notice         Validates a tx from a bytestring
    /// @dev            This supports ONLY WITNESS INPUTS AND OUTPUTS
    /// @param _tx      Raw bytes tx
    /// @return         Transaction num inputs, inputs, num outputs, outputs, locktime, txid
    function parseTransaction(
        bytes memory _tx
    )
    public pure returns (
        bytes memory _nInputs,
        bytes memory _inputs,
        bytes memory _nOutputs,
        bytes memory _outputs,
        bytes memory _locktime,
        bytes32 _txid
    ) {
        return ValidateSPV.parseTransaction(_tx);
    }

    /// @notice         Parses tx input
    /// @param _tx      The raw byte tx
    /// @return         Raw bytes num inputs and inputs
    function extractAllInputs(bytes memory _tx) public pure returns (bytes memory _nInputs, bytes memory _inputs) {
        return ValidateSPV.extractAllInputs(_tx);
    }

    /// @notice         Parses tx outputs
    /// @param _tx      The raw byte tx
    /// @return         Raw bytes num outputs and outputs
    function extractAllOutputs(bytes memory _tx) public pure returns (bytes memory _nOutputs, bytes memory _outputs) {
        return ValidateSPV.extractAllOutputs(_tx);
    }

    /// @notice             Hashes transaction to get txid
    /// @dev                This supports ONLY WITNESS INPUTS AND OUTPUTS
    /// @param _version     4-bytes version
    /// @param _nInputs     1-byte num inputs
    /// @param _inputs      Raw bytes inputs
    /// @param _nOutputs    1-byte num outputs
    /// @param _outputs     Raw bytes ouputs
    /// @return             32-byte transaction id, little endian
    function calculateTxId(
        bytes memory _version,
        bytes memory _nInputs,
        bytes memory _inputs,
        bytes memory _nOutputs,
        bytes memory _outputs,
        bytes memory _locktime
    ) public pure returns (bytes32) {
        return ValidateSPV.calculateTxId(
            _version,
            _nInputs,
            _inputs,
            _nOutputs,
            _outputs,
            _locktime);
    }

    /// @notice         Validates the first 6 bytes of a transaction
    /// @dev            First byte is the version. The next must be 0x0000000001
    /// @param _bytes   Prefixed raw byte string (probably a tx)
    /// @return         true if valid, otherwise false
    function validatePrefix(bytes memory _bytes) public pure returns (bool) {
        return ValidateSPV.validatePrefix(_bytes);
    }

    /// @notice         Parses a tx input from raw input bytes
    /// @dev            Checks for blank scriptSig
    /// @param _input   Raw bytes tx input
    /// @return         Tx input sequence number, tx hash, and index
    function parseInput(bytes memory _input) public pure returns (uint32 _sequence, bytes32 _hash, uint32 _index) {
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
