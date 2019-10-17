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
    throw new TypeError('Malformatted header. Must be exactly 80 bytes.');
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
    throw new TypeError('Header bytes not multiple of 80.');
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
        throw new Error('Header bytes not a valid chain.');
      }
    }

    // ith header target
    const target = BTCUtils.extractTarget(header);

    // Require that the header has sufficient work
    digest = BTCUtils.hash256(header);
    if (!validateHeaderWork(digest, target)) {
      throw new Error('Header does not meet its own difficulty target.');
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
 * @param {Uint8Array}    header The bitcoin header
 * @param {Uint8Array}    hash The hash of the header
 * @param {Uint8Array}    hashLE The LE hash of the header
 * @param {Number}        height The height
 * @param {Uint8Array}    merkleRoot The merkle root of the header
 * @param {Uint8Array}    merkleRootLE The LE merkle root
 * @param {Uint8Array}    prevHash The hash of the previous header
 * @returns {Boolean}     True if all the elements of the header are valid
 * @throws {Error}        If any of the bitcoin header elements are invalid
*/
export function validateHeader(
  header,
  hash,
  hashLE,
  height,
  merkleRoot,
  merkleRootLE,
  prevHash) {

  // Check that HashLE is the correct hash of the raw header
  const headerHash = BTCUtils.hash256(header)
  // return `${typeof headerHash}`
	if (!utils.typedArraysAreEqual(headerHash, hashLE)) {
		throw new Error('Hash LE is not the correct hash of the header')
  }

	// Check that HashLE is the reverse of Hash
	const reversedHash = utils.reverseEndianness(hash)
	if (!utils.typedArraysAreEqual(reversedHash, hashLE)) {
		throw new Error('HashLE is not the LE version of Hash')
  }

	// Check that the MerkleRootLE is the correct MerkleRoot for the header
	const extractedMerkleRootLE = BTCUtils.extractMerkleRootLE(header)
	if (!utils.typedArraysAreEqual(extractedMerkleRootLE, merkleRootLE)) {
		throw new Error('MerkleRootLE is not the correct merkle root of the header')
  }

	// Check that MerkleRootLE is the reverse of MerkleRoot
	const reversedMerkleRoot = utils.reverseEndianness(merkleRoot)
	if (!utils.typedArraysAreEqual(reversedMerkleRoot, merkleRootLE)) {
		throw new Error('MerkleRootLE is not the LE version of MerkleRoot')
  }

	// Check that PrevHash is the correct PrevHash for the header
	const extractedPrevHash = BTCUtils.extractPrevBlockBE(header)
	if (!utils.typedArraysAreEqual(extractedPrevHash, prevHash)) {
		throw new Error('Prev hash is not the correct previous hash of the header')
  }

  return true
}

/**
 *
 * Checks validity of an entire SPV Proof
 *
 * @dev                   Checks that each element in an SPV Proof is valid
 * @param {Uint8Array}    version The version
 * @param {Uint8Array}    vin The vin
 * @param {Uint8Array}    vout The vout
 * @param {Uint8Array}    locktime The locktime
 * @param {Uint8Array}    txid The tx ID
 * @param {Uint8Array}    txidLE The LE tx ID
 * @param {Number}        index The index
 * @param {Uint8Array}    intermediateNodes The intermediate nodes
 * @param {Uint8Array}    header The bitcoin header
 * @param {Uint8Array}    hash The hash of the header
 * @param {Uint8Array}    hashLE The LE hash of the header
 * @param {Number}        height The height
 * @param {Uint8Array}    merkleRoot The merkle root of the header
 * @param {Uint8Array}    merkleRootLE The LE merkle root
 * @param {Uint8Array}    prevHash The hash of the previous header
 * @returns {Boolean}     True if all the elements of the proof are valid, false if otherwise
*/
export function validateProof(
  version,
  vin,
  vout,
  locktime,
  txid,
  txidLE,
  index,
  intermediateNodes,
  header,
  hash,
  hashLE,
  height,
  merkleRoot,
  merkleRootLE,
  prevHash) {

  const validVin = BTCUtils.validateVin(vin)
  if (!validVin) {
    throw new Error('Vin is not valid')
  }

  const validVout = BTCUtils.validateVout(vout)
  if (!validVout) {
    throw new Error('Vout is not valid')
  }

  const txID = calculateTxId(version, vin, vout, locktime)
  if (!utils.typedArraysAreEqual(txID, txidLE)) {
    throw new Error('Version, Vin, Vout and Locktime did not yield correct TxID')
  }

  const validHeader = validateHeader(header, hash, hashLE, height, merkleRoot, merkleRootLE, prevHash)
  if (!validHeader) {
    throw new Error('Bitcoin header is not valid')
  }

  const validProof = prove(txidLE, merkleRootLE, intermediateNodes, index)
  if (!validProof) {
    throw new Error('Merkle Proof is not valid')
  }

  return true
}
