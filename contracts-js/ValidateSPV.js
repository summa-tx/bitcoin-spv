// import { S_IFBLK } from 'constants';

// pragma solidity ^0.5.10;

// /** @title ValidateSPV*/
// /** @author Summa (https://summa.one) */

// import {BytesLib} from "./BytesLib.sol";
// import {SafeMath} from "./SafeMath.sol";
// import {BTCUtils} from "./BTCUtils.sol";

const btcUtils = require("./BTCUtils");
const utils = require("../utils/utils");

const INPUT_TYPES = {
  NONE: 0,
  LEGACY: 1,
  COMPATIBILITY: 2,
  WITNESS: 3
}

const OUTPUT_TYPES = {
  NONE: 0,
  WPKH: 1,
  WSH: 2,
  OP_RETURN: 3,
  PKH: 4,
  SH: 5,
  NONSTANDARD: 6
}

// library ValidateSPV {
module.exports = {

  /**
   * @notice Validates a tx inclusion in the block
   * @param {Uint8Array} txid The txid (LE)
   * @param {Uint8Array} merkleRoot The merkle root (as in the block header)
   * @param {Uint8Array} intermediateNodes The proof's intermediate nodes (digests between leaf and root)
   * @param {number} index The leaf's index in the tree (0-indexed)
   * @returns {boolean} true if fully valid, false otherwise
   */
  prove: (txid, merkleRoot, intermediateNodes, index) => {
    // Shortcut the empty-block case
    if (utils.typedArraysAreEqual(txid, merkleRoot) && index === 0 && intermediateNodes.length == 0) {
      return true;
    }

    let proof = utils.concatUint8Arrays([txid, intermediateNodes, merkleRoot])
    // If the Merkle proof failed, bubble up error
    return btcUtils.verifyHash256Merkle(proof, index);
  },

  /**
   * @notice Hashes transaction to get txid
   * @dev Supports Legacy and Witness
   * @param {Uint8Array} version 4-bytes version
   * @param {Uint8Array} vin Raw bytes length-prefixed input vector
   * @param {Uint8Array} vout Raw bytes length-prefixed output vector
   * @param {Uint8Array} locktime 4-byte tx locktime
   * @returns {Uint8Array} 32-byte transaction id, little endian
   */
  calculateTxId: (version, vin, vout, locktime) => {
    return btcUtils.hash256(utils.concatUint8Arrays([version, vin, vout, locktime]));
  },

//     function parseInput(bytes memory _input) internal pure returns (uint32 _sequence, bytes32 _hash, uint32 _index, uint8 _inputType) {
//         // NB: If the scriptsig is exactly 00, we are witness.
//         //     Otherwise we are compatibility
//         if (keccak256(_input.slice(36, 1)) != keccak256(hex"00")) {
//             _sequence = _input.extractSequenceLegacy();
//             bytes32 _witnessTag = keccak256(_input.slice(36, 3));

//             if (_witnessTag == keccak256(hex"220020") || _witnessTag == keccak256(hex"160014")) {
//                 _inputType = uint8(InputTypes.COMPATIBILITY);
//             } else {
//                 _inputType = uint8(InputTypes.LEGACY);
//             }

//         } else {
//             _sequence = _input.extractSequenceWitness();
//             _inputType = uint8(InputTypes.WITNESS);
//         }

//         return (_sequence, _input.extractInputTxId(), _input.extractTxIndex(), _inputType);
//     }

  /// @notice         Parses a tx input from raw input bytes
  /// @dev            Supports Legacy and Witness inputs
  /// @param _input   Raw bytes tx input
  /// @return         Tx input sequence number, tx hash, and index
  /**
   * @notice Parses a tx input from raw input bytes
   * @dev Supports Legacy and Witness inputs
   * @param {Uint8Array} input bytes tx input
   * @returns {object} Tx input, sequence number, tx hash, and index
   */
  parseInput: (input) => {
    // NB: If the scriptsig is exactly 00, we are witness.
    // Otherwise we are compatibility
    let sequence;
    let witnessTag;
    let inputType;

    if (!utils.typedArraysAreEqual(input.slice(36, 37), new Uint8Array([0]))) {
      sequence = btcUtils.extractSequenceLegacy(input);
      witnessTag = input.slice(36, 39);
    
      if (utils.typedArraysAreEqual(witnessTag, utils.deserializeHex('220020')) || utils.typedArraysAreEqual(witnessTag, utils.deserializeHex('160014'))) {
        inputType = INPUT_TYPES.COMPATIBILITY;
      } else {
        inputType = INPUT_TYPES.LEGACY;
      }

    } else {
      sequence = btcUtils.extractSequenceWitness(input);
      inputType = INPUT_TYPES.WITNESS;
    }

    let inputId = btcUtils.extractInputTxId(input)
    let inputIndex = btcUtils.extractTxIndex(input)

    return {sequence, inputId, inputIndex, inputType};
  },

//     function parseOutput(bytes memory _output) internal pure returns (uint64 _value, uint8 _outputType, bytes memory _payload) {

//         _value = _output.extractValue();

//         if (keccak256(_output.slice(9, 1)) == keccak256(hex"6a")) {
//             // OP_RETURN
//             _outputType = uint8(OutputTypes.OP_RETURN);
//             _payload = _output.extractOpReturnData();
//         } else {
//             bytes32 _prefixHash = keccak256(_output.slice(8, 2));
//             if (_prefixHash == keccak256(hex"2200")) {
//                 // P2WSH
//                 _outputType = uint8(OutputTypes.WSH);
//                 _payload = _output.slice(11, 32);
//             } else if (_prefixHash == keccak256(hex"1600")) {
//                 // P2WPKH
//                 _outputType = uint8(OutputTypes.WPKH);
//                 _payload = _output.slice(11, 20);
//             } else if (_prefixHash == keccak256(hex"1976")) {
//                 // PKH
//                 _outputType = uint8(OutputTypes.PKH);
//                 _payload = _output.slice(12, 20);
//             } else if (_prefixHash == keccak256(hex"17a9")) {
//                 // SH
//                 _outputType = uint8(OutputTypes.SH);
//                 _payload = _output.slice(11, 20);
//             } else {
//                 _outputType = uint8(OutputTypes.NONSTANDARD);
//             }
//         }

//         return (_value, _outputType, _payload);
//     }

  /// @notice         Parses a tx output from raw output bytes
  /// @dev            Differentiates by output script prefix, handles legacy and witness
  /// @param _output  Raw bytes tx output
  /// @return         Tx output value, output type, payload
  /**
   * @notice
   * @dev
   * @param {}
   * @param {}
   * @returns {}
   */
  parseOutput: (output) => {
    return output;
  },

//     /// @notice             Parses a block header struct from a bytestring
//     /// @dev                Block headers are always 80 bytes, see Bitcoin docs
//     /// @return             Header digest, version, previous block header hash, merkle root, timestamp, target, nonce
//     function parseHeader(bytes memory _header) internal pure returns (
//         bytes32 _digest,
//         uint32 _version,
//         bytes32 _prevHash,
//         bytes32 _merkleRoot,
//         uint32 _timestamp,
//         uint256 _target,
//         uint32 _nonce
//     ) {
//         // If header has an invalid length, bubble up error
//         if (_header.length != 80) {
//             return(_digest, _version, _prevHash, _merkleRoot, _timestamp, _target, _nonce);
//         }

//         _digest = abi.encodePacked(_header.hash256()).reverseEndianness().toBytes32();
//         _version = uint32(_header.slice(0, 4).reverseEndianness().bytesToUint());
//         _prevHash = _header.extractPrevBlockLE().toBytes32();
//         _merkleRoot = _header.extractMerkleRootLE().toBytes32();
//         _timestamp = _header.extractTimestamp();
//         _target = _header.extractTarget();
//         _nonce = uint32(_header.slice(76, 4).reverseEndianness().bytesToUint());

//         return(_digest, _version, _prevHash, _merkleRoot, _timestamp, _target, _nonce);
//     }

  /// @notice             Parses a block header struct from a bytestring
  /// @dev                Block headers are always 80 bytes, see Bitcoin docs
  /// @return             Header digest, version, previous block header hash, merkle root, timestamp, target, nonce
  parseHeader: (header) => {
    return header;
  },

//     function validateHeaderChain(bytes memory _headers) internal pure returns (uint256 _totalDifficulty) {

//         // Check header chain length
//         if (_headers.length % 80 != 0) {return ERR_BAD_LENGTH;}

//         // Initialize header start index
//         bytes32 _digest;
//         uint256 _start = 0;

//         _totalDifficulty = 0;

//         for (uint i = 0; i < _headers.length / 80; i++) {

//             // ith header start index and ith header
//             _start = i * 80;
//             bytes memory _header = _headers.slice(_start, 80);

//             // After the first header, check that headers are in a chain
//             if (i != 0) {
//                 if (!validateHeaderPrevHash(_header, _digest)) {return ERR_INVALID_CHAIN;}
//             }

//             // ith header target
//             uint256 _target = _header.extractTarget();

//             // Require that the header has sufficient work
//             _digest = _header.hash256();
//             if(abi.encodePacked(_digest).reverseEndianness().bytesToUint() > _target) {
//                 return ERR_LOW_WORK;
//             }

//             // Add ith header difficulty to difficulty sum
//             _totalDifficulty = _totalDifficulty.add(_target.calculateDifficulty());
//         }
//     }

  /// @notice             Checks validity of header chain
  /// @notice             Compares the hash of each header to the prevHash in the next header
  /// @param _headers     Raw byte array of header chain
  /// @return             The total accumulated difficulty of the header chain, or an error code
  /**
   * @notice                Checks validity of header chain
   * @dev                   Compares the hash of each header to the prevHash in the next header
   * @param {Uint8Array}    headers Raw byte array of header chain
   * @returns {BigInt}       The total accumulated difficulty of the header chain, or an error code
   */
  validateHeaderChain: (headers) => {
    // Check header chain length
    if (headers.length % 80 !== 0) {
      throw new Error('Header bytes not multiple of 80.');
    }

    // Initialize header start index
    let digest;
    let start = 0;
    let totalDifficulty = 0n;

    for (let i = 0; i < headers.length / 80; i++) {
      // ith header start index and ith header
      start = i * 80;
      let header = utils.safeSlice(headers, start, start + 80);

      //After the first header, check that headers are in a chain
      if (i !== 0) {
        if (!module.exports.validateHeaderPrevHash(header, digest)) {
          throw new Error('Header bytes not a valid chain.');
        }
      }

      // ith header target
      let target = btcUtils.extractTarget(header);

      // Require that the header has sufficient work
      digest = btcUtils.hash256(header);
      if (utils.bytesToUint(btcUtils.reverseEndianness(digest)) > target) {
        throw new Error('Header does not meet its own difficulty target.');
      }

      totalDifficulty += btcUtils.calculateDifficulty(target);
    }
    return totalDifficulty;
  },

//     function validateHeaderWork(bytes32 _digest, uint256 _target) internal pure returns (bool) {
//         if (_digest == bytes32(0)) {return false;}
//         return (abi.encodePacked(_digest).bytesToUint() < _target);
//     }

  /// @notice             Checks validity of header work
  /// @param _digest      Header digest
  /// @param _target      The target threshold
  /// @return             true if header work is valid, false otherwise
  /**
   * @notice              Checks validity of header work
   * @param {Uint8Array}  digest Header digest
   * @param {Uint8Array}  target The target threshold
   * @returns {Boolean}   true if header work is valid, false otherwise
   */
  validateHeaderWork: (digest, target) => {
    if (digest === 0) {
      return false;
    }
    return utils.bytesToUint(digest) < target;
  },

//      function validateHeaderPrevHash(bytes memory _header, bytes32 _prevHeaderDigest) internal pure returns (bool) {

//        // Extract prevHash of current header
//        bytes32 _prevHash = _header.extractPrevBlockLE().toBytes32();

//        // Compare prevHash of current header to previous header's digest
//        if (_prevHash != _prevHeaderDigest) {return false;}

//        return true;
//      }


//     /// @notice                     Checks validity of header chain
//     /// @dev                        Compares current header prevHash to previous header's digest
//     /// @param _header              The raw bytes header
//     /// @param _prevHeaderDigest    The previous header's digest
//     /// @return                     true if header chain is valid, false otherwise

  /**
   * @notice              Checks validity of header chain
   * @dev                 Compares current header prevHash to previous header's digest
   * @param {Uint8Array}  header The raw bytes header
   * @param {Uint8Array}  prevHeaderDigest The previous header's digest
   * @returns {Boolean}   true if header chain is valid, false otherwise
   */
  validateHeaderPrevHash: (header, prevHeaderDigest) => {
    // Extract prevHash of current header
    let prevHash = btcUtils.extractPrevBlockLE(header);

    // Compare prevHash of current header to previous header's digest
    if (!utils.typedArraysAreEqual(prevHash, prevHeaderDigest)) {
      return false;
    }

    return true;
  }
}
