/* global BigInt */

/**
 *
 * @file Part of the [bitcoin-spv]{@link https://github.com/summa-tx/bitcoin-spv} project
 *
 * @title ValidateSPV
 * @summary Validate Bitcoin SPV proofs
 * @author James Prestwich <james@summa.one>
 * @author Erin Hales <erin@summa.one>
 * @author Dominique Liau <dominique@summa.one>
 * @copyright (c) [Summa]{@link https://summa.one} 2019
 * @module ValidateSPV
 *
 */

import * as BTCUtils from './BTCUtils';
import * as utils from './utils';


/**
 *
 * Validates a tx inclusion in the block
 *
 * @param {Uint8Array}    txid The txid (LE)
 * @param {Uint8Array}    merkleRoot The merkle root (as in the block header)
 * @param {Uint8Array}    intermediateNodes The proof's intermediate nodes
 *                        (digests between leaf and root)
 * @param {number}        index The leaf's index in the tree (0-indexed)
 * @returns {boolean}     true if fully valid, false otherwise
 */
export function prove(txid, merkleRoot, intermediateNodes, index) {
  // Shortcut the empty-block case
  if (utils.typedArraysAreEqual(txid, merkleRoot)
      && index === 0
      && intermediateNodes.length === 0) {
    return true;
  }

  const proof = utils.concatUint8Arrays(txid, intermediateNodes, merkleRoot);
  // If the Merkle proof failed, bubble up error
  return BTCUtils.verifyHash256Merkle(proof, index);
}

/**
 *
 * Hashes transaction to get txid
 *
 * @dev                   Supports LEGACY and WITNESS
 * @param {Uint8Array}    version 4-bytes version
 * @param {Uint8Array}    vin Raw bytes length-prefixed input vector
 * @param {Uint8Array}    vout Raw bytes length-prefixed output vector
 * @param {Uint8Array}    locktime 4-byte tx locktime
 * @returns {Uint8Array}  32-byte transaction id, little endian
 */
export function calculateTxId(version, vin, vout, locktime) {
  return BTCUtils.hash256(
    utils.concatUint8Arrays(version, vin, vout, locktime)
  );
}

/**
 *
 * Parses a tx input from raw input bytes
 *
 * @dev                   Supports LEGACY and WITNESS inputs
 * @param {Uint8Array}    input bytes tx input
 * @returns {object}      Tx input, sequence number, tx hash, and index
 */
export function parseInput(input) {
  // NB: If the scriptsig is exactly 00, we are WITNESS.
  // Otherwise we are Compatibility or LEGACY
  let sequence;
  let witnessTag;
  let inputType;

  if (input[36] !== 0) {
    sequence = BTCUtils.extractSequenceLegacy(input);
    witnessTag = utils.safeSlice(input, 36, 39);

    if (utils.typedArraysAreEqual(witnessTag, new Uint8Array([0x22, 0x00, 0x20]))
        || utils.typedArraysAreEqual(witnessTag, new Uint8Array([0x16, 0x00, 0x14]))) {
      inputType = utils.INPUT_TYPES.COMPATIBILITY;
    } else {
      inputType = utils.INPUT_TYPES.LEGACY;
    }
  } else {
    sequence = BTCUtils.extractSequenceWitness(input);
    inputType = utils.INPUT_TYPES.WITNESS;
  }

  const inputId = BTCUtils.extractInputTxId(input);
  const inputIndex = BTCUtils.extractTxIndex(input);

  return {
    sequence, inputId, inputIndex, inputType
  };
}

/**
 *
 * Parses a tx output from raw output bytes
 *
 * @dev                   Differentiates by output script prefix, handles LEGACY and WITNESS
 * @param {Uint8Array}    output bytes tx output
 * @returns {object}      Tx output value, output type, payload
 */
export function parseOutput(output) {
  const value = BTCUtils.extractValue(output);
  let outputType;
  let payload;

  if (output[9] === 0x6a) {
    // OP_RETURN
    outputType = utils.OUTPUT_TYPES.OP_RETURN;
    payload = BTCUtils.extractOpReturnData(output);
  } else {
    const prefixHash = utils.safeSlice(output, 8, 10);
    if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([0x22, 0x00]))) {
      // P2WSH
      outputType = utils.OUTPUT_TYPES.WSH;
      payload = utils.safeSlice(output, 11, 43);
    } else if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([0x16, 0x00]))) {
      // P2WPKH
      outputType = utils.OUTPUT_TYPES.WPKH;
      payload = utils.safeSlice(output, 11, 31);
    } else if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([0x19, 0x76]))) {
      // PKH
      outputType = utils.OUTPUT_TYPES.PKH;
      payload = utils.safeSlice(output, 12, 32);
    } else if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([0x17, 0xa9]))) {
      // SH
      outputType = utils.OUTPUT_TYPES.SH;
      payload = utils.safeSlice(output, 11, 31);
    } else {
      outputType = utils.OUTPUT_TYPES.NONSTANDARD;
      payload = new Uint8Array([]);
    }
  }

  return { value, outputType, payload };
}

