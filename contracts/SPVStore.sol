pragma solidity ^0.4.24;

/** @title BitcoinSPVDemo */
/** @author Summa (https://summa.one) */

import {BytesLib} from "./BytesLib.sol";
import {SafeMath} from "./SafeMath.sol";
import {TX, WitnessOutput, BlockHeader, BTCUtils} from "./SPV.sol";

contract SPVStore {

    using TX for bytes;
    using BTCUtils for bytes;
    using BlockHeader for bytes;
    using WitnessOutput for bytes;
    using BytesLib for bytes;
    using SafeMath for uint256;

    enum OutputTypes {
        NONE,
        WPKH,
        WSH,
        OP_RETURN
    }

    struct TxIn {
        uint32 sequence;
        bytes32 outpoint;
    }

    struct TxOut {
        uint64 value;
        OutputTypes outputType;
        bytes payload;  // pubkey hash, script hash, or OP_RETURN data
    }

    struct Transaction {
        bytes32 txid;     // LE Txid
        uint32 locktime;
        uint8 numInputs;
        uint8 numOutputs;
        TxIn[] inputs;
        TxOut[] outputs;
    }

    struct Header {
        bytes32 digest;     // LE digest
        uint32 version;     // 4 byte version
        bytes32 prevblock;  // 32 byte previous block hash
        bytes32 merkleRoot; // 32 byte tx root
        uint32 timestamp;   // 4 byte timestamp
        uint256 target;     // 4 byte nBits == 32 byte integer
        uint32 nonce;       // 4 byte nonce
    }

    event Validated(bytes32 indexed _hash);
    event TxParsed(bytes32 indexed _hash);
    event HeaderParsed(bytes32 indexed _hash);
    event WorkTooLow(bytes32 indexed _hash, uint256 _haash, uint256 indexed _target);

    mapping(bytes32 => Transaction) public transactions;  // txns
    mapping(bytes32 => Header) public headers;  // Parsed headers


    // @notice          Parses, a tx, validates its inclusion in the block, stores to the mapping
    // @dev             hashes are all little-endian
    // @param _tx       The raw byte transaction
    // @param _proof    The raw byte proof (concatenated LE hashes)
    // @param _header   The raw byte header
    // @returns         true if fully valid, false otherwise
    function validateTransaction(
        bytes _tx,
        bytes _proof,
        uint _index,
        bytes _header
    ) public returns (bool) {
        bytes32 _txid = parseAndStoreTransaction(_tx);
        bytes32 _blockHash = parseAndStoreHeader(_header);
        if( _txid == bytes32(0)  // Parsing failed
            || _blockHash == bytes32(0)  // Parsing failed
            || _proof.slice(0, 32).toBytes32() != _txid  // First hash in proof is not the txid
            || _proof.slice(_proof.length - 32, 32).toBytes32() != headers[_blockHash].merkleRoot  // Last hash in proof is not the merkle root
            || !_proof.verifyHash256Merkle(_index)
        ) {  // Merkle proof failed
            return false;
        }
        emit Validated(_txid);
        return true;
    }

    // @notice      Parses and stores a Transaction struct from a bytestring
    // @dev         This supports ONLY WITNESS INPUTS AND OUTPUTS
    // @param _tx   The raw byte transaction
    // @returns     The LE TXID
    function parseAndStoreTransaction(
        bytes _tx
    ) public returns (bytes32) {
        if (!validatePrefix(_tx)) {
            // Bubble up error
            return ;
        }

        uint8 _numInputs = _tx.extractNumInputs();
        uint8 _numOutputs = _tx.extractNumOutputs();
        // 4 bytes version, 2 bytes flag
        // 2 bytes numIn + numOut
        // 41 bytes per input, variable per output
        uint preWitnessLen = 4 + 2 + 2 + (_numInputs * 41);

        TxIn[] memory _inputs = new TxIn[](_numInputs);
        TxOut[] memory _outputs = new TxOut[](_numOutputs);

        // Parse inputs
        for (uint8 i = 0; i < _numInputs; i++) {

            _inputs[i] = parseInput(_tx.extractInputAtIndex(i));
            if (_inputs[i].outpoint == bytes32(0)) {
                // Bubble up error
                return ;
            }
        }

        // Parse outputs
        // Track the number of bytes we process so that we can build the txid later
        for (i = 0; i < _numOutputs; i++) {
            _outputs[i] = parseOutput(_tx.extractOutputAtIndex(i));
            preWitnessLen += 11 + _outputs[i].payload.length;
            if (_outputs[i].outputType == OutputTypes.NONE) {
                // Bubble up error
                return ;
            }
        }

        bytes32 _txid = abi.encodePacked(
            _tx.slice(0, 4), // version
            _tx.slice(6, preWitnessLen - 6), // inputs and outputs
            _tx.extractLocktimeLE()
        ).hash256().toBytes32();

        uint32 _locktime = _tx.extractLocktime();

        transactions[_txid].txid = _txid;
        transactions[_txid].locktime = _locktime;
        transactions[_txid].numInputs = _numInputs;
        transactions[_txid].numOutputs = _numOutputs;

        // Iterating because solidity sucks
        // This can be improved when solidity can copy
        //    memory structs and arrays to storage
        for (i = 0; i < _numInputs; i++) {
            transactions[_txid].inputs.push(_inputs[i]);
        }

        for (i = 0; i < _numOutputs; i++) {
            transactions[_txid].outputs.push(_outputs[i]);
        }

        emit TxParsed(_txid);
        return _txid;
    }

    // @notice      Validates the first 6 bytes of a block
    // @dev         The first byte is the version. The next 5 must be 0x0000000001
    // @param _tx   The raw byte tx
    // @returns     true if valid, otherwise false
    function validatePrefix(
        bytes _tx
    ) pure internal returns (bool) {
        bytes32 _versionHash = keccak256(_tx.slice(0, 1));
        return (
            (_versionHash == keccak256(hex'01') || _versionHash == keccak256(hex'02'))  // version 1 or 2
                && keccak256(_tx.slice(1, 5)) == keccak256(hex'0000000001'));  // has segwit flag
    }

    // @notice      Parses a TxIn struct from raw input bytes
    // @dev         Checks for blank scriptsig
    // @param _tx   The raw byte input
    // @returns     A TxIn struct
    function parseInput(
        bytes _input
    ) pure internal returns (TxIn) {
        if(keccak256(_input.slice(36, 1)) != keccak256(hex'00')) {
            // Bubble up error
            return ;
        }
        return TxIn(
            _input.extractSequence(),
            _input.extractOutpoint().toBytes32());
    }

    // @notice      Parses a TxOut struct from raw output bytes
    // @dev         Differentiates by output script prefix
    // @param _tx   The raw bytes output
    // @returns     A TxOut struct
    function parseOutput(
        bytes _output
    ) pure internal returns (TxOut) {
        uint64 _value = _output.extractValue();
        OutputTypes _outputType;
        bytes memory _payload;

        if (keccak256(_output.slice(9, 1)) == keccak256(hex'6a')) {
            // OP_RETURN
            _outputType = OutputTypes.OP_RETURN;
            _payload = _output.extractOpReturnData();
        } else {
            bytes32 _prefixHash = keccak256(_output.slice(8, 2));
            if (_prefixHash == keccak256(hex'2200')) {
                // P2WSH
                _outputType = OutputTypes.WSH;
                _payload = _output.slice(11, 32);
            } else if (_prefixHash == keccak256(hex'1600')) {
                // P2WPKH
                _outputType = OutputTypes.WPKH;
                _payload = _output.slice(11, 20);
            } else {
            // Bubble up error if we fall through ifs
            return ;
            }
        }

        return TxOut(
            _value,
            _outputType,
            _payload);
    }

    // @notice      Parses and stores a Header struct from a bytestring
    // @dev         Block headers are always 80 bytes, see Bitcoin docs.
    // @param _tx   The raw byte header
    // @returns     The LE block hash
    function parseAndStoreHeader(
        bytes _header
    ) public returns (bytes32) {
        Header memory _h = parseHeader(_header);
        if(_h.digest != bytes32(0)) {
            if(abi.encodePacked(_h.digest).bytesToUint() > _h.target) {
                emit WorkTooLow(_h.digest, abi.encodePacked(_h.digest).bytesToUint(), _h.target);
                return bytes32(0);
            }
            headers[_h.digest] = _h;
            emit HeaderParsed(_h.digest);
        }
        return _h.digest;
    }

    // @notice      Parses a block header struct from a bytestring
    // @dev         Block headers are always 80 bytes, see Bitcoin docs.
    // @param _tx   The raw byte header
    // @returns     The parsed Header struct
    function parseHeader(
        bytes _header
    ) pure internal returns (Header) {
        if(_header.length != 80) {
            // Bubble up error
            return ;
        }
        uint32 _version = uint32(_header.slice(0, 4).reverseEndianness().bytesToUint());
        bytes32 _prevblock = _header.extractPrevBlockLE().toBytes32();
        bytes32 _merkleRoot = _header.extractMerkleRootLE().toBytes32();
        uint32 _timestamp = _header.extractTimestamp();
        uint256 _target = _header.extractTarget();
        uint32 _nonce = uint32(_header.slice(76, 4).reverseEndianness().bytesToUint());
        bytes32 _digest = _header.hash256().reverseEndianness().toBytes32(); // Make it LE

        return Header(
            _digest,
            _version,
            _prevblock,
            _merkleRoot,
            _timestamp,
            _target,
            _nonce
        );
    }
}
