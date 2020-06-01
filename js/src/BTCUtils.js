/* global BigInt */

/**
 *
 * @file Part of the [bitcoin-spv]{@link https://github.com/summa-tx/bitcoin-spv} project
 *
 * @title BTCUtils
 * @summary Utility functions for parsing Bitcoin datastructures
 * @author James Prestwich <james@summa.one>
 * @author Erin Hales <erin@summa.one>
 * @author Dominique Liau <dominique@summa.one>
 * @copyright (c) [Summa]{@link https://summa.one} 2019
 * @module BTCUtils
 *
 */

import * as utils from './utils';

/**
 * @const {BigInt}
 */
export const RETARGET_PERIOD = BigInt(1209600);

/**
 * @const {BigInt}
 */
export const RETARGET_PERIOD_BLOCKS = BigInt(2016);

/**
 * @const {BigInt}
 */
export const DIFF_ONE_TARGET = BigInt('0xffff0000000000000000000000000000000000000000000000000000');

/**
 *
 * Determines the length of a VarInt in bytes
 * A VarInt of >1 byte is prefixed with a flag indicating its length
 *
 * @param {number}        flag The first byte of a VarInt
 * @returns {number}      The number of non-flag bytes in the VarInt
 */
export function determineVarIntDataLength(flag) {
  if (flag === 0xff) {
    return 8; // one-byte flag, 8 bytes data
  }
  if (flag === 0xfe) {
    return 4; // one-byte flag, 4 bytes data
  }
  if (flag === 0xfd) {
    return 2; // one-byte flag, 2 bytes data
  }

  return 0; // flag is data
}

/**
 *
 * Parse a VarInt into its data length and the number it represents.
 * Useful for Parsing Vins and Vouts
 *
 * @param {Uint8Array}    b The VarInt bytes
 * @returns {object}      The length of the payload, and the encoded integer
 */
export function parseVarInt(b) {
  const dataLength = determineVarIntDataLength(b[0]);

  if (dataLength === 0) {
    return { dataLength: BigInt(dataLength), number: BigInt(b[0]) };
  }

  if (b.length < 1 + dataLength) {
    throw new RangeError('Read overrun during VarInt parsing');
  }

  const number = utils.bytesToUint(utils.reverseEndianness(utils.safeSlice(b, 1, 1 + dataLength)));

  return { dataLength: BigInt(dataLength), number: BigInt(number) };
}

/**
 *
 * Implements bitcoin's hash160 (rmd160(sha2()))
 *
 * @param {Uint8Array}    preImage The pre-image
 * @returns {Uint8Array}  The digest
 */
export function hash160(preImage) {
  return utils.ripemd160(utils.sha256(preImage));
}

/**
 *
 * Implements bitcoin's hash256 (double sha2)
 *
 * @param {Uint8Array}      preImage The pre-image
 * @returns {Uint8Array}    The digest
 */
export function hash256(preImage) {
  return utils.sha256(utils.sha256(preImage));
}

/* ************ */
/* Legacy Input */
/* ************ */

/**
 *
 * Determines the length of a scriptSig in an input
 * Will return 0 if passed a witness input
 *
 * @param {Uint8Array}    input The LEGACY input
 * @returns {object}      The length of the script sig in object form
 */
export function extractScriptSigLen(input) {
  if (input.length < 37) {
    throw Error('Read overrun');
  }
  const { dataLength, number } = parseVarInt(utils.safeSlice(input, 36));
  return { dataLength, scriptSigLen: number };
}

/**
 *
 * Extracts the LE sequence bytes from an input
 * Sequence is used for relative time locks
 *
 * @param {Uint8Array}    input The LEGACY input
 * @returns {Uint8Array}  The sequence bytes (LE uint)
 */
export function extractSequenceLELegacy(input) {
  const { dataLength, scriptSigLen } = extractScriptSigLen(input);
  const length = 36 + 1 + Number(dataLength) + Number(scriptSigLen);
  return utils.safeSlice(input, length, length + 4);
}

/**
 *
 * Determines the length of an input from its scriptsig
 * 36 for outpoint, 1 for scriptsig length, 4 for sequence
 *
 * @param {Uint8Array}    input The input as a u8a
 * @returns {BigInt}      The length of the input in bytes
 */