/**
 *
 * Parses a block header struct from a bytestring
 *
 * @dev                   Block headers are always 80 bytes, see Bitcoin docs
 * @param {Uint8Array}    header Header
 * @returns {object}      Header digest, version, previous block header hash,
 *                        merkle root, timestamp, target, nonce
 * @throws {TypeError}    When passed a bad header
 */
export function parseHeader(header) {
  // If header has an invalid length, bubble up error
  if (header.length !== 80) {
    throw new TypeError(4);
  }

  const digest = utils.reverseEndianness(BTCUtils.hash256(header));
  const version = utils.bytesToUint(utils.reverseEndianness(utils.safeSlice(header, 0, 4)));
  const prevHash = BTCUtils.extractPrevBlockLE(header);
  const merkleRoot = BTCUtils.extractMerkleRootLE(header);
  const timestamp = BTCUtils.extractTimestamp(header);
  const target = BTCUtils.extractTarget(header);
  const nonce = utils.bytesToUint(utils.reverseEndianness(utils.safeSlice(header, 76, 80)));

  return {
    digest, version, prevHash, merkleRoot, timestamp, target, nonce
  };
}

/**
 *
 * Checks validity of header work
 *
 * @param {Uint8Array}    digest Header digest
 * @param {Uint8Array}    target The target threshold
 * @returns {Boolean}     True if header work is valid, false otherwise
 */
export function validateHeaderWork(digest, target) {
  if (utils.typedArraysAreEqual(digest, new Uint8Array(Array(32).fill(0)))) {
    return false;
  }
  return utils.bytesToUint(utils.reverseEndianness(digest)) < target;
}

/**
 *
 * Checks validity of header chain
 *
 * @dev                   Compares current header prevHash to previous header's digest
 * @param {Uint8Array}    header The raw bytes header
 * @param {Uint8Array}    prevHeaderDigest The previous header's digest
 * @returns {Boolean}     True if header chain is valid, false otherwise
 */
export function validateHeaderPrevHash(header, prevHeaderDigest) {
  // Extract prevHash of current header
  const prevHash = BTCUtils.extractPrevBlockLE(header);

  // Compare prevHash of current header to previous header's digest
  if (!utils.typedArraysAreEqual(prevHash, prevHeaderDigest)) {
    return false;
  }

  return true;
}

/**
 *
 * Checks validity of header chain
 *
 * @dev                   Compares the hash of each header to the prevHash in the next header
 * @param {Uint8Array}    headers Raw byte array of header chain
 * @returns {BigInt}      The total accumulated difficulty of the header chain, or an error code
 * @throws {TypeError}    When passed a chain that contains junk data
 * @throws {Error}        When passed an invalid chain, or header with low work
*/
export function validateHeaderChain(headers) {
  // Check header chain length
  if (headers.length % 80 !== 0) {
    throw new TypeError(2);
  }

  let digest;
  let totalDifficulty = BigInt(0);

  for (let i = 0; i < headers.length / 80; i += 1) {
    // ith header start index and ith header
    const start = i * 80;
    const header = utils.safeSlice(headers, start, start + 80);

    // After the first header, check that headers are in a chain
    if (i !== 0) {
      if (!validateHeaderPrevHash(header, digest)) {
        throw new Error(1);
      }
    }

    // ith header target
    const target = BTCUtils.extractTarget(header);

    // Require that the header has sufficient work
    digest = BTCUtils.hash256(header);
    if (!validateHeaderWork(digest, target)) {
      throw new Error(3);
    }

    totalDifficulty += BTCUtils.calculateDifficulty(target);
  }
  return totalDifficulty;
}

