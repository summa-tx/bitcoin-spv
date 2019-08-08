const shaLib = require('./sha256.js')
const ripemd160Lib = require('./ripemd160.js')

module.exports = {
  serializeHex: (uint8arr) => {
    if (!uint8arr) {
      return ''
    }

    var hexStr = ''
    for (var i = 0; i < uint8arr.length; i++) {
      var hex = (uint8arr[i] & 0xff).toString(16)
      hex = (hex.length === 1) ? '0' + hex : hex
      hexStr += hex
    }

    return `0x${hexStr.toLowerCase()}`
  },

  deserializeHex: (hexStr) => {
    if (!hexStr) {
      return new Uint8Array()
    }

    var hex = ''
    if (hexStr.slice(0, 2) === '0x') {
      hex = hexStr.slice(2)
    } else {
      hex = hexStr
    }

    let a = []
    for (var i = 0; i < hex.length; i+=2) {
      a.push(parseInt(hex.substr(i,2),16))
    }

    return new Uint8Array(a)
  },

  sha256: (buf) => {
    return module.exports.deserializeHex(shaLib(buf))
  },

  ripemd160: (buf) => {
    return ripemd160Lib.default(buf)
  },

  typedArraysAreEqual: (a, b) => {
    if (a.byteLength !== b.byteLength) return false;
    return a.every((val, i) => val === b[i]);
  },

  /// @notice          Converts big-endian bytes to a uint
  /// @dev             Traverses the byte array and sums the bytes
  /// @param _b        The big-endian bytes-encoded integer
  /// @return          The integer representation
  bytesToUint: (uint8Arr) => {
    let total = BigInt(0)
    for (var i = 0; i < uint8Arr.length; i++) {
      total += BigInt(uint8Arr[i]) << (BigInt(uint8Arr.length - i - 1) * BigInt(8))
    }
    return total
  },

  safeSlice: (buf, start, end) => {
    if (end > buf.length) { throw new Error('Tried to slice past end of array') }
    if (start < 0 || end < 0) { throw new Error('Slice must not use negative indexes') }
    if (start >= end) { throw new Error('Slice must not have 0 length') }
    return buf.slice(start, end)
  },

  /**
   * @notice               JS version of abi.encodePacked when trying to concatenate 2 values
   * @dev                  Use when you see abi.encodePacked take 2 values
   * @param {Uint8Array}   a The big-endian bytes-encoded integer
   * @param {Uint8Array}   b The big-endian bytes-encoded integer
   * @return               The integer representation
  */
  concatUint8Arrays: (a, b) => {
    let c = new Uint8Array(a.length + b.length)
    c.set(a)
    c.set(b, a.length)
    return c
  }
}