export function determineInputLength(input) {
  const { dataLength, scriptSigLen } = extractScriptSigLen(input);
  return BigInt(41) + dataLength + scriptSigLen;
}

/**
 *
 * Extracts the nth input from the vin (0-indexed)
 *
 * Iterates over the vin. If you need to extract several,
 * write a custom function
 *
 * @param {Uint8Array}    vin The vin as a tightly-packed uint8array
 * @param {index}         index The 0-indexed location of the input to extract
 * @returns {Uint8Array}  The input as a u8a
 */
export function extractInputAtIndex(vin, index) {
  const { dataLength, number: nIns } = parseVarInt(vin);
  if (BigInt(index) >= nIns) {
    throw RangeError('Vin read overrun');
  }

  let len = 0;
  let offset = BigInt(1) + dataLength;

  for (let i = 0; i <= index; i += 1) {
    const remaining = utils.safeSlice(vin, offset, vin.length);
    len = determineInputLength(remaining);
    if (i !== index) {
      offset += len;
    }
  }

  return utils.safeSlice(vin, offset, offset + len);
}

/**
 *
 * Determines whether an input is legacy
 * False if no scriptSig, otherwise True
 *
 * @param {Uint8Array}    input The input
 * @returns {boolean}     True for LEGACY, False for WITNESS
 */
export function isLegacyInput(input) {
  return input[36] !== 0;
}

/**
 *
 * Extracts the sequence from the input
 * Sequence is a 4-byte little-endian number
 *
 * @param {Uint8Array}    input The LEGACY input
 * @returns {BigInt}      The sequence number
 */
export function extractSequenceLegacy(input) {
  const leSeqence = extractSequenceLELegacy(input);
  const beSequence = utils.reverseEndianness(leSeqence);
  return utils.bytesToUint(beSequence);
}

/**
 *
 * Extracts the VarInt-prepended scriptSig from the input in a tx
 * Will return Uint8Array([0x00]) if passed a witness input
 *
 * @param {Uint8Array}    input The LEGACY input
 * @returns {Uint8Array}  The length-prepended script sig
 */
export function extractScriptSig(input) {
  const { dataLength, scriptSigLen } = extractScriptSigLen(input);
  const length = 1 + Number(dataLength) + Number(scriptSigLen);
  return utils.safeSlice(input, 36, 36 + length);
}


/* ************* */
/* Witness Input */
/* ************* */

/**
 *
 * Extracts the LE sequence bytes from an input
 * Sequence is used for relative time locks
 *
 * @param {Uint8Array}    input The WITNESS input
 * @returns {Uint8Array}  The sequence bytes (LE uint)
 */
export function extractSequenceLEWitness(input) {
  return utils.safeSlice(input, 37, 41);
}

/**
 *
 * Extracts the sequence from the input in a tx
 * Sequence is a 4-byte little-endian number
 *
 * @param {Uint8Array}    input The WITNESS input
 * @returns {BigInt}      The sequence number (big-endian u8a)
 */
export function extractSequenceWitness(input) {
  const leSeqence = extractSequenceLEWitness(input);
  const inputSequence = utils.reverseEndianness(leSeqence);
  return utils.bytesToUint(inputSequence);
}

/**
 *
 * Extracts the outpoint from the input in a tx
 * 32 byte tx id with 4 byte index
 *
 * @param {Uint8Array}    input The input
 * @returns {Uint8Array}  The outpoint (LE bytes of prev tx hash + LE bytes of prev tx index)
 */
export function extractOutpoint(input) {
  return utils.safeSlice(input, 0, 36);
}

/**
 *
 * Extracts the outpoint tx id from an input
 * 32 byte tx id
 *
 * @param {Uint8Array}    input The input
 * @returns {Uint8Array}  The tx id (little-endian bytes)
 */
export function extractInputTxIdLE(input) {
  return utils.safeSlice(input, 0, 32);
}

/**
 *
 * Extracts the LE tx input index from the input in a tx
 * 4 byte tx index
 *
 * @param {Uint8Array}    input The input
 * @returns {Uint8Array}  The tx index (little-endian bytes)
 */