/**
 *
 * Checks validity of an entire bitcoin header
 *
 * @dev                   Checks that each element in a bitcoin header is valid
 * @param {Object}        header A valid Bitcoin header object, see README for
 *                          more information on creating an Bitcoin Header object
 * @param {Uint8Array}    header.raw The bitcoin header
 * @param {Uint8Array}    header.hash The hash of the header
 * @param {Uint8Array}    header.hash_le The LE hash of the header
 * @param {Number}        header.height The height
 * @param {Uint8Array}    header.merkle_root The merkle root of the header
 * @param {Uint8Array}    header.merkle_root_le The LE merkle root
 * @param {Uint8Array}    header.prevhash The hash of the previous header
 * @returns {Boolean}     True if the header object is syntactically valid
 * @throws {Error}        If any of the bitcoin header elements are invalid
*/
export function validateHeader(header) {
  // Check that HashLE is the correct hash of the raw header
  const headerHash = BTCUtils.hash256(header.raw);
  if (!utils.typedArraysAreEqual(headerHash, header.hash_le)) {
    throw new Error(5);
  }

  // Check that HashLE is the reverse of Hash
  const reversedHash = utils.reverseEndianness(header.hash);
  if (!utils.typedArraysAreEqual(reversedHash, header.hash_le)) {
    throw new Error(6);
  }

  // Check that the MerkleRootLE is the correct MerkleRoot for the header
  const merkleRootLE = BTCUtils.extractMerkleRootLE(header.raw);
  if (!utils.typedArraysAreEqual(merkleRootLE, header.merkle_root_le)) {
    throw new Error(7);
  }
  
  // Check that MerkleRootLE is the reverse of MerkleRoot
  const reversedMerkleRoot = utils.reverseEndianness(header.merkle_root);
  if (!utils.typedArraysAreEqual(reversedMerkleRoot, header.merkle_root_le)) {
    // TODO: update this error wording: "MerkleRootBE is not the BE version of MerkleRootLE"
    throw new Error(8);
  }

  // Check that PrevHash is the correct PrevHash for the header
  const extractedPrevHash = BTCUtils.extractPrevBlockBE(header.raw);
  if (!utils.typedArraysAreEqual(extractedPrevHash, header.prevhash)) {
    throw new Error(9);
  }

  return true;
}

/**
 *
 * Checks validity of an entire SPV Proof
 *
 * @dev                   Checks that each element in an SPV Proof is valid
 * @param {Object}        proof A valid SPV Proof object, see README for
 *                          more information on creating an SPV Proof object
 * @param {Uint8Array}    proof.version The version
 * @param {Uint8Array}    proof.vin The vin
 * @param {Uint8Array}    proof.vout The vout
 * @param {Uint8Array}    proof.locktime The locktime
 * @param {Uint8Array}    proof.tx_id The tx ID
 * @param {Uint8Array}    proof.tx_id_le The LE tx ID
 * @param {Number}        proof.index The index
 * @param {Uint8Array}    proof.intermediate_nodes The intermediate nodes
 * @param {Uint8Array}    proof.confirming_header.raw The bitcoin header
 * @param {Uint8Array}    proof.confirming_header.hash The hash of the header
 * @param {Uint8Array}    proof.confirming_header.hash_le The LE hash of the header
 * @param {Number}        proof.confirming_header.height The height
 * @param {Uint8Array}    proof.confirming_header.merkle_root The merkle root of the header
 * @param {Uint8Array}    proof.confirming_header.merkle_root_le The LE merkle root
 * @param {Uint8Array}    proof.confirming_header.prevhash The hash of the previous header
 * @returns {Boolean}     Teturns true if the SPV Proof object is syntactically valid
 * @throws {Error}        If any of the SPV Proof elements are invalid
*/
export function validateProof(proof) {
  const {
    version,
    vin,
    vout,
    locktime,
    tx_id_le: txIdLE,
    index,
    intermediate_nodes: intermediateNodes,
    confirming_header: confirmingHeader
  } = proof;
  const { merkle_root_le: merkleRootLE } = confirmingHeader;

  const validVin = BTCUtils.validateVin(vin);
  if (!validVin) {
    throw new Error(10);
  }

  const validVout = BTCUtils.validateVout(vout);
  if (!validVout) {
    throw new Error(11);
  }

  const txID = calculateTxId(version, vin, vout, locktime);
  if (!utils.typedArraysAreEqual(txID, txIdLE)) {
    throw new Error(12);
  }

  validateHeader(confirmingHeader);

  const validProof = prove(txIdLE, merkleRootLE, intermediateNodes, index);
  if (!validProof) {
    throw new Error(13);
  }

  return true;
}
