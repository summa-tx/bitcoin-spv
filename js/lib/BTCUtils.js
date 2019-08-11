/* global BigInt */

/**
 *
 * @file Part of the [bitcoin-spv]{@link https://github.com/summa-tx/bitcoin-spv} project
 *
 * @title BTCUtils
 * @summary Utility functions for parsing Bitcoin datastructures
 * @author James Prestwich <jamese@summa.one>
 * @author Erin Hales <example@gmail.com>
 * @author Dominique Liau <example@gmail.com>
 * @copyright (c) [Summa]{@link https://summa.one} 2019
 * @module BTCUtils
 *
 */

import * as utils from '../utils/utils';

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
 *
 * @dev                   A VarInt of >1 byte is prefixed with a flag indicating its length
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
 * Changes the endianness of a byte array
 *
 * @dev                   Returns a new, backwards, byte array
 * @param {Uint8Array}    uint8Arr The array to reverse
 * @returns {Uint8Array}  The reversed array
 */
export function reverseEndianness(uint8Arr) {
  const newArr = utils.safeSlice(uint8Arr);
  return new Uint8Array(newArr.reverse());
}

/**
 *
 * Converts big-endian array to a uint
 *
 * @dev                   Traverses the byte array and sums the bytes
 * @param {Uint8Array}    uint8Arr The big-endian array-encoded integer
 * @returns {BigInt}      The integer representation
 */
export function bytesToUint(uint8Arr) {
  let total = BigInt(0);
  for (let i = 0; i < uint8Arr.length; i += 1) {
    total += BigInt(uint8Arr[i]) << (BigInt(uint8Arr.length - i - 1) * BigInt(8));
  }
  return total;
}

/**
 *
 * Get the last _num bytes from a byte array
 *
 * @dev                    The byte array to slice
 * @param {Uint8Array}     uint8Arr The big-endian array-encoded integer
 * @returns {BigInt}       The integer representation
 */