export function extractTxIndexLE(input) {
  return utils.safeSlice(input, 32, 36);
}

/**
 *
 * Extracts the LE tx input index from the input in a tx
 * 4 byte tx index
 *
 * @param {Uint8Array}    input The input
 * @returns {BigInt}      The tx index (big-endian uint)
 */
export function extractTxIndex(input) {
  const leIndex = extractTxIndexLE(input);
  const beIndex = utils.reverseEndianness(leIndex);
  return utils.bytesToUint(beIndex);
}

/* ****** */
/* Output */
/* ****** */

/**
 *
 * Determines the length of an output
 * 5 types: WPKH, WSH, PKH, SH, and OP_RETURN
 *
 * @param {Uint8Array}    output The output
 * @returns {BigInt}      The length indicated by the prefix, error if invalid length
 * @throws {RangeError}   When output is fewer than 9 bytes long
 */
export function determineOutputLength(output) {
  if (output.length < 9) {
    throw RangeError('Read overrun');
  }

  const { dataLength, number } = parseVarInt(utils.safeSlice(output, 8));

  // 8 byte value, 1 byte for len itself
  return BigInt(8 + 1) + dataLength + number;
}

/**
 *
 * Extracts the output at a given index in the TxIns vector
 *
 * Iterates over the vout. If you need to extract multiple,
 * write a custom function
 *
 * @param {Uint8Array}    vout The vout to extract from
 * @param {number}        index The 0-indexed location of the output to extract
 * @returns {Uint8Array}  The specified output
 */
export function extractOutputAtIndex(vout, index) {
  const { dataLength, number: nOuts } = parseVarInt(vout);

  if (BigInt(index) >= nOuts) {
    throw RangeError('Vout read overrun');
  }

  let len = 0;
  let offset = BigInt(1) + dataLength;

  for (let i = 0; i <= index; i += 1) {
    const remaining = utils.safeSlice(vout, offset, vout.length);
    len = determineOutputLength(remaining);
    if (i !== index) {
      offset += len;
    }
  }

  return utils.safeSlice(vout, offset, offset + len);
}

/**
 *
 * Extracts the value bytes from the output in a tx
 * Value is an 8-byte little-endian number
 *
 * @param {Uint8Array}    output The output
 * @returns {Uint8Array}  The output value as LE bytes
 */
export function extractValueLE(output) {
  return utils.safeSlice(output, 0, 8);
}

/**
 *
 * Extracts the value from the output in a tx
 * Value is an 8-byte little-endian number
 *
 * @param {Uint8Array}    output The output
 * @returns {BigInt}      The output value
 */
export function extractValue(output) {
  const leValue = extractValueLE(output);
  const beValue = utils.reverseEndianness(leValue);
  return utils.bytesToUint(beValue);
}

/**
 *
 * Extracts the data from an op return output
 * Errors if no data or not an op return
 *
 * @param {Uint8Array}    output The output
 * @returns {Uint8Array}  Any data contained in the opreturn output
 * @throws {TypeError}    When passed something other than an op return output
 */
export function extractOpReturnData(output) {
  if (output[9] !== 0x6a) {
    throw new TypeError('Malformatted data. Must be an op return.');
  }
  const dataLength = output[10];
  return utils.safeSlice(output, 11, 11 + dataLength);
}

/**
 *
 * Extracts the hash from the output script
 * Determines type by the length prefix and validates format
 *
 * @param {Uint8Array}    output The output
 * @returns {Uint8Array}  The hash committed to by the pk_script
 * @throws {TypeError}    When passed a non-standard output type
 */
