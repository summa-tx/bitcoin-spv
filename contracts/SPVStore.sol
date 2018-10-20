pragma solidity 0.4.25;

/** @title BitcoinSPVDemo */
/** @author Summa (https://summa.one) */

import {ValidateSPV} from "./ValidateSPV.sol";
import {BTCUtils} from "./BTCUtils.sol";
import {BytesLib} from "./BytesLib.sol";
import {SafeMath} from "./SafeMath.sol";


contract SPVStore {

    using ValidateSPV for bytes;
    using ValidateSPV for bytes32;
    using BTCUtils for bytes;
    using BytesLib for bytes;
    using SafeMath for uint256;

    event Validated(bytes32 indexed _hash);
    event TxParsed(bytes32 indexed _hash);
    event HeaderParsed(bytes32 indexed _digest);

    enum OutputTypes { NONE, WPKH, WSH, OP_RETURN }

    struct TxIn {
        uint32 sequence;            // 4 byte sequence number
        bytes32 hash;               // 32 byte previous tx hash
        uint32 index;               // 4 bytes index
    }

    struct TxOut {
        uint64 value;               // 8 byte value
        OutputTypes outputType;
        bytes payload;              // pubkey hash, script hash, or OP_RETURN data
    }

    struct Transaction {
        bytes32 txid;               // 32 byte tx id, little endian
        uint32 locktime;            // 4 byte locktime
        uint8 numInputs;            // number tx inputs
        uint8 numOutputs;           // number tx outputs
        mapping (uint8 => TxIn) inputs;
        mapping (uint8 => TxOut) outputs;
    }

    struct Header {
        bytes32 digest;             // 32 byte little endian digest
        uint32 version;             // 4 byte version
        bytes32 prevHash;          // 32 byte previous block hash
        bytes32 merkleRoot;         // 32 byte tx root
        uint32 timestamp;           // 4 byte timestamp
        uint256 target;             // 4 byte nBits == 32 byte integer
        uint32 nonce;               // 4 byte nonce
    }

    mapping(bytes32 => Transaction) public transactions;    // Transactions
    mapping(bytes32 => Header) public headers;              // Parsed headers

    /// @notice         Parses, a tx, valides its inclusdion in the block, stores to the mapping
    /// @param _txid    The transaction hash
    /// @param _digest  The header hash
    /// @param _proof   The raw byte proof (concatenated LE hashes)
    /// @param _index   The index of the leaf
    /// @return         true if fully valid, false otherwise
    function validate( bytes32 _txid, bytes32 _digest, bytes _proof, uint _index) public returns (bool) {

        // Return false if invalid proof
        if (!_txid.prove(_digest, headers[_digest].merkleRoot, _proof, _index)) { return false; }

        // Emit Validated event
        emit Validated(_txid);

        // Return true if valid proof
        return true;
    }

    /// @notice         Parses, a tx, valides its inclusdion in the block, stores to the mapping
    /// @param _tx      The raw byte tx
    /// @return         true if fully valid, false otherwise
    function parseAndStoreTransaction(bytes _tx) public returns (bytes32) {

        bytes memory _nIns;
        bytes memory _ins;
        bytes memory _nOuts;
        bytes memory _outs;
        bytes memory _locktime;
        bytes32 _txid;

        (_nIns, _ins, _nOuts, _outs, _locktime, _txid) = _tx.parseTransaction();
        uint8 _nInputs = uint8(_nIns.bytesToUint());
        uint8 _nOutputs = uint8(_nOuts.bytesToUint());

        transactions[_txid].txid = _txid;
        transactions[_txid].locktime = uint32(_locktime.bytesToUint());
        transactions[_txid].numInputs = _nInputs;
        transactions[_txid].numOutputs = _nOutputs;

        // Parse and store inputs, if failed to parse or store then bubble up error
        if (!parseAndStoreInputs(_txid, _tx, _nInputs)) { return; }

        // Parse and store outputs, if failed to parse or store then bubble up error
        if (!parseAndStoreOutputs(_txid, _tx, _nOutputs)) { return; }

        // Emit TxParsed event
        emit TxParsed(_txid);

        // Return transaction hash
        return _txid;
    }

    function parseAndStoreInputs(bytes32 _txid, bytes _tx, uint8 _nInputs) internal returns (bool) {
        TxIn memory _inputs;

        for (uint8 i = 0; i < _nInputs; i++) {

            (_inputs.sequence, _inputs.hash, _inputs.index) = _tx.extractInputAtIndex(i).parseInput();

            // If invalid outpoint, bubble up error
            if (_inputs.hash == bytes32(0)) { return false; }

            transactions[_txid].inputs[i] = _inputs;
        }
        
        return true;
    }

    function parseAndStoreOutputs(bytes32 _txid, bytes _tx, uint8 _nOutputs) internal returns (bool) {
        uint8 _outputType;
        TxOut memory _outputs;

        for (uint8 i = 0; i < _nOutputs; i++) {

            (_outputs.value, _outputType, _outputs.payload)  = _tx.extractOutputAtIndex(i).parseOutput();

            // If unidentifiable output type, return false
            if (_outputType == 0) { return false; }

            if (_outputType == 1) {
                _outputs.outputType = OutputTypes.WPKH;
            } else if (_outputType == 2) {
                _outputs.outputType = OutputTypes.WSH;
            } else if (_outputType == 3) {
                _outputs.outputType == OutputTypes.OP_RETURN; 
            }

            transactions[_txid].outputs[i] = _outputs;
        }
        
        return true;
    }

    function parseAndStoreHeader(bytes _header) public returns (bytes32) {

        bytes32 _digest;
        uint32 _version;
        bytes32 _prevHash;
        bytes32 _merkleRoot;
        uint32 _timestamp;
        uint256 _target;
        uint32 _nonce;

        (_digest, _version, _prevHash, _merkleRoot, _timestamp, _target, _nonce) = _header.parseHeader();

        headers[_digest].digest = _digest;
        headers[_digest].version = _version;
        headers[_digest].prevHash = _prevHash;
        headers[_digest].merkleRoot = _merkleRoot;
        headers[_digest].timestamp = _timestamp;
        headers[_digest].target = _target;
        headers[_digest].nonce = _nonce;

        // Emit HeaderParsed event
        emit HeaderParsed(_digest);

        // Return header digest
        return _digest;
    }
}
