// /** @title ValidateSPV*/
// /** @author Summa (https://summa.one) */

const btcUtils = require("./BTCUtils");
const utils = require("../../utils/utils");

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
   * @notice                Validates a tx inclusion in the block
   * @param {Uint8Array}    txid The txid (LE)
   * @param {Uint8Array}    merkleRoot The merkle root (as in the block header)
   * @param {Uint8Array}    intermediateNodes The proof's intermediate nodes (digests between leaf and root)
   * @param {number}        index The leaf's index in the tree (0-indexed)
   * @returns {boolean}     true if fully valid, false otherwise
   */
  prove: (txid, merkleRoot, intermediateNodes, index) => {
    // Shortcut the empty-block case
    if (utils.typedArraysAreEqual(txid, merkleRoot) && index === 0 && intermediateNodes.length === 0) {
      return true;
    }

    let proof = utils.concatUint8Arrays([txid, intermediateNodes, merkleRoot]);
    // If the Merkle proof failed, bubble up error
    return btcUtils.verifyHash256Merkle(proof, index);
  },

  /**
   * @notice                Hashes transaction to get txid
   * @dev                   Supports Legacy and Witness
   * @param {Uint8Array}    version 4-bytes version
   * @param {Uint8Array}    vin Raw bytes length-prefixed input vector
   * @param {Uint8Array}    vout Raw bytes length-prefixed output vector
   * @param {Uint8Array}    locktime 4-byte tx locktime
   * @returns {Uint8Array}  32-byte transaction id, little endian
   */
  calculateTxId: (version, vin, vout, locktime) => {
    return btcUtils.hash256(utils.concatUint8Arrays([version, vin, vout, locktime]));
  },

  /**
   * @notice                Parses a tx input from raw input bytes
   * @dev                   Supports Legacy and Witness inputs
   * @param {Uint8Array}    input bytes tx input
   * @returns {object}      Tx input, sequence number, tx hash, and index
   */
  parseInput: (input) => {
    // NB: If the scriptsig is exactly 00, we are witness.
    // Otherwise we are compatibility or legacy
    let sequence;
    let witnessTag;
    let inputType;

    if (input[36] !== 0) {
      sequence = btcUtils.extractSequenceLegacy(input);
      witnessTag = utils.safeSlice(input, 36, 39);
    
      if (utils.typedArraysAreEqual(witnessTag, utils.deserializeHex('220020')) || utils.typedArraysAreEqual(witnessTag, utils.deserializeHex('160014'))) {
        inputType = INPUT_TYPES.COMPATIBILITY;
      } else {
        inputType = INPUT_TYPES.LEGACY;
      }

    } else {
      sequence = btcUtils.extractSequenceWitness(input);
      inputType = INPUT_TYPES.WITNESS;
    }

    let inputId = btcUtils.extractInputTxId(input);
    let inputIndex = btcUtils.extractTxIndex(input);

    return {sequence, inputId, inputIndex, inputType};
  },

  /**
   * @notice                Parses a tx output from raw output bytes
   * @dev                   Differentiates by output script prefix, handles legacy and witness
   * @param {Uint8Array}    output bytes tx output
   * @returns {object}      Tx output value, output type, payload
   */
  parseOutput: (output) => {
    let value = btcUtils.extractValue(output);

    if (utils.typedArraysAreEqual(utils.safeSlice(output, 9, 10), new Uint8Array([106]))) {
      // OP_RETURN
      outputType = OUTPUT_TYPES.OP_RETURN;
      payload = btcUtils.extractOpReturnData(output);
    } else {
        let prefixHash = utils.safeSlice(output, 8, 10);
        if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([34, 0]))) {
          // P2WSH
          outputType = OUTPUT_TYPES.WSH;
          payload = utils.safeSlice(output, 11, 43);
        } else if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([22, 0]))) {
          // P2WPKH
          outputType = OUTPUT_TYPES.WPKH;
          payload = utils.safeSlice(output, 11, 31);
        } else if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([25, 118]))) {
          // PKH
          outputType = OUTPUT_TYPES.PKH;
          payload = utils.safeSlice(output, 12, 32);
        } else if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([23, 169]))) {
          // SH
          outputType = OUTPUT_TYPES.SH;
          payload = utils.safeSlice(output, 11, 31);
        } else {
          outputType = OUTPUT_TYPES.NONSTANDARD;
          payload = null;
        }
    }

    return { value, outputType, payload };
  },

  /**
   * @notice                Parses a block header struct from a bytestring
   * @dev                   Block headers are always 80 bytes, see Bitcoin docs
   * @param {Uint8Array}    header Header
   * @returns {object}      Header digest, version, previous block header hash, merkle root, timestamp, target, nonce
   */
  parseHeader: (header) => {
    // If header has an invalid length, bubble up error
    if (header.length != 80) {
      throw new Error('Malformatted header. Must be exactly 80 bytes.');
    }

    let digest = btcUtils.reverseEndianness(btcUtils.hash256(header));
    let version = utils.bytesToUint(btcUtils.reverseEndianness(utils.safeSlice(header, 0, 4)));
    let prevHash = btcUtils.extractPrevBlockLE(header);
    let merkleRoot = btcUtils.extractMerkleRootLE(header);
    let timestamp = btcUtils.extractTimestamp(header);
    let target = btcUtils.extractTarget(header);
    let nonce = utils.bytesToUint(btcUtils.reverseEndianness(utils.safeSlice(header, 76, 80)));

    return { digest, version, prevHash, merkleRoot, timestamp, target, nonce };
  },

  /**
   * @notice                Checks validity of header chain
   * @dev                   Compares the hash of each header to the prevHash in the next header
   * @param {Uint8Array}    headers Raw byte array of header chain
   * @returns {BigInt}      The total accumulated difficulty of the header chain, or an error code
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
      // if (!module.exports.validateHeaderChain(btcUtils.reverseEndianness(digest), target)) {
        throw new Error('Header does not meet its own difficulty target.');
      }

      totalDifficulty += btcUtils.calculateDifficulty(target);
    }
    return totalDifficulty;
  },

  /**
   * @notice                Checks validity of header work
   * @param {Uint8Array}    digest Header digest
   * @param {Uint8Array}    target The target threshold
   * @returns {Boolean}     True if header work is valid, false otherwise
   */
  validateHeaderWork: (digest, target) => {
    if (digest === 0) {
      return false;
    }
    return utils.bytesToUint(digest) < target;
  },

  /**
   * @notice                Checks validity of header chain
   * @dev                   Compares current header prevHash to previous header's digest
   * @param {Uint8Array}    header The raw bytes header
   * @param {Uint8Array}    prevHeaderDigest The previous header's digest
   * @returns {Boolean}     True if header chain is valid, false otherwise
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