export function extractHash(output) {
  if (output[8] + 9 !== output.length) {
    throw new TypeError('Reported length mismatch');
  }
  const tag = utils.safeSlice(output, 8, 11);

  /* Witness Case */
  if (output[9] === 0) {
    // Check for maliciously formatted witness outputs
    if (output[10] !== output[8] - 2 || (output[10] !== 0x20 && output[10] !== 0x14)) {
      throw new TypeError('Maliciously formatted witness output.');
    }
    return utils.safeSlice(output, 11, 11 + output[10]);
  }

  /* P2PKH */
  if (utils.typedArraysAreEqual(tag, new Uint8Array([0x19, 0x76, 0xa9]))) {
    const lastTwoBytes = utils.safeSlice(output, output.length - 2, output.length);
    if (output[11] !== 0x14
        || !utils.typedArraysAreEqual(lastTwoBytes, new Uint8Array([0x88, 0xac]))) {
    // Check for maliciously formatted p2pkh
      throw new TypeError('Maliciously formatted p2pkh output.');
    }
    return utils.safeSlice(output, 12, 32);
  }

  /* P2SH */
  if (utils.typedArraysAreEqual(tag, new Uint8Array([0x17, 0xa9, 0x14]))) {
    // Check for maliciously formatted p2sh
    if (output[output.length - 1] !== 0x87) {
      throw new TypeError('Maliciously formatted p2sh output.');
    }
    return utils.safeSlice(output, 11, 31);
  }

  /* Abnormal Case */
  throw new TypeError('Nonstandard, OP_RETURN, or malformatted output');
}

/* ********** */
/* Witness TX */
/* ********** */

/**
 *
 * Checks that the vin passed up is properly formatted
 * Consider a vin with a valid vout in its scriptsig
 *
 * @param {Uint8Array}      vin Raw bytes length-prefixed input vector
 * @returns {Boolean}       True if it represents a validly formatted vin
 */
export function validateVin(vin) {
  try {
    const vLength = BigInt(vin.length);

    const { dataLength, number: nIns } = parseVarInt(vin);

    // Not valid if it says there are too many or no inputs
    if (nIns === BigInt(0)) {
      return false;
    }

    let offset = BigInt(1) + dataLength;

    for (let i = 0; i < nIns; i += 1) {
      if (offset >= vLength) {
        return false;
      }
      // Grab the next input and determine its length.
      // Increase the offset by that much
      offset += determineInputLength(utils.safeSlice(vin, offset));
    }

    // Returns false if we're not exactly at the end
    return offset === vLength;
  } catch (e) {
    return false;
  }
}

/**
 *
 * Checks that the vout passed up is properly formatted
 * Consider a vin with a valid vout in its scriptsig
 *
 * @param {Uint8Array}    vout Raw bytes length-prefixed output vector
 * @returns {Boolean}     True if it represents a validly formatted vout
 */
export function validateVout(vout) {
  try {
    const vLength = BigInt(vout.length);

    const { dataLength, number: nOuts } = parseVarInt(vout);

    // Not valid if it says there are too many or no inputs
    if (nOuts === BigInt(0)) {
      return false;
    }

    let offset = BigInt(1) + dataLength;

    for (let i = 0; i < nOuts; i += 1) {
      if (offset >= vLength) {
        return false;
      }
      // Grab the next input and determine its length.
      // Increase the offset by that much
      offset += determineOutputLength(utils.safeSlice(vout, offset));
    }

    // Returns false if we're not exactly at the end
    return offset === vLength;
  } catch (e) {
    return false;
  }
}

/* ************ */
/* Block Header */
/* ************ */

/**
 *
 * Extracts the transaction merkle root from a block header
 * Returns a the merkle root from a block header as a Uint8Array.
 *
 * @param {Uint8Array}    header An 80-byte Bitcoin header
 * @returns {Uint8Array}  The merkle root (little-endian)
 */
export function extractMerkleRootLE(header) {
  return utils.safeSlice(header, 36, 68);
}

/**
 *
 * Extracts the target from a block header
 *
 * Target is a 256 bit number encoded as a 3-byte mantissa
 * and 1 byte exponent
 *
 * @param {Uint8Array}     header
 * @returns {BigInt}       The target threshold
 */
export function extractTarget(header) {
  const m = utils.safeSlice(header, 72, 75);
  const e = BigInt(header[75]);

  const mantissa = utils.bytesToUint(utils.reverseEndianness(m));

  const exponent = e - BigInt(3);

  return mantissa * (BigInt(256) ** exponent);
}

/**
 *
 * Calculate difficulty from the difficulty 1 target and current target
 * Difficulty 1 is 0x1d00ffff on mainnet and testnet
 *
 * @param {BigInt/number} target The current target
 * @returns {BigInt}      The block difficulty (bdiff)
 */
