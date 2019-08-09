/** @title BitcoinSPV */
/** @author Summa (https://summa.one) */

const utils = require('../utils/utils')

module.exports = {

  RETARGET_PERIOD: 1209600n,
  RETARGET_PERIOD_BLOCKS: 2016n,
  DIFF1_TARGET: 0xffff0000000000000000000000000000000000000000000000000000n,

  /**
   * @notice Determines the length of a VarInt in bytes
   * @dev A VarInt of >1 byte is prefixed with a flag indicating its length
   * @param {string} flag The first byte of a VarInt
   * @returns {number} The number of non-flag bytes in the VarInt
   */
  determineVarIntDataLength: (flag) => {
    if (flag == 0xff) {
      return 8  // one-byte flag, 8 bytes data
    }
    if (flag == 0xfe) {
      return 4  // one-byte flag, 4 bytes data
    }
    if (flag == 0xfd) {
      return 2  // one-byte flag, 2 bytes data
    }

    return 0  // flag is data
  },

  /**
   * @notice Changes the endianness of a byte array
   * @dev Returns a new, backwards, byte array
   * @param {Uint8Array} uint8Arr The array to reverse
   * @returns {Uint8Array} The reversed array
   */
  reverseEndianness: (uint8Arr) => {
    let newArr = utils.safeSlice(uint8Arr)
    return new Uint8Array(newArr.reverse())
  },

  /**
   * @notice Converts big-endian array to a uint
   * @dev Traverses the byte array and sums the bytes
   * @param {Uint8Array} uint8Arr The big-endian array-encoded integer
   * @returns {BigInt} The integer representation
   */
  bytesToUint: (uint8Arr) => {
    let total = BigInt(0)
    for (let i = 0; i < uint8Arr.length; i++) {
      total += BigInt(uint8Arr[i]) << (BigInt(uint8Arr.length - i - 1) * BigInt(8))
    }
    return total

  },

  /**
   * @notice                 Get the last _num bytes from a byte array
   * @dev                    The byte array to slice
   * @param {Uint8Array}     uint8Arr The big-endian array-encoded integer
   * @returns {BigInt}       The integer representation
   */
  lastBytes: (arr, num) => {
    if (num >= arr.length) {
      throw new Error('Underflow during subtraction.')
    }
    return utils.safeSlice(arr, arr.length - num)
  },

  /**
   * @notice                Implements bitcoin's hash160 (rmd160(sha2()))
   * @dev
   * @param {Uint8Array}    preImage
   * @returns {Uint8Array}  The digest
   */
  hash160: (preImage) => {
    return utils.ripemd160(utils.sha256(preImage))
  },

/**
 * @notice                Implements bitcoin's hash256 (double sha2)
 * @dev
 * @param {Uint8Array}    preImage
 * @returns {Uint8Array}  The digest
 */
  hash256: (b) => {
    return utils.sha256(utils.sha256(b))
  },

  /* ************ */
  /* Legacy Input */
  /* ************ */

  /**
   * @notice Extracts the nth input from the vin (0-indexed)
   * @dev Iterates over the vin. If you need to extract several, write a custom function
   * @param {Uint8Array} vinArr The vin as a tightly-packed uint8array
   * @param index The 0-indexed location of the input to extract
   * @returns {Uint8Array} The input as a u8a
   */
  extractInputAtIndex: (vinArr, index) => {
    let len = 0
    let remaining = 0
    let offset = 1n

    for (var i = 0; i <= index; i++) {
      remaining = utils.safeSlice(vinArr, Number(offset), vinArr.length - 1)
      len = module.exports.determineInputLength(remaining)
      if (i !== index) {
        offset += len
      }
    }

    return utils.safeSlice(vinArr, Number(offset), Number(offset) + Number(len))
  },

  /**
   * @notice Determines whether an input is legacy
   * @dev False if no scriptSig, otherwise True
   * @param {Uint8Array} input The input
   * @returns {boolean} True for legacy, False for witness
   */
  isLegacyInput: (input) => {
    return !utils.typedArraysAreEqual(utils.safeSlice(input, 36, 37), new Uint8Array([0]))
  },

  /**
   * @notice Determines the length of an input from its scriptsig
   * @dev 36 for outpoint, 1 for scriptsig length, 4 for sequence
   * @param {Uint8Array} arr The input as a u8a
   * @returns {BigInt} The length of the input in bytes
   */
  determineInputLength: (arr) => {
    let res = module.exports.extractScriptSigLen(arr)
    let varIntDataLen = res.dataLen
    let scriptSigLen = res.scriptSigLen
    return BigInt(41) + varIntDataLen + scriptSigLen
  },

  /**
   * @notice Extracts the LE sequence bytes from an input
   * @dev Sequence is used for relative time locks
   * @param {Uint8Array} input The LEGACY input
   * @returns {Uint8Array} The sequence bytes (LE uint)
   */
  extractSequenceLELegacy: (input) => {
    let res = module.exports.extractScriptSigLen(input)
    let varIntDataLen = res.dataLen
    let scriptSigLen = res.scriptSigLen
    let length = 36 + 1 + Number(varIntDataLen) + Number(scriptSigLen)
    return utils.safeSlice(input, length, length + 4)
  },

  /**
   * @notice Extracts the sequence from the input
   * @dev Sequence is a 4-byte little-endian number
   * @param {Uint8Array} input The LEGACY input
   * @returns {Uint8Array} The sequence number (big-endian uint array)
   */
  extractSequenceLegacy: (input) => {
    let leSeqence = module.exports.extractSequenceLELegacy(input)
    let beSequence = module.exports.reverseEndianness(leSeqence)
    return utils.bytesToUint(beSequence)
  },

  /**
   * @notice Extracts the VarInt-prepended scriptSig from the input in a tx
   * @dev Will return hex"00" if passed a witness input
   * @param {Uint8Array} input The LEGACY input
   * @returns {Uint8Array} The length-prepended script sig
   */
  extractScriptSig: (input) => {
    let res = module.exports.extractScriptSigLen(input)
    let varIntDataLen = res.dataLen
    let scriptSigLen = res.scriptSigLen
    let length = 1 + Number(varIntDataLen) + Number(scriptSigLen)
    return utils.safeSlice(input, 36, 36 + length)
  },

  /**
   * @notice Determines the length of a scriptSig in an input
   * @dev Will return 0 if passed a witness input
   * @param {Uint8Array} arr The LEGACY input
   * @returns {object} The length of the script sig in object form
   */
  extractScriptSigLen: (arr) => {
    let varIntTag = utils.safeSlice(arr, 36, 37)
    let varIntDataLen = module.exports.determineVarIntDataLength(varIntTag[0])
    let len = 0
    if (varIntDataLen == 0) {
      len = varIntTag[0]
    } else {
      len = utils.bytesToUint(module.exports.reverseEndianness(utils.safeSlice(arr, 37, 37 + varIntDataLen)))
    }
    return { dataLen: BigInt(varIntDataLen), scriptSigLen: BigInt(len)}
  },


  /* ************* */
  /* Witness Input */
  /* ************* */

  /**
   * @notice Extracts the LE sequence bytes from an input
   * @dev Sequence is used for relative time locks
   * @param {Uint8Array} input The WITNESS input
   * @returns {Uint8Array} The sequence bytes (LE uint)
   */
  extractSequenceLEWitness: (input) => {
    return utils.safeSlice(input, 37, 41)
  },

  /**
   * @notice Extracts the sequence from the input in a tx
   * @dev Sequence is a 4-byte little-endian number
   * @param {Uint8Array} input The WITNESS input
   * @returns {Uint8Array} The sequence number (big-endian u8a)
   */
  extractSequenceWitness: (input) => {
    let leSeqence = module.exports.extractSequenceLEWitness(input)
    let inputSequence = module.exports.reverseEndianness(leSeqence)
    return utils.bytesToUint(inputSequence)
  },

  /**
   * @notice                Extracts the outpoint from the input in a tx
   * @dev                   32 byte tx id with 4 byte index
   * @param {Uint8Array}    input The input
   * @returns {Uint8Array}  The outpoint (LE bytes of prev tx hash + LE bytes of prev tx index)
   */
  extractOutpoint: (input) => {
    return utils.safeSlice(input, 0, 36)
  },

  /**
   * @notice                Extracts the outpoint tx id from an input
   * @dev                   32 byte tx id
   * @param {Uint8Array}    input The input
   * @returns {Uint8Array}  The tx id (little-endian bytes)
   */
  // TODO: no test, check against function that uses this
  extractInputTxIdLE: (input) => {
    return utils.safeSlice(input, 0, 32)
  },

  /**
   * @notice                Extracts the outpoint index from an input
   * @dev                   32 byte tx id
   * @param {Uint8Array}    input The input
   * @returns {Uint8Array}  The tx id (big-endian bytes)
   */
  // TODO: no test, check against function that uses this
  extractInputTxId: (input) => {
    let leId = module.exports.extractInputTxId(input)
    return module.exports.reverseEndianness(leId)
  },

  /**
   * @notice                Extracts the LE tx input index from the input in a tx
   * @dev                   4 byte tx index
   * @param {Uint8Array}    input The input
   * @returns {Uint8Array}  The tx index (little-endian bytes)
   */
  // TODO: no test, check against function that uses this
  extractTxIndexLE: (input) => {
    return utils.safeSlice(input, 32, 36)
  },

  /**
   * @notice                Extracts the LE tx input index from the input in a tx
   * @dev                   4 byte tx index
   * @param {Uint8Array}    input The input
   * @returns {BigInt}      The tx index (big-endian uint)
   */
  // TODO: no test, check against function that uses this
  extractTxIndex: (input) => {
    let leIndex = module.exports.extractTxIndexLE(input)
    let beIndex = module.exports.reverseEndianness(leIndex)
    return utils.bytesToUint(beIndex)
  },

  /* ****** */
  /* Output */
  /* ****** */

  /**
   * @notice Determines the length of an output
   * @dev 5 types: WPKH, WSH, PKH, SH, and OP_RETURN
   * @param {Uint8Array} output The output
   * @returns {number} The length indicated by the prefix, error if invalid length
   */
  determineOutputLength: (output) => {
    let len = utils.safeSlice(output, 8, 9)[0]

    if (len > 0xfd) {
      throw new Error("Multi-byte VarInts not supported")
    }

    return BigInt(len) + 8n + 1n // 8 byte value, 1 byte for len itself
  },

  /**
   * @notice Extracts the output at a given index in the TxIns vector
   * @dev Iterates over the vout. If you need to extract multiple, write a custom function
   * @param {Uint8Array} vout The _vout to extract from
   * @param {number} index The 0-indexed location of the output to extract
   * @returns {Uint8Array} The specified output
   */
  extractOutputAtIndex: (vout, index) => {
    let len
    let remaining
    let offset = 1n

    for (let i = 0; i <= index; i++) {
      remaining = utils.safeSlice(vout, Number(offset), vout.length - 1)
      len = module.exports.determineOutputLength(remaining)
      if (i !== index) {
        offset += len
      }
    }

    return utils.safeSlice(vout, Number(offset), Number(offset) + Number(len))
  },

  /**
   * @notice Extracts the output script length
   * @dev Indexes the length prefix on the pk_script
   * @param {Uint8Array} output The output
   * @returns {Uint8Array} The 1 byte length prefix
   */
  extractOutputScriptLen: (output) => {
    return utils.safeSlice(output, 8, 9);
  },

  /**
   * @notice Extracts the value bytes from the output in a tx
   * @dev Value is an 8-byte little-endian number
   * @param {Uint8Array} output The output
   * @returns {Uint8Array} The output value as LE bytes
   */
  extractValueLE: (output) => {
    return utils.safeSlice(output, 0, 8);
  },

  /**
   * @notice Extracts the value from the output in a tx
   * @dev Value is an 8-byte little-endian number
   * @param {Uint8Array} output The output
   * @returns {Uint8Array} The output value
   */
  extractValue: (output) => {
    let leValue = module.exports.extractValueLE(output);
    let beValue = module.exports.reverseEndianness(leValue);
    return utils.bytesToUint(beValue);
  },

  /**
   * @notice Extracts the data from an op return output
   * @dev Returns empty Uint8Array if no data or not an op return
   * @param {Uint8Array} output The output
   * @returns {Uint8Array} Any data contained in the opreturn output, null if not an op return
   */
  extractOpReturnData: (output) => {
    if (!utils.typedArraysAreEqual(utils.safeSlice(output, 9, 10), new Uint8Array([106]))) {
      return null
    }
    let dataLen = utils.safeSlice(output, 10, 11);
    return utils.safeSlice(output, 11, 11 + Number(utils.bytesToUint(dataLen)));
  },

  /**
   * @notice Extracts the hash from the output script
   * @dev Determines type by the length prefix and validates format
   * @param {Uint8Array} output The output
   * @returns {Uint8Array} The hash committed to by the pk_script, or null for errors
   */
  extractHash: (output) => {
    if (utils.safeSlice(output, 9, 10)[0] == 0) {
      let len = module.exports.extractOutputScriptLen(output)[0] - 2;
      // Check for maliciously formatted witness outputs
      if (utils.safeSlice(output, 10, 11)[0] != len) {
        return null;
      }
      return utils.safeSlice(output, 11, 11 + len);
    } else {
      let tag = utils.safeSlice(output, 8, 11);
      // p2pkh
      if (utils.typedArraysAreEqual(tag, utils.deserializeHex('0x1976a9'))) {
        // Check for maliciously formatted p2pkh
        if (utils.safeSlice(output, 11, 12)[0] != 0x14 || !utils.typedArraysAreEqual(utils.safeSlice(output, output.length - 2, output.length), utils.deserializeHex('0x88ac'))) {
          return null;
        }
        return utils.safeSlice(output, 12, 32);
      //p2sh
      } else if (utils.typedArraysAreEqual(tag, utils.deserializeHex('0x17a914'))) {
        // Check for maliciously formatted p2sh
        if (utils.safeSlice(output, output.length - 1, output.length)[0] != 0x87) {
          return null;
        }
        return utils.safeSlice(output, 11, 31);
      }
    }
    return null;  /* NB: will trigger on OPRETURN and non-standard that don't overrun */
  },

  /* ********** */
  /* Witness TX */
  /* ********** */

  /**
   * @notice                  Checks that the vin passed up is properly formatted
   * @dev                     Consider a vin with a valid vout in its scriptsig
   * @param {Uint8Array}      vin Raw bytes length-prefixed input vector
   * @returns {Boolean}       True if it represents a validly formatted vin
   */
  validateVin: (vin) => {
    let offset = 1n
    let vLength = BigInt(vin.length)
    nIns = utils.safeSlice(vin, 0, 1)[0]

    // Not valid if it says there are too many or no inputs
    if (nIns >= 0xfd || nIns === 0) {
      return false
    }

    for (let i = 0; i < nIns; i++) {
      // Grab the next input and determine its length.
      // Increase the offset by that much
      offset += module.exports.determineInputLength(utils.safeSlice(vin, Number(offset)))

      // Returns false if we jump past the end
      if (offset > vLength) {
        return false
      }
    }

    // Returns false if we're not exactly at the end
    return offset == vLength
  },

  /**
   * @noticeChecks            Checks that the vout passed up is properly formatted
   * @dev                     Consider a vin with a valid vout in its scriptsig
   * @param {Uint8Array}      vout Raw bytes length-prefixed output vector
   * @returns {Boolean}       True if it represents a validly formatted bout
   */
  validateVout: (vout) => {
    offset = 1n
    let vLength = BigInt(vout.length)
    nOuts = utils.safeSlice(vout, 0, 1)[0]

    // Not valid if it says there are too many or no inputs
    if (nOuts >= 0xfd || nOuts === 0) {
      return false
    }

    for (let i = 0; i < nOuts; i++) {
      // Grab the next input and determine its length.
      // Increase the offset by that much
      offset += module.exports.determineOutputLength(utils.safeSlice(vout, Number(offset)))
    }

    // Returns false if we jump past the end
    if (offset > vLength) {
      return false
    }

    // Returns false if we're not exactly at the end
    return offset == vLength
  },



  /* ************ */
  /* Block Header */
  /* ************ */

  /**
   * @notice                Extracts the transaction merkle root from a block header
   * @dev                   Returns a the merkle root from a block header as a Uint8Array.
   * @param {Uint8Array}    header
   * @returns {Uint8Array}  The merkle root (little-endian)
   */
  extractMerkleRootLE: (header) => {
    return utils.safeSlice(header, 36, 68)
  },

  /**
   * @notice                Extracts the transaction merkle root from a block header
   * @dev                   Use verifyHash256Merkle to verify proofs with this root
   * @param {Uint8Array}    header
   * @returns {number}      The serialized merkle root (big-endian)
   */
  extractMerkleRootBE: (header) => {
    return module.exports.reverseEndianness(module.exports.extractMerkleRootLE(header))
  },

  /**
   * @notice                 Extracts the target from a block header
   * @dev                    Target is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
   * @param {Uint8Array}     header
   * @returns {BigInt}       The target threshold
   */
  extractTarget: (header) => {
    let m = utils.safeSlice(header, 72, 75)
    let e = BigInt(header[75])

    let mantissa = utils.bytesToUint(module.exports.reverseEndianness(m))

    let exponent = e - 3n

    return mantissa * 256n ** exponent
  },

  /**
   * @notice                Calculate difficulty from the difficulty 1 target and current target
   * @dev                   Difficulty 1 is 0x1d00ffff on mainnet and testnet
   * @dev                   Difficulty 1 is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
   * @param {BigInt/number} target
   * @returns {BigInt}      The block difficulty (bdiff)
   */
  calculateDifficulty: (target) => {
    if (typeof target !== 'bigint') {
      let bigTarget = BigInt(target)
      return module.exports.DIFF1_TARGET / bigTarget
    }
    return module.exports.DIFF1_TARGET / target
  },

  /**
   * @notice                Extracts the previous block's hash from a block header
   * @dev                   Block headers do NOT include block number :(
   * @param {Uint8Array}    header
   * @returns {Uint8Array}  The previous block's hash (little-endian)
   */
  extractPrevBlockLE: (header) => {
    return utils.safeSlice(header, 4, 36)
  },

  /**
   *  @notice                Extracts the previous block's hash from a block header
   * @dev                   Block headers do NOT include block number :(
   * @param {Uint8Array}    header
   * @returns {Uint8Array}  The previous block's hash (big-endian)
   */
  extractPrevBlockBE: (header) => {
    return module.exports.reverseEndianness(module.exports.extractPrevBlockLE(header))
  },

  /**
   * @notice                Extracts the timestamp from a block header
   * @dev                   Time is not 100% reliable
   * @param {Uint8Array}    header
   * @returns {Uint8Array}  The timestamp (little-endian bytes)
   */
  extractTimestampLE: (header) => {
    return utils.safeSlice(header, 68, 72)
  },

  /**
   * @notice                    Extracts the timestamp from a block header
   * @dev                       Time is not 100% reliable
   * @param {Uint8Array}        header
   * @returns {BigInt/number}   The timestamp (uint)
   */
  extractTimestamp: (header) => {
    return utils.bytesToUint(module.exports.reverseEndianness(module.exports.extractTimestampLE(header)))
  },

  /**
   * @notice                Extracts the expected difficulty from a block header
   * @dev                   Does NOT verify the work
   * @param {Uint8Array}    header
   * @returns {BigInt}      The difficulty as an integer
   */
  extractDifficulty: (header) => {
    return module.exports.calculateDifficulty(module.exports.extractTarget(header))
  },

  /**
   * @notice                Concatenates and hashes two inputs for merkle proving
   * @dev
   * @param {Uint8Array}    a The first hash
   * @param {Uint8Array}    b The second hash
   * @returns {Uint8Array}  The double-sha256 of the concatenated hashes
   */
  hash256MerkleStep: (a, b) => {
    return module.exports.hash256(utils.concatUint8Arrays([a, b]))
  },

  /**
   * @notice                  Verifies a Bitcoin-style merkle tree
   * @dev                     Leaves are 1-indexed.
   * @param {Uin8Array}       proof The proof. Tightly packed LE sha256 hashes. The last hash is the root
   * @param {Number}          index The index of the leaf
   * @returns {Boolean}       true if the proof is value, else false
   */
  verifyHash256Merkle: (proof, index) => {
    const proofLength = proof.length

    // Not an even number of hashes
    if (proofLength % 32 !== 0) {
      return false
    }

    // Special case for coinbase-only blocks
    if (proofLength === 32) {
      return true
    }

    // Should never occur
    if (proofLength === 64) {
      return false
    }

    let idx = BigInt(index)
    let root = utils.safeSlice(proof, (proofLength - 32), proofLength)
    let current = utils.safeSlice(proof, 0, 32)

    for (let i = 1; i < ((proofLength / 32) - 1); i++) {
      if (idx % 2n === 1n) {
        current = module.exports.hash256MerkleStep(utils.safeSlice(proof, (i * 32), ((i * 32) + 32)), current)
      } else {
        current = module.exports.hash256MerkleStep(current, utils.safeSlice(proof, (i * 32), ((i * 32) + 32)))
      }
      idx = idx >> 1n
    }
    return utils.typedArraysAreEqual(current, root)
  },

  /**
   * @notice                performs the bitcoin difficulty retarget
   * @dev                   implements the Bitcoin algorithm precisely
   * @param {number}        previousTarget, could be BigInt
   * @param {number}        firstTimestamp
   * @param {number}        secondTimestamp
   * @returns {BigInt}      the new period's target threshold
   */
  retargetAlgorithm: (previousTarget, firstTimestamp, secondTimestamp) => {
    let elapsedTime = BigInt(secondTimestamp - firstTimestamp);
    const rp = module.exports.RETARGET_PERIOD
    const div = rp / 4n
    const mult = rp * 4n

    // Normalize ratio to factor of 4 if very long or very short
    if (elapsedTime < div) {
      elapsedTime = div
    }
    if (elapsedTime > mult) {
      elapsedTime = mult
    }

    /*
      NB: high targets e.g. ffff0020 can cause overflows here
          so we divide it by 256**2, then multiply by 256**2 later
          we know the target is evenly divisible by 256**2, so this isn't an issue
    */

    let adjusted = (previousTarget / 65536n) * elapsedTime;
    return (adjusted / module.exports.RETARGET_PERIOD) * 65536n;
  }
}
