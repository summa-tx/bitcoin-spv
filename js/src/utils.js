/* global BigInt */
import shaLib from './lib/sha256';
import rmdlib from './lib/ripemd160';

/**
 * Enum for transaction output types
 * @enum {BigInt}
 */
export const OUTPUT_TYPES = {
  NONE: BigInt(0),
  WPKH: BigInt(1),
  WSH: BigInt(2),
  OP_RETURN: BigInt(3),
  PKH: BigInt(4),
  SH: BigInt(5),
  NONSTANDARD: BigInt(6)
};

/**
 * Enum for transaction input types
 * @enum {BigInt}
 */
export const INPUT_TYPES = {
  NONE: BigInt(0),
  LEGACY: BigInt(1),
  COMPATIBILITY: BigInt(2),
  WITNESS: BigInt(3)
};

/**
 *
 * Serializes a Uint8Array into a hex string
 *
 * @param {Uint8Array}    uint8arr The value as a u8a
 * @returns {string}      The value as a hex string
 */
export function serializeHex(uint8arr) {
  if (!uint8arr || uint8arr.length === 0) {
    return '';
  }

  if (!(uint8arr instanceof Uint8Array)) {
    throw new Error('Cannot serialize hex, must be a Uint8Array');
  }

  let hexStr = '';
  for (let i = 0; i < uint8arr.length; i += 1) {
    let hex = (uint8arr[i] & 0xff).toString(16);
    hex = (hex.length === 1) ? `0${hex}` : hex;
    hexStr += hex;
  }

  return `0x${hexStr.toLowerCase()}`;
}

/**
 *
 * Deserializes a hex string into a Uint8Array
 *
 * @param {Uint8Array}    hexStr The value as a hex string
 * @returns {string}      The value as a u8a
 */
export function deserializeHex(hexStr) {
  if (!hexStr) {
    return new Uint8Array();
  }

  if (typeof hexStr !== 'string') {
    throw new TypeError('Error deserializing hex, must be a string');
  }

  let hex = '';
  if (hexStr.slice(0, 2) === '0x') {
    hex = hexStr.slice(2);
  } else {
    hex = hexStr;
  }

  if (hex.length % 2 !== 0) {
    throw new TypeError('Error deserializing hex, string length is odd');
  }

  const a = [];
  for (let i = 0; i < hex.length; i += 2) {
    const byte = hex.substr(i, 2);
    const uint8 = parseInt(byte, 16);

    // TODO: any way to improve this?
    if (!uint8 && uint8 !== 0) {
      throw new TypeError(`Error deserializing hex, got non-hex byte: ${byte}`);
    }

    a.push(uint8);
  }

  return new Uint8Array(a);
}

/**
 *
 * Executes the sha256 hash
 *
 * @param {Uint8Array}    buf The pre-image
 * @returns {Uint8Array}  The digest
 */
export function sha256(buf) {
  return shaLib(buf);
}

/**
 *
 * Executes the ripemd160 hash
 *
 * @param {Uint8Array}    buf The pre-image
 * @returns {Uint8Array}  The digest
 */
export function ripemd160(buf) {
  return rmdlib(buf);
}

/**
 *
 * Compares u8a arrays
 *
 * @param {Uint8Array}    a The first array
 * @param {Uint8Array}    b The second array
 * @returns {boolean}     True if the arrays are equal, false if otherwise
 */
export function typedArraysAreEqual(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
    throw new Error('Arrays must be of type Uint8Array');
  }

  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 *
 * Converts big-endian array to a uint
 * Traverses the byte array and sums the bytes
 *
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
 * Performs a safe slice on an array
 * Errors if any invalid arguments are given
 *
 * @param {Uint8Array}    buf The u8a
 * @param {Number|BigInt} first The index where the slice should start
 * @param {Number|BigInt} last The index where the slice should end (non-inclusive)
 * @returns {Uint8Array}  The slice
 */
export function safeSlice(buf, first, last) {
  let start;
  let end;

  if (!first) { start = 0; }
  if (!last) { end = buf.length; }

  /* eslint-disable-next-line valid-typeof */
  if (typeof first === 'bigint') {
    if (first > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('BigInt argument out of safe number range');
    start = Number(first);
  } else {
    start = first;
  }

  /* eslint-disable-next-line valid-typeof */
  if (typeof last === 'bigint') {
    if (last > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('BigInt argument out of safe number range');
    end = Number(last);
  } else {
    end = last;
  }

  if (end > buf.length) { throw new Error('Tried to slice past end of array'); }
  if (start < 0 || end < 0) { throw new Error('Slice must not use negative indexes'); }
  if (start >= end) { throw new Error('Slice must not have 0 length'); }
  return buf.slice(start, end);
}

/**
 * JS version of abi.encodePacked, concatenates u8a arrays
 *
 * @dev                  Use when you see abi.encodePacked
 * @param {array}        arrays An array of Uint8Arrays
 * @return {Uint8Array}  A Uint8Array that is a concatenation of all the arrays
 */
export function concatUint8Arrays(...arrays) {
  if (arrays.length === 1) { return arrays[0]; }

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

/**
 *
 * Changes the endianness of a byte array
 * Returns a new, backwards, byte array
 *
 * @param {Uint8Array}    uint8Arr The array to reverse
 * @returns {Uint8Array}  The reversed array
 */
export function reverseEndianness(uint8Arr) {
  const newArr = safeSlice(uint8Arr);
  return new Uint8Array(newArr.reverse());
}

/**
 *
 * Get the last num bytes from a byte array
 * The byte array to slice
 *
 * @param {Uint8Array}     uint8Arr The big-endian array-encoded integer
 * @returns {Uint8Array}   The last `num` bytes of the bytearray
 */
export function lastBytes(arr, num) {
  return safeSlice(arr, arr.length - num);
}

export function updateJSON(element) {
  if (Array.isArray(element)) {
    for (let i = 0; i < element.length; i += 1) {
      // may want to refine this if statement to check if it's a hex value in the actual function
      if (typeof element[i] === 'string' && element[i].slice(0, 2) === '0x') {
        /* eslint-disable-next-line */
        element[i] = deserializeHex(element[i]);
      } else {
        updateJSON(element[i]);
      }
    }
  } else if (typeof element === 'object') {
    /* eslint-disable-next-line */
    for (const prop in element) {
      if (typeof element[prop] === 'object') {
        updateJSON(element[prop]);
      } else if (typeof element[prop] === 'string' && element[prop].slice(0, 2) === '0x') {
        /* eslint-disable-next-line */
        element[prop] = deserializeHex(element[prop]);
      }
    }
  }
}