export function calculateDifficulty(target) {
  /* eslint-disable-next-line valid-typeof */
  if (typeof target !== 'bigint') {
    throw new TypeError('Argument must be a BigInt');
  }
  return DIFF_ONE_TARGET / target;
}

/**
 *
 * Extracts the previous block's hash from a block header
 * Block headers do NOT include block number :(
   *
 * @param {Uint8Array}    header An 80-byte Bitcoin header
 * @returns {Uint8Array}  The previous block's hash (little-endian)
 */
export function extractPrevBlockLE(header) {
  return utils.safeSlice(header, 4, 36);
}

/**
 *
 * Extracts the timestamp from a block header
 * Time is not 100% reliable
 *
 * @param {Uint8Array}    header The header
 * @returns {Uint8Array}  The timestamp (little-endian bytes)
 */
export function extractTimestampLE(header) {
  return utils.safeSlice(header, 68, 72);
}

/**
 *
 * Extracts the timestamp from a block header
 * Time is not 100% reliable
 *
 * @param {Uint8Array}    header The header
 * @returns {BigInt}      The timestamp (uint)
 */
export function extractTimestamp(header) {
  return utils.bytesToUint(
    utils.reverseEndianness(extractTimestampLE(header))
  );
}

/**
 *
 * Extracts the expected difficulty from a block header
 * Does NOT verify the work
 *
 * @param {Uint8Array}    header The header
 * @returns {BigInt}      The difficulty as an integer
 */
export function extractDifficulty(header) {
  return calculateDifficulty(
    extractTarget(header)
  );
}

/**
 *
 * Concatenates and hashes two inputs for merkle proving
 *
 * @param {Uint8Array}    a The first hash
 * @param {Uint8Array}    b The second hash
 * @returns {Uint8Array}  The double-sha256 of the concatenated hashes
 */
export function hash256MerkleStep(a, b) {
  return hash256(utils.concatUint8Arrays(a, b));
}

/**
 *
 * Verifies a Bitcoin-style merkle tree.
 * Leaves are 0-indexed.
 * Note that `index` is not a reliable indicator of location within a block.
 *
 * @param {Uint8Array}    proof The proof. Tightly packed LE sha256 hashes.
 *                        The last hash is the root
 * @param {Number}        index The index of the leaf
 * @returns {Boolean}     True if the proof is value, else false
 */
export function verifyHash256Merkle(proof, index) {
  let idx = index;
  const proofLength = proof.length;

  // Not an even number of hashes
  if (proofLength % 32 !== 0) {
    return false;
  }

  // Special case for coinbase-only blocks
  if (proofLength === 32) {
    return true;
  }

  // Should never occur
  if (proofLength === 64) {
    return false;
  }

  const root = utils.safeSlice(proof, (proofLength - 32), proofLength);
  let current = utils.safeSlice(proof, 0, 32);
  const length = (proofLength / 32) - 1;

  for (let i = 1; i < length; i += 1) {
    const next = utils.safeSlice(proof, (i * 32), ((i * 32) + 32));

    if (idx % 2 === 1) {
      current = hash256MerkleStep(next, current);
    } else {
      current = hash256MerkleStep(current, next);
    }
    idx >>= 1;
  }
  return utils.typedArraysAreEqual(current, root);
}

/**
 *
 * Performs the bitcoin difficulty retarget
 * Implements the Bitcoin algorithm precisely
 *
 * @param {BigInt}        previousTarget The target of the previous period
 * @param {number}        firstTimestamp The timestamp of the first block in the difficulty period
 * @param {number}        secondTimestamp The timestamp of the last block in the difficulty period
 * @returns {BigInt}      The new period's target threshold
 */
export function retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp) {
  let elapsedTime = BigInt(secondTimestamp - firstTimestamp);
  const rp = RETARGET_PERIOD;
  const lowerBound = rp / BigInt(4);
  const upperBound = rp * BigInt(4);

  // Normalize ratio to factor of 4 if very long or very short
  if (elapsedTime < lowerBound) {
    elapsedTime = lowerBound;
  }
  if (elapsedTime > upperBound) {
    elapsedTime = upperBound;
  }

  return previousTarget * elapsedTime / RETARGET_PERIOD;
}