export function lastBytes(arr, num) {
  return utils.safeSlice(arr, arr.length - num);
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
 *
 * @dev                   Will return 0 if passed a witness input
 * @param {Uint8Array}    arr The LEGACY input
 * @returns {object}      The length of the script sig in object form
 */
export function extractScriptSigLen(arr) {
  const varIntTag = utils.safeSlice(arr, 36, 37);
  const varIntDataLen = determineVarIntDataLength(varIntTag[0]);
  let len = 0;
  if (varIntDataLen === 0) {
    [len] = varIntTag;
  } else {
    const varIntData = utils.safeSlice(arr, 37, 37 + varIntDataLen);
    len = utils.bytesToUint(reverseEndianness(varIntData));
  }
  return { dataLen: BigInt(varIntDataLen), scriptSigLen: BigInt(len) };
}

/**
 *
 * Extracts the LE sequence bytes from an input
 *
 * @dev                   Sequence is used for relative time locks
 * @param {Uint8Array}    input The LEGACY input
 * @returns {Uint8Array}  The sequence bytes (LE uint)
 */
export function extractSequenceLELegacy(input) {
  const { dataLen, scriptSigLen } = extractScriptSigLen(input);
  const length = 36 + 1 + Number(dataLen) + Number(scriptSigLen);
  return utils.safeSlice(input, length, length + 4);
}

/**
 *
 * Determines the length of an input from its scriptsig
 *
 * @dev                   36 for outpoint, 1 for scriptsig length, 4 for sequence
 * @param {Uint8Array}    arr The input as a u8a
 * @returns {BigInt}      The length of the input in bytes
 */
export function determineInputLength(input) {
  const { dataLen, scriptSigLen } = extractScriptSigLen(input);
  return BigInt(41) + dataLen + scriptSigLen;
}

/**
 *
 * Extracts the nth input from the vin (0-indexed)
 *
 * @dev                   Iterates over the vin. If you need to extract several,
 *                        write a custom function
 * @param {Uint8Array}    vinArr The vin as a tightly-packed uint8array
 * @param {index}         index The 0-indexed location of the input to extract
 * @returns {Uint8Array}  The input as a u8a
 */
export function extractInputAtIndex(vinArr, index) {
  let len = 0;
  let offset = BigInt(1);

  for (let i = 0; i <= index; i += 1) {
    const remaining = utils.safeSlice(vinArr, offset, vinArr.length - 1);
    len = determineInputLength(remaining);
    if (i !== index) {
      offset += len;
    }
  }

  return utils.safeSlice(vinArr, offset, offset + len);
}

/**
 *
 * Determines whether an input is legacy
 *
 * @dev                   False if no scriptSig, otherwise True
 * @param {Uint8Array}    input The input
 * @returns {boolean}     True for legacy, False for witness
 */
export function isLegacyInput(input) {
  return input[36] !== 0;
}

/**
 *
 * Extracts the sequence from the input
 *
 * @dev                   Sequence is a 4-byte little-endian number
 * @param {Uint8Array}    input The LEGACY input
 * @returns {BigInt}      The sequence number
 */
export function extractSequenceLegacy(input) {
  const leSeqence = extractSequenceLELegacy(input);
  const beSequence = reverseEndianness(leSeqence);
  return utils.bytesToUint(beSequence);
}

/**
 *
 * Extracts the VarInt-prepended scriptSig from the input in a tx
 *
 * @dev                   Will return hex"00" if passed a witness input
 * @param {Uint8Array}    input The LEGACY input
 * @returns {Uint8Array}  The length-prepended script sig
 */
export function extractScriptSig(input) {
  const { dataLen, scriptSigLen } = extractScriptSigLen(input);
  const length = 1 + Number(dataLen) + Number(scriptSigLen);
  return utils.safeSlice(input, 36, 36 + length);
}


/* ************* */
/* Witness Input */
/* ************* */

/**
 *
 * Extracts the LE sequence bytes from an input
 *
 * @dev                   Sequence is used for relative time locks
 * @param {Uint8Array}    input The WITNESS input
 * @returns {Uint8Array}  The sequence bytes (LE uint)
 */
export function extractSequenceLEWitness(input) {
  return utils.safeSlice(input, 37, 41);
}

/**
 *
 * Extracts the sequence from the input in a tx
 *
 * @dev                   Sequence is a 4-byte little-endian number
 * @param {Uint8Array}    input The WITNESS input
 * @returns {BigInt}      The sequence number (big-endian u8a)
 */
export function extractSequenceWitness(input) {
  const leSeqence = extractSequenceLEWitness(input);
  const inputSequence = reverseEndianness(leSeqence);
  return utils.bytesToUint(inputSequence);
}

/**
 *
 * Extracts the outpoint from the input in a tx
 *
 * @dev                   32 byte tx id with 4 byte index
 * @param {Uint8Array}    input The input
 * @returns {Uint8Array}  The outpoint (LE bytes of prev tx hash + LE bytes of prev tx index)
 */
export function extractOutpoint(input) {
  return utils.safeSlice(input, 0, 36);
}

/**
 *
 * Extracts the outpoint tx id from an input
 *
 * @dev                   32 byte tx id
 * @param {Uint8Array}    input The input
 * @returns {Uint8Array}  The tx id (little-endian bytes)
 */
// TODO: no test, check against function that uses this
export function extractInputTxIdLE(input) {
  return utils.safeSlice(input, 0, 32);
}

/**
 *
 * Extracts the outpoint index from an input
 *
 * @dev                   32 byte tx id
 * @param {Uint8Array}    input The input
 * @returns {Uint8Array}  The tx id (big-endian bytes)
 */
// TODO: no test, check against function that uses this
export function extractInputTxId(input) {
  const leId = extractInputTxIdLE(input);
  return reverseEndianness(leId);
}

/**
 *
 * Extracts the LE tx input index from the input in a tx
 *
 * @dev                   4 byte tx index
 * @param {Uint8Array}    input The input
 * @returns {Uint8Array}  The tx index (little-endian bytes)
 */
// TODO: no test, check against function that uses this
export function extractTxIndexLE(input) {
  return utils.safeSlice(input, 32, 36);
}

/**
 *
 * Extracts the LE tx input index from the input in a tx
 *
 * @dev                   4 byte tx index
 * @param {Uint8Array}    input The input
 * @returns {BigInt}      The tx index (big-endian uint)
 */
// TODO: no test, check against function that uses this
export function extractTxIndex(input) {
  const leIndex = extractTxIndexLE(input);
  const beIndex = reverseEndianness(leIndex);
  return utils.bytesToUint(beIndex);
}

/* ****** */
/* Output */
/* ****** */

/**
 *
 * Determines the length of an output
 *
 * @dev                   5 types: WPKH, WSH, PKH, SH, and OP_RETURN
 * @param {Uint8Array}    output The output
 * @returns {number}      The length indicated by the prefix, error if invalid length
 * @throws {RangeError}   When output script is longer than 0xfc bytes
 */
export function determineOutputLength(output) {
  const len = utils.safeSlice(output, 8, 9)[0];

  if (len > 0xfd) {
    throw new RangeError('Multi-byte VarInts not supported');
  }

  return BigInt(len) + BigInt(8 + 1); // 8 byte value, 1 byte for len itself
}

/**
 *
 * Extracts the output at a given index in the TxIns vector
 *
 * @dev                   Iterates over the vout. If you need to extract multiple,
 *                        write a custom function
 * @param {Uint8Array}    vout The _vout to extract from
 * @param {number}        index The 0-indexed location of the output to extract
 * @returns {Uint8Array}  The specified output
 */
export function extractOutputAtIndex(vout, index) {
  let len;
  let remaining;
  let offset = BigInt(1);

  for (let i = 0; i <= index; i += 1) {
    remaining = utils.safeSlice(vout, offset, vout.length - 1);
    len = determineOutputLength(remaining);
    if (i !== index) {
      offset += len;
    }
  }

  return utils.safeSlice(vout, offset, offset + len);
}

/**
 *
 * Extracts the output script length
 *
 * @dev                   Indexes the length prefix on the pk_script
 * @param {Uint8Array}    output The output
 * @returns {Uint8Array}  The 1 byte length prefix
 */
export function extractOutputScriptLen(output) {
  return output[8];
}

/**
 *
 * Extracts the value bytes from the output in a tx
 *
 * @dev                   Value is an 8-byte little-endian number
 * @param {Uint8Array}    output The output
 * @returns {Uint8Array}  The output value as LE bytes
 */
export function extractValueLE(output) {
  return utils.safeSlice(output, 0, 8);
}

/**
 *
 * Extracts the value from the output in a tx
 *
 * @dev                   Value is an 8-byte little-endian number
 * @param {Uint8Array}    output The output
 * @returns {Uint8Array}  The output value
 */
export function extractValue(output) {
  const leValue = extractValueLE(output);
  const beValue = reverseEndianness(leValue);
  return utils.bytesToUint(beValue);
}

/**
 *
 * Extracts the data from an op return output
 *
 * @dev                   Errors if no data or not an op return
 * @param {Uint8Array}    output The output
 * @returns {Uint8Array}  Any data contained in the opreturn output, null if not an op return
 * @throws {TypeError}    When passed something other than an op return output
 */
export function extractOpReturnData(output) {
  if (!utils.typedArraysAreEqual(utils.safeSlice(output, 9, 10), new Uint8Array([106]))) {
    throw new TypeError('Malformatted data. Must be an op return.');
  }
  const dataLen = utils.safeSlice(output, 10, 11);
  return utils.safeSlice(output, 11, 11 + Number(utils.bytesToUint(dataLen)));
}

/**
 *
 * Extracts the hash from the output script
 *
 * @dev                   Determines type by the length prefix and validates format
 * @param {Uint8Array}    output The output
 * @returns {Uint8Array}  The hash committed to by the pk_script, or null for errors
 * @throws {TypeError}    When passed a non-standard output type
 */
export function extractHash(output) {
  const tag = utils.safeSlice(output, 8, 11);

  /* Witness Case */
  if (output[9] === 0) {
    const len = extractOutputScriptLen(output) - 2;
    // Check for maliciously formatted witness outputs
    if (output[10] !== len) {
      throw new TypeError('Maliciously formatted witness output.');
    }
    return utils.safeSlice(output, 11, 11 + len);
  }

  /* P2PKH */
  if (utils.typedArraysAreEqual(tag, utils.deserializeHex('0x1976a9'))) {
    // Check for maliciously formatted p2pkh
    if (output[11] !== 0x14 || !utils.typedArraysAreEqual(utils.safeSlice(output, output.length - 2, output.length), utils.deserializeHex('0x88ac'))) {
      throw new TypeError('Maliciously formatted p2pkh output.');
    }
    return utils.safeSlice(output, 12, 32);
  }

  /* P2SH */
  if (utils.typedArraysAreEqual(tag, utils.deserializeHex('0x17a914'))) {
    // Check for maliciously formatted p2sh
    if (utils.safeSlice(output, output.length - 1, output.length)[0] !== 0x87) {
      // return null;
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
 *
 * @dev                     Consider a vin with a valid vout in its scriptsig
 * @param {Uint8Array}      vin Raw bytes length-prefixed input vector
 * @returns {Boolean}       True if it represents a validly formatted vin
 */
export function validateVin(vin) {
  let offset = BigInt(1);
  const vLength = BigInt(vin.length);
  const [nIns] = vin;

  // Not valid if it says there are too many or no inputs
  if (nIns >= 0xfd || nIns === 0) {
    return false;
  }

  for (let i = 0; i < nIns; i += 1) {
    // Grab the next input and determine its length.
    // Increase the offset by that much
    offset += determineInputLength(utils.safeSlice(vin, offset));

    // Returns false if we jump past the end
    if (offset > vLength) {
      return false;
    }
  }

  // Returns false if we're not exactly at the end
  return offset === vLength;
}

/**
 *
 * Checks that the vout passed up is properly formatted
 *
 * @dev                   Consider a vin with a valid vout in its scriptsig
 * @param {Uint8Array}    vout Raw bytes length-prefixed output vector
 * @returns {Boolean}     True if it represents a validly formatted bout
 */
export function validateVout(vout) {
  let offset = BigInt(1);
  const vLength = BigInt(vout.length);
  const [nOuts] = vout;

  // Not valid if it says there are too many or no inputs
  if (nOuts >= 0xfd || nOuts === 0) {
    return false;
  }

  for (let i = 0; i < nOuts; i += 1) {
    // Grab the next input and determine its length.
    // Increase the offset by that much
    offset += determineOutputLength(utils.safeSlice(vout, offset));
  }

  // Returns false if we jump past the end
  if (offset > vLength) {
    return false;
  }

  // Returns false if we're not exactly at the end
  return offset === vLength;
}

/* ************ */
/* Block Header */
/* ************ */

/**
 *
 * Extracts the transaction merkle root from a block header
 *
 * @dev                   Returns a the merkle root from a block header as a Uint8Array.
 * @param {Uint8Array}    header An 80-byte Bitcoin header
 * @returns {Uint8Array}  The merkle root (little-endian)
 */
export function extractMerkleRootLE(header) {
  return utils.safeSlice(header, 36, 68);
}

/**
 *
 * Extracts the transaction merkle root from a block header
 *
 * @dev                   Use verifyHash256Merkle to verify proofs with this root
 * @param {Uint8Array}    header An 80-byte Bitcoin header
 * @returns {number}      The serialized merkle root (big-endian)
 */
export function extractMerkleRootBE(header) {
  return reverseEndianness(
    extractMerkleRootLE(header)
  );
}

/**
 *
 * Extracts the target from a block header
 *
 * @dev                    Target is a 256 bit number encoded as a 3-byte mantissa
 *                         and 1 byte exponent
 * @param {Uint8Array}     header
 * @returns {BigInt}       The target threshold
 */
export function extractTarget(header) {
  const m = utils.safeSlice(header, 72, 75);
  const e = BigInt(header[75]);

  const mantissa = utils.bytesToUint(reverseEndianness(m));

  const exponent = e - BigInt(3);

  return mantissa * (BigInt(256) ** exponent);
}

/**
 *
 * Calculate difficulty from the difficulty 1 target and current target
 *
 * @dev                   Difficulty 1 is 0x1d00ffff on mainnet and testnet
 * @param {BigInt/number} target The current target
 * @returns {BigInt}      The block difficulty (bdiff)
 */
export function calculateDifficulty(target) {
  let t = target;

  /* eslint-disable-next-line valid-typeof */
  if (typeof target !== 'bigint') {
    t = BigInt(target);
  }
  return DIFF_ONE_TARGET / t;
}

/**
 *
 * Extracts the previous block's hash from a block header
 *
 * @dev                   Block headers do NOT include block number :(
 * @param {Uint8Array}    header An 80-byte Bitcoin header
 * @returns {Uint8Array}  The previous block's hash (little-endian)
 */
export function extractPrevBlockLE(header) {
  return utils.safeSlice(header, 4, 36);
}

/**
 *
 *  Extracts the previous block's hash from a block header
 *
 * @dev                   Block headers do NOT include block number :(
 * @param {Uint8Array}    header The header
 * @returns {Uint8Array}  The previous block's hash (big-endian)
 */
export function extractPrevBlockBE(header) {
  return reverseEndianness(
    extractPrevBlockLE(header)
  );
}

/**
 *
 * Extracts the timestamp from a block header
 *
 * @dev                   Time is not 100% reliable
 * @param {Uint8Array}    header The header
 * @returns {Uint8Array}  The timestamp (little-endian bytes)
 */
export function extractTimestampLE(header) {
  return utils.safeSlice(header, 68, 72);
}

/**
 *
 * Extracts the timestamp from a block header
 *
 * @dev                   Time is not 100% reliable
 * @param {Uint8Array}    header The header
 * @returns {BigInt}      The timestamp (uint)
 */
export function extractTimestamp(header) {
  return utils.bytesToUint(
    reverseEndianness(extractTimestampLE(header))
  );
}

/**
 *
 * Extracts the expected difficulty from a block header
 *
 * @dev                   Does NOT verify the work
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
  return hash256(utils.concatUint8Arrays([a, b]));
}

/**
 *
 * Verifies a Bitcoin-style merkle tree
 *
 * @dev                   Leaves are 1-indexed.
 * @param {Uin8Array}     proof The proof. Tightly packed LE sha256 hashes.
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
 *
 * @dev                   Implements the Bitcoin algorithm precisely
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
