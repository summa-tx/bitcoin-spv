pragma solidity 0.4.25;

/** @title ValidateSPV*/
/** @author Summa (https://summa.one) */

import {BytesLib} from "./BytesLib.sol";
import {SafeMath} from "./SafeMath.sol";
import {BTCUtils} from "./BTCUtils.sol";


library ValidateSPV {

    using BTCUtils for bytes;
    using BytesLib for bytes;
    using SafeMath for uint256;

    // /// @notice         Parses, a tx, valides its inclusdion in the block, stores to the
    // /// @notice         mapping
    // /// @param _tx      The raw byte tx
    // /// @param _proof   The raw byte proof (concatenated LE hashes)
    // /// @param _header  The raw byte header
    // /// @return         true if fully valid, false otherwise
    // function validateTransaction(bytes _tx, bytes _proof, uint _index, bytes _header) public returns (bytes32);
    //
    // /// @notice         Parses and stores a Transaction struct from a bytestring
    // /// @dev            This supports ONLY WITNESS INPUTS AND OUTPUTS
    // /// @param _tx      Raw bytes tx
    // /// @return         Transaction id, little endian
    // function parseAndStoreTransaction(bytes _tx) public returns (bytes32);
    //
    // /// @notice         Parses and stores a Header struct from a bytestring
    // /// @dev            Block headers are always 80 bytes, see Bitcoin docs
    // /// @param _header  Raw bytes header
    // /// @return         Block hash, little endian
    // function parseAndStoreHeader(bytes _header) public returns (bytes32);
    //
    // /// @notice         Validates the first 6 bytes of a block
    // /// @dev            First byte is the version. The next must be 0x0000000001
    // /// @param _tx      Raw byte tx
    // /// @return         true if valid, otherwise false
    // function validatePrefix(bytes _tx) internal pure returns (bool);
    //
    // /// @notice         Parses a TxIn struct from raw input bytes
    // /// @dev            Checks for blank scriptSig
    // /// @param _input   Raw bytes tx input
    // /// @return         TxIn struct
    // function parseInput(bytes _input) internal pure returns (TxIn);
    //
    // /// @notice         Parses a TxOut struct from raw output bytes
    // /// @dev            Differentiates by output script prefix
    // /// @param _output  Raw bytes tx output
    // /// @return         TxOut struct
    // function parseOutput(bytes _output) internal pure returns (TxOut);

    /// @notice         Parses a block header struct from a bytestring
    /// @dev            Block headers are always 80 bytes, see Bitcoin docs
    /// @param _header  Raw bytes header
    /// @return         Header digest, version, previous block header hash, merkle root, timestamp, target, nonce
    function parseHeader(bytes _header) public pure returns (
        bytes32 _digest,
        uint32 _version,
        bytes32 _prevHash,
        bytes32 _merkleRoot,
        uint32 _timestamp,
        uint256 _target,
        uint32 _nonce
    ) {
        // If header has an invalid length, bubble up error
        // Check header chain length
        require(validateHeaderLength(_header), "Header chain must be divisible by 80.");

        _digest = abi.encodePacked(_header.hash256()).reverseEndianness().toBytes32();
        _version = uint32(_header.slice(0, 4).reverseEndianness().bytesToUint());
        _prevHash = _header.extractPrevBlockLE().toBytes32();
        _merkleRoot = _header.extractMerkleRootLE().toBytes32();
        _timestamp = _header.extractTimestamp();
        _target = _header.extractTarget();
        _nonce = uint32(_header.slice(76, 4).reverseEndianness().bytesToUint());

        return(_digest, _version, _prevHash, _merkleRoot, _timestamp, _target, _nonce);
    }
    
    /// @notice             Checks validity of header chain
    /// @notice             Compares the hash of each header to the prevHash in the next header
    /// @param _headers     Raw byte array of header chain
    /// @return             true if header chain is valid, false otherwise
    function validateHeaderChain(bytes _headers) public pure returns (bool) {

<<<<<<< HEAD
    struct Transaction {
        bytes32 txid;               // 32 byte tx id, little endian
        uint32 locktime;            // 4 byte locktime
        uint8 numInputs;            // number tx inputs
        uint8 numOutputs;           // number tx outputs
        mapping (uint8 => TxIn) inputs;
        mapping (uint8 => TxOut) outputs;
        /*TxIn[] inputs;              // tx input struct array
        TxOut[] outputs;            // tx output struct array*/
    }
=======
        // Check header chain length
        require(validateHeaderLength(_headers), "Header chain must be divisible by 80.");

        uint _nHeaders = _headers.length / 80;

        // Initialize header start index
        uint256 _start = 0;
        bytes memory _prevHeader;
        bytes memory _header;

        for (uint i = 0; i < _nHeaders - 1; i++) {

            // Previous header
            _prevHeader = _headers.slice(_start, 80);

            // Increment start index by 80 for next header
            _start = _start.add(80);
>>>>>>> ValidateSPV from contract to library, split up Header functions

            // Current header
            _header = _headers.slice(_start, 80);

            // Check if the hash of the previous header and the current header prevHash are equal
            if (!validateHeaderPrevHash(_prevHeader, _header)) { return false; }
        }

        return true;
    }

    function validateHeaderPrevHash(bytes _prevHeader, bytes _header) public pure returns (bool) {

        // prevHeader hash
        bytes32 _prevHeaderHash = _prevHeader.hash256();

        // prevHash of _header
        bytes32 _prevHash = _header.extractPrevBlockLE().toBytes32();

        if (_prevHeaderHash != _prevHash) { return false; }

        return true;
    }

    /// @notice             Validates that headers are the correct length
    /// @dev                Each header is 80 bytes
    /// @param _headers     Raw byte array of header chain
    /// @return             true if header byte array is divisible by 80, false otherwise
    function validateHeaderLength(bytes _headers) public pure returns (bool) {
        return (_headers.length % 80 == 0);
    }
}
