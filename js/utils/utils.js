/* global BigInt */
const shaLib = require('./sha256.js');
const ripemd160Lib = require('./ripemd160.js');

module.exports = {

  OUTPUT_TYPES: {
    NONE: BigInt(0),
    WPKH: BigInt(1),
    WSH: BigInt(2),
    OP_RETURN: BigInt(3),
    PKH: BigInt(4),
    SH: BigInt(5),
    NONSTANDARD: BigInt(6)
  },

  INPUT_TYPES: {
    NONE: BigInt(0),
    LEGACY: BigInt(1),
    COMPATIBILITY: BigInt(2),
    WITNESS: BigInt(3)
  },

  serializeHex: (uint8arr) => {
    if (!uint8arr) {
      return '';
    }

    let hexStr = '';
    for (let i = 0; i < uint8arr.length; i += 1) {
      let hex = (uint8arr[i] & 0xff).toString(16);
      hex = (hex.length === 1) ? `0${hex}` : hex;
      hexStr += hex;
    }

    return `0x${hexStr.toLowerCase()}`;
  },

  deserializeHex: (hexStr) => {
    if (!hexStr) {
      return new Uint8Array();
    }

    let hex = '';
    if (hexStr.slice(0, 2) === '0x') {
      hex = hexStr.slice(2);
    } else {
      hex = hexStr;
    }

    const a = [];
    for (let i = 0; i < hex.length; i += 2) {
      a.push(parseInt(hex.substr(i, 2), 16));
    }

    return new Uint8Array(a);
  },

  sha256: buf => module.exports.deserializeHex(shaLib(buf)),

  ripemd160: buf => ripemd160Lib.default(buf),

  typedArraysAreEqual: (a, b) => {
    if (a.byteLength !== b.byteLength) return false;
    return a.every((val, i) => val === b[i]);
  },

  bytesToUint: (uint8Arr) => {
    let total = BigInt(0);
    for (let i = 0; i < uint8Arr.length; i += 1) {
      total += BigInt(uint8Arr[i]) << (BigInt(uint8Arr.length - i - 1) * BigInt(8));
    }
    return total;
  },

  safeSlice: (buf, first, last) => {
    let start;
    let end;

    if (first === null || undefined) { start = 0; }
    if (last === null || undefined) { end = buf.length - 1; }

    /* eslint-disable-next-line valid-typeof */
    if (typeof first === 'bigint') {
      start = Number(first);
    } else {
      start = first;
    }

    /* eslint-disable-next-line valid-typeof */
    if (typeof last === 'bigint') {
      end = Number(last);
    } else {
      end = last;
    }

    if (end > buf.length) { throw new Error('Tried to slice past end of array'); }
    if (start < 0 || end < 0) { throw new Error('Slice must not use negative indexes'); }
    if (start >= end) { throw new Error('Slice must not have 0 length'); }
    return buf.slice(start, end);
  },

  /**
   * @notice               JS version of abi.encodePacked when trying to concatenate 2 values
   * @dev                  Use when you see abi.encodePacked
   * @param {array}        a An array of Uint8Arrays
   * @return {Uint8Array}  A Uint8Array that is a concatenation of all the arrays
  */

  concatUint8Arrays: (arrays) => {
    let length = 0;
    arrays.forEach((arr) => {
      if (arr instanceof Uint8Array) {
        length += arr.length;
      } else {
        throw new Error('Arrays must be of type Uint8Array');
      }
    });

    const concatArray = new Uint8Array(length);
    let offset = 0;

    arrays.forEach((arr) => {
      concatArray.set(arr, offset);
      offset += arr.length;
    });

    return concatArray;
  }
};
