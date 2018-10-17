pragma solidity 0.4.25;

/** @title BitcoinSPVDemo */
/** @author Summa (https://summa.one) */

import {BytesLib} from "./BytesLib.sol";
import {SafeMath} from "./SafeMath.sol";
import {BTCUtils} from "./BTCUtils.sol";
import {ValidateSPV} from "./ValidateSPV.sol";


contract SPVStore is ValidateSPV {

    using BTCUtils for bytes;
    using BytesLib for bytes;
    using SafeMath for uint256;

    /// @notice         Parses, a tx, valides its inclusdion in the block, stores to the
    /// @notice         mapping
    /// @param _tx      The raw byte tx
    /// @param _proof   The raw byte proof (concatenated LE hashes)
    /// @param _index   The index of the leaf
    /// @param _header  The raw byte header
    /// @return         true if fully valid, false otherwise
    function validateTransaction(bytes _tx, bytes _proof, uint _index, bytes _header) public returns (bytes32) {

        bytes32 _txid = parseAndStoreTransaction(_tx);

        bytes32 _blockHash = parseAndStoreHeader(_header);

        // If parsing failed || first hash in proof is not the txid || last hash in proof is not the merkle root ||
        // merkle root is invalid: then Merkle proof failed, bubble up error
        if (_txid == bytes32(0) || _blockHash == bytes32(0) || _proof.slice(0, 32).toBytes32() != _txid
        || _proof.slice(_proof.length - 32, 32).toBytes32() != headers[_blockHash].merkleRoot
        || !_proof.verifyHash256Merkle(_index)) { return; }

        // Emit Validated event
        emit Validated(_txid);

        // Return transaction hash
        return _txid;
    }

    /// @notice         Parses and stores a Transaction struct from a bytestring
    /// @dev            This supports ONLY WITNESS INPUTS AND OUTPUTS
    /// @param _tx      Raw bytes tx
    /// @return         Transaction id, little endian
    function parseAndStoreTransaction(bytes _tx) public returns (bytes32) {

        // If invalid prefix, bubble up error
        if (!validatePrefix(_tx)) { return; }

        uint8 _numInputs = _tx.extractNumInputs();
        uint8 _numOutputs = _tx.extractNumOutputs();

        // inputs and outputs
        // 4 bytes version, 2 bytes flag
        // 2 bytes numIn + numOut
        // 41 bytes per input, variable per output
        uint preWitnessLen = 4 + 2 + 2 + (_numInputs * 41);

        TxIn[] memory _inputs = new TxIn[](_numInputs);
        TxOut[] memory _outputs = new TxOut[](_numOutputs);

        // Parse inputs
        for (uint8 i = 0; i < _numInputs; i++) {

            _inputs[i] = parseInput(_tx.extractInputAtIndex(i));

            // If invalid outpoint, ubble up error
            if (_inputs[i].outpoint == bytes32(0)) { return; }
        }

        // Parse outputs
        // Track the number of bytes we process so that we can build the txid later
        for (i = 0; i < _numOutputs; i++) {

            _outputs[i] = parseOutput(_tx.extractOutputAtIndex(i));

            preWitnessLen += 11 + _outputs[i].payload.length;

            // If unidentifiable output type, bubble up error
            if (_outputs[i].outputType == OutputTypes.NONE) { return; }
        }

        // Get transaction hash
        bytes32 _txid = abi.encodePacked(
            _tx.slice(0, 4), _tx.slice(6, preWitnessLen - 6), _tx.extractLocktimeLE()).hash256();

        uint32 _locktime = _tx.extractLocktime();

        transactions[_txid].txid = _txid;
        transactions[_txid].locktime = _locktime;
        transactions[_txid].numInputs = _numInputs;
        transactions[_txid].numOutputs = _numOutputs;

        // This can be improved when solidity can copy memory structs and arrays to storage
        for (i = 0; i < _numInputs; i++) {
            transactions[_txid].inputs.push(_inputs[i]);
        }

        for (i = 0; i < _numOutputs; i++) {
            transactions[_txid].outputs.push(_outputs[i]);
        }

        // Emit TxParsed event
        emit TxParsed(_txid);

        // Return transaction hash
        return _txid;
    }

    /// @notice         Parses and stores a Header struct from a bytestring
    /// @dev            Block headers are always 80 bytes, see Bitcoin docs
    /// @param _header  Raw bytes header
    /// @return         Block hash, little endian
    function parseAndStoreHeader(bytes _header) public returns (bytes32) {

        Header memory _h = parseHeader(_header);

        // If header is valid and could be parsed, check work and store
        if (_h.digest != bytes32(0)) {

            // If work is too low, emit WorkTooLow event, bubble up error
            if (abi.encodePacked(_h.digest).bytesToUint() > _h.target) {
                emit WorkTooLow(_h.digest, abi.encodePacked(_h.digest).bytesToUint(), _h.target);
                return;
            }

            // Store parsed header in headers mapping
            headers[_h.digest] = _h;

            // Emit HeaderParsed event
            emit HeaderParsed(_h.digest);
        } else {
            // If header is invalid and could not be parsed, bubble up error
            return;
        }

        // Return header digest
        return _h.digest;
    }

    /// @notice         Returns tx output value
    /// @param _txid    Transaction id
    /// @param _index   Output index to return value from
    /// @return         Value of tx output
    function getTxOutValue(bytes32 _txid, uint256 _index) public view returns (uint64) {
        Transaction memory _tx = transactions[_txid];
        return _tx.outputs[_index].value;
    }

    /// @notice         Returns tx output type (NONE, WPKH, WSH, OP_RETURN)
    /// @param _txid    Transaction id
    /// @param _index   Output index to return output type from
    /// @return         Output type of tx output
    function getTxOutOutputType(bytes32 _txid, uint256 _index) public view returns (OutputTypes) {
        Transaction memory _tx = transactions[_txid];
        return _tx.outputs[_index].outputType;
    }

    /// @notice         Returns tx output payload
    /// @param _txid    Transaction id
    /// @param _index   Output index to return payload from
    /// @return         Payload of tx output
    function getTxOutPayload(bytes32 _txid, uint256 _index) public view returns (bytes) {
        Transaction memory _tx = transactions[_txid];
        return _tx.outputs[_index].payload;
    }

    /// @notice         Validates the first 6 bytes of a block
    /// @dev            First byte is the version. The next must be 0x0000000001
    /// @param _tx      Raw byte tx
    /// @return         true if valid, otherwise false
    function validatePrefix(bytes _tx) internal pure returns (bool) {

        bytes32 _versionHash = keccak256(_tx.slice(0, 1));

        // Return true if prefix is version 1 or 2 and has segwit flag
        return ((_versionHash == keccak256(hex'01') || _versionHash == keccak256(hex'02'))
                && keccak256(_tx.slice(1, 5)) == keccak256(hex'0000000001'));
    }

    /// @notice         Parses a TxIn struct from raw input bytes
    /// @dev            Checks for blank scriptSig
    /// @param _input   Raw bytes tx input
    /// @return         TxIn struct
    function parseInput(bytes _input) internal pure returns (TxIn) {

        // If no 00 scriptSig, bubble up error
        if (keccak256(_input.slice(36, 1)) != keccak256(hex'00')) { return; }

        return TxIn(_input.extractSequence(), _input.extractOutpoint().toBytes32());
    }

    /// @notice         Parses a TxOut struct from raw output bytes
    /// @dev            Differentiates by output script prefix
    /// @param _output  Raw bytes tx output
    /// @return         TxOut struct
    function parseOutput(bytes _output) internal pure returns (TxOut) {

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
                // If unidentifiable output type, bubble up error
                return;
            }
        }

        return TxOut(_value, _outputType, _payload);
    }

    /// @notice         Parses a block header struct from a bytestring
    /// @dev            Block headers are always 80 bytes, see Bitcoin docs
    /// @param _header  Raw bytes header
    /// @return         Parsed Header struct
    function parseHeader(bytes _header) internal pure returns (Header) {

        // If header has an invalid length, ubble up error
        if (_header.length != 80) { return; }

        uint32 _version = uint32(_header.slice(0, 4).reverseEndianness().bytesToUint());
        bytes32 _prevblock = _header.extractPrevBlockLE().toBytes32();
        bytes32 _merkleRoot = _header.extractMerkleRootLE().toBytes32();
        uint32 _timestamp = _header.extractTimestamp();
        uint256 _target = _header.extractTarget();
        uint32 _nonce = uint32(_header.slice(76, 4).reverseEndianness().bytesToUint());
        // LE digest
        bytes32 _digest = abi.encodePacked(_header.hash256()).reverseEndianness().toBytes32();

        return Header(_digest, _version, _prevblock, _merkleRoot, _timestamp, _target, _nonce);
    }
}
