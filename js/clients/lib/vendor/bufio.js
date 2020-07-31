/*!
 * bufio@1.0.6 - Buffer and serialization utilities for javascript
 * Copyright (c) 2020, Christopher Jeffrey (MIT)
 * https://github.com/bcoin-org/bufio
 *
 * License for bufio@1.0.6:
 *
 * This software is licensed under the MIT License.
 *
 * Copyright (c) 2017, Christopher Jeffrey (https://github.com/chjj)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var __node_modules__ = [
[/* 0 */ 'bufio', '/lib/bufio.js', function(exports, module, __filename, __dirname, __meta) {
/*!
 * bufio.js - buffer utilities for javascript
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const custom = __node_require__(1 /* './custom' */);
const encoding = __node_require__(2 /* './encoding' */);
const enforce = __node_require__(3 /* './enforce' */);
const EncodingError = __node_require__(4 /* './error' */);
const BufferReader = __node_require__(5 /* './reader' */);
const BufferWriter = __node_require__(6 /* './writer' */);
const StaticWriter = __node_require__(7 /* './staticwriter' */);
const Struct = __node_require__(8 /* './struct' */);

exports.custom = custom;
exports.encoding = encoding;
exports.EncodingError = EncodingError;
exports.BufferReader = BufferReader;
exports.BufferWriter = BufferWriter;
exports.StaticWriter = StaticWriter;
exports.Struct = Struct;

exports.read = function read(data, zeroCopy) {
  return new BufferReader(data, zeroCopy);
};

exports.write = function write(size) {
  return size != null
    ? new StaticWriter(size)
    : new BufferWriter();
};

exports.pool = function pool(size) {
  return StaticWriter.pool(size);
};

function _read(func, size) {
  return function(data, off) {
    enforce(Buffer.isBuffer(data), 'data', 'buffer');
    enforce((off >>> 0) === off, 'off', 'integer');

    if (off + size > data.length)
      throw new EncodingError(off, 'Out of bounds read');

    return func(data, off);
  };
}

function _readn(func) {
  return function(data, off, len) {
    enforce(Buffer.isBuffer(data), 'data', 'buffer');
    enforce((off >>> 0) === off, 'off', 'integer');
    enforce((len >>> 0) === len, 'len', 'integer');

    if (off + len > data.length)
      throw new EncodingError(off, 'Out of bounds read');

    return func(data, off, len);
  };
}

function _readvar(func) {
  return function(data, off) {
    enforce(Buffer.isBuffer(data), 'data', 'buffer');
    enforce((off >>> 0) === off, 'off', 'integer');
    return func(data, off);
  };
}

function _write(func, size) {
  return function(data, num, off) {
    enforce(Buffer.isBuffer(data), 'data', 'buffer');
    enforce((off >>> 0) === off, 'off', 'integer');

    if (off + size > data.length)
      throw new EncodingError(off, 'Out of bounds write');

    return func(data, num, off);
  };
}

function _writen(func) {
  return function(data, num, off, len) {
    enforce(Buffer.isBuffer(data), 'data', 'buffer');
    enforce((off >>> 0) === off, 'off', 'integer');
    enforce((len >>> 0) === len, 'len', 'integer');

    if (off + len > data.length)
      throw new EncodingError(off, 'Out of bounds write');

    return func(data, num, off, len);
  };
}

function _writecb(func, size) {
  return function(data, num, off) {
    enforce(Buffer.isBuffer(data), 'data', 'buffer');
    enforce((off >>> 0) === off, 'off', 'integer');

    if (off + size(num) > data.length)
      throw new EncodingError(off, 'Out of bounds write');

    return func(data, num, off);
  };
}

exports.readU = _readn(encoding.readU);
exports.readU64 = _read(encoding.readU64, 8);
exports.readU56 = _read(encoding.readU56, 7);
exports.readU48 = _read(encoding.readU48, 6);
exports.readU40 = _read(encoding.readU40, 5);
exports.readU32 = _read(encoding.readU32, 4);
exports.readU24 = _read(encoding.readU24, 3);
exports.readU16 = _read(encoding.readU16, 2);
exports.readU8 = _read(encoding.readU8, 1);

exports.readUBE = _readn(encoding.readUBE);
exports.readU64BE = _read(encoding.readU64BE, 8);
exports.readU56BE = _read(encoding.readU56BE, 7);
exports.readU48BE = _read(encoding.readU48BE, 6);
exports.readU40BE = _read(encoding.readU40BE, 5);
exports.readU32BE = _read(encoding.readU32BE, 4);
exports.readU24BE = _read(encoding.readU24BE, 3);
exports.readU16BE = _read(encoding.readU16BE, 2);

exports.readI = _readn(encoding.readI);
exports.readI64 = _read(encoding.readI64, 8);
exports.readI56 = _read(encoding.readI56, 7);
exports.readI48 = _read(encoding.readI48, 6);
exports.readI40 = _read(encoding.readI40, 5);
exports.readI32 = _read(encoding.readI32, 4);
exports.readI24 = _read(encoding.readI24, 3);
exports.readI16 = _read(encoding.readI16, 2);
exports.readI8 = _read(encoding.readI8, 1);

exports.readIBE = _readn(encoding.readIBE);
exports.readI64BE = _read(encoding.readI64BE, 8);
exports.readI56BE = _read(encoding.readI56BE, 7);
exports.readI48BE = _read(encoding.readI48BE, 6);
exports.readI40BE = _read(encoding.readI40BE, 5);
exports.readI32BE = _read(encoding.readI32BE, 4);
exports.readI24BE = _read(encoding.readI24BE, 3);
exports.readI16BE = _read(encoding.readI16BE, 2);

exports.readFloat = _read(encoding.readFloat, 4);
exports.readFloatBE = _read(encoding.readFloatBE, 4);
exports.readDouble = _read(encoding.readDouble, 8);
exports.readDoubleBE = _read(encoding.readDoubleBE, 8);

exports.writeU = _writen(encoding.writeU);
exports.writeU64 = _write(encoding.writeU64, 8);
exports.writeU56 = _write(encoding.writeU56, 7);
exports.writeU48 = _write(encoding.writeU48, 6);
exports.writeU40 = _write(encoding.writeU40, 5);
exports.writeU32 = _write(encoding.writeU32, 4);
exports.writeU24 = _write(encoding.writeU24, 3);
exports.writeU16 = _write(encoding.writeU16, 2);
exports.writeU8 = _write(encoding.writeU8, 1);

exports.writeUBE = _writen(encoding.writeUBE);
exports.writeU64BE = _write(encoding.writeU64BE, 8);
exports.writeU56BE = _write(encoding.writeU56BE, 7);
exports.writeU48BE = _write(encoding.writeU48BE, 6);
exports.writeU40BE = _write(encoding.writeU40BE, 5);
exports.writeU32BE = _write(encoding.writeU32BE, 4);
exports.writeU24BE = _write(encoding.writeU24BE, 3);
exports.writeU16BE = _write(encoding.writeU16BE, 2);

exports.writeI = _writen(encoding.writeI);
exports.writeI64 = _write(encoding.writeI64, 8);
exports.writeI56 = _write(encoding.writeI56, 7);
exports.writeI48 = _write(encoding.writeI48, 6);
exports.writeI40 = _write(encoding.writeI40, 5);
exports.writeI32 = _write(encoding.writeI32, 4);
exports.writeI24 = _write(encoding.writeI24, 3);
exports.writeI16 = _write(encoding.writeI16, 2);
exports.writeI8 = _write(encoding.writeI8, 1);

exports.writeIBE = _writen(encoding.writeIBE);
exports.writeI64BE = _write(encoding.writeI64BE, 8);
exports.writeI56BE = _write(encoding.writeI56BE, 7);
exports.writeI48BE = _write(encoding.writeI48BE, 6);
exports.writeI40BE = _write(encoding.writeI40BE, 5);
exports.writeI32BE = _write(encoding.writeI32BE, 4);
exports.writeI24BE = _write(encoding.writeI24BE, 3);
exports.writeI16BE = _write(encoding.writeI16BE, 2);

exports.writeFloat = _write(encoding.writeFloat, 4);
exports.writeFloatBE = _write(encoding.writeFloatBE, 4);
exports.writeDouble = _write(encoding.writeDouble, 8);
exports.writeDoubleBE = _write(encoding.writeDoubleBE, 8);

exports.readVarint = _readvar(encoding.readVarint);
exports.writeVarint = _writecb(encoding.writeVarint, encoding.sizeVarint);
exports.sizeVarint = encoding.sizeVarint;
exports.readVarint2 = _readvar(encoding.readVarint2);
exports.writeVarint2 = _writecb(encoding.writeVarint2, encoding.sizeVarint2);
exports.sizeVarint2 = encoding.sizeVarint2;

exports.sliceBytes = encoding.sliceBytes;
exports.readBytes = encoding.readBytes;
exports.writeBytes = encoding.writeBytes;
exports.readString = encoding.readString;
exports.writeString = encoding.writeString;

exports.realloc = encoding.realloc;
exports.copy = encoding.copy;
exports.concat = encoding.concat;

exports.sizeVarBytes = encoding.sizeVarBytes;
exports.sizeVarlen = encoding.sizeVarlen;
exports.sizeVarString = encoding.sizeVarString;
}],
[/* 1 */ 'bufio', '/lib/custom.js', function(exports, module, __filename, __dirname, __meta) {
'use strict';

const {inspect} = require('util');

exports.custom = inspect.custom || 'inspect';
}],
[/* 2 */ 'bufio', '/lib/encoding.js', function(exports, module, __filename, __dirname, __meta) {
/*!
 * encoding.js - encoding utils for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

/* eslint no-implicit-coercion: "off" */

'use strict';

const enforce = __node_require__(3 /* './enforce' */);
const EncodingError = __node_require__(4 /* './error' */);

/*
 * Constants
 */

const HI = 1 / 0x100000000;
const {MAX_SAFE_INTEGER} = Number;
const F32_ARRAY = new Float32Array(1);
const F328_ARRAY = new Uint8Array(F32_ARRAY.buffer);
const F64_ARRAY = new Float64Array(1);
const F648_ARRAY = new Uint8Array(F64_ARRAY.buffer);

F32_ARRAY[0] = -1;

const BIG_ENDIAN = F328_ARRAY[3] === 0;

/*
 * Read Unsigned LE
 */

function readU(data, off, len) {
  switch (len) {
    case 8:
      return readU64(data, off);
    case 7:
      return readU56(data, off);
    case 6:
      return readU48(data, off);
    case 5:
      return readU40(data, off);
    case 4:
      return readU32(data, off);
    case 3:
      return readU24(data, off);
    case 2:
      return readU16(data, off);
    case 1:
      return readU8(data, off);
    default:
      throw new EncodingError(off, 'Invalid read length');
  }
}

function readU64(data, off) {
  const hi = readU32(data, off + 4);
  const lo = readU32(data, off);
  check((hi & 0xffe00000) === 0, off, 'Number exceeds 2^53-1');
  return hi * 0x100000000 + lo;
}

function readU56(data, off) {
  const hi = readU24(data, off + 4);
  const lo = readU32(data, off);
  check((hi & 0xffe00000) === 0, off, 'Number exceeds 2^53-1');
  return hi * 0x100000000 + lo;
}

function readU48(data, off) {
  return (data[off++]
    + data[off++] * 0x100
    + data[off++] * 0x10000
    + data[off++] * 0x1000000
    + data[off++] * 0x100000000
    + data[off] * 0x10000000000);
}

function readU40(data, off) {
  return (data[off++]
    + data[off++] * 0x100
    + data[off++] * 0x10000
    + data[off++] * 0x1000000
    + data[off] * 0x100000000);
}

function readU32(data, off) {
  return (data[off++]
    + data[off++] * 0x100
    + data[off++] * 0x10000
    + data[off] * 0x1000000);
}

function readU24(data, off) {
  return (data[off++]
    + data[off++] * 0x100
    + data[off] * 0x10000);
}

function readU16(data, off) {
  return data[off++] + data[off] * 0x100;
}

function readU8(data, off) {
  return data[off];
}

/*
 * Read Unsigned BE
 */

function readUBE(data, off, len) {
  switch (len) {
    case 8:
      return readU64BE(data, off);
    case 7:
      return readU56BE(data, off);
    case 6:
      return readU48BE(data, off);
    case 5:
      return readU40BE(data, off);
    case 4:
      return readU32BE(data, off);
    case 3:
      return readU24BE(data, off);
    case 2:
      return readU16BE(data, off);
    case 1:
      return readU8(data, off);
    default:
      throw new EncodingError(off, 'Invalid read length');
  }
}

function readU64BE(data, off) {
  const hi = readU32BE(data, off);
  const lo = readU32BE(data, off + 4);
  check((hi & 0xffe00000) === 0, off, 'Number exceeds 2^53-1');
  return hi * 0x100000000 + lo;
}

function readU56BE(data, off) {
  const hi = readU24BE(data, off);
  const lo = readU32BE(data, off + 3);
  check((hi & 0xffe00000) === 0, off, 'Number exceeds 2^53-1');
  return hi * 0x100000000 + lo;
}

function readU48BE(data, off) {
  return (data[off++] * 0x10000000000
    + data[off++] * 0x100000000
    + data[off++] * 0x1000000
    + data[off++] * 0x10000
    + data[off++] * 0x100
    + data[off]);
}

function readU40BE(data, off) {
  return (data[off++] * 0x100000000
    + data[off++] * 0x1000000
    + data[off++] * 0x10000
    + data[off++] * 0x100
    + data[off]);
}

function readU32BE(data, off) {
  return (data[off++] * 0x1000000
    + data[off++] * 0x10000
    + data[off++] * 0x100
    + data[off]);
}

function readU24BE(data, off) {
  return (data[off++] * 0x10000
    + data[off++] * 0x100
    + data[off]);
}

function readU16BE(data, off) {
  return data[off++] * 0x100 + data[off];
}

/*
 * Read Signed LE
 */

function readI(data, off, len) {
  switch (len) {
    case 8:
      return readI64(data, off);
    case 7:
      return readI56(data, off);
    case 6:
      return readI48(data, off);
    case 5:
      return readI40(data, off);
    case 4:
      return readI32(data, off);
    case 3:
      return readI24(data, off);
    case 2:
      return readI16(data, off);
    case 1:
      return readI8(data, off);
    default:
      throw new EncodingError(off, 'Invalid read length');
  }
}

function readI64(data, off) {
  const hi = readI32(data, off + 4);
  const lo = readU32(data, off);
  check(isSafe(hi, lo), 'Number exceeds 2^53-1');
  return hi * 0x100000000 + lo;
}

function readI56(data, off) {
  const hi = readI24(data, off + 4);
  const lo = readU32(data, off);
  check(isSafe(hi, lo), 'Number exceeds 2^53-1');
  return hi * 0x100000000 + lo;
}

function readI48(data, off) {
  const val = data[off + 4] + data[off + 5] * 0x100;

  return (data[off++]
    + data[off++] * 0x100
    + data[off++] * 0x10000
    + data[off] * 0x1000000
    + (val | (val & 0x8000) * 0x1fffe) * 0x100000000);
}

function readI40(data, off) {
  return (data[off++]
    + data[off++] * 0x100
    + data[off++] * 0x10000
    + data[off++] * 0x1000000
    + (data[off] | (data[off] & 0x80) * 0x1fffffe) * 0x100000000);
}

function readI32(data, off) {
  return (data[off++]
    + data[off++] * 0x100
    + data[off++] * 0x10000
    + (data[off] << 24));
}

function readI24(data, off) {
  const val = (data[off++]
    + data[off++] * 0x100
    + data[off] * 0x10000);
  return val | (val & 0x800000) * 0x1fe;
}

function readI16(data, off) {
  const val = data[off++] + data[off] * 0x100;
  return val | (val & 0x8000) * 0x1fffe;
}

function readI8(data, off) {
  const val = data[off];
  return val | (val & 0x80) * 0x1fffffe;
}

/*
 * Read Signed BE
 */

function readIBE(data, off, len) {
  switch (len) {
    case 8:
      return readI64BE(data, off);
    case 7:
      return readI56BE(data, off);
    case 6:
      return readI48BE(data, off);
    case 5:
      return readI40BE(data, off);
    case 4:
      return readI32BE(data, off);
    case 3:
      return readI24BE(data, off);
    case 2:
      return readI16BE(data, off);
    case 1:
      return readI8(data, off);
    default:
      throw new EncodingError(off, 'Invalid read length');
  }
}

function readI64BE(data, off) {
  const hi = readI32BE(data, off);
  const lo = readU32BE(data, off + 4);
  check(isSafe(hi, lo), 'Number exceeds 2^53-1');
  return hi * 0x100000000 + lo;
}

function readI56BE(data, off) {
  const hi = readI24BE(data, off);
  const lo = readU32BE(data, off + 3);
  check(isSafe(hi, lo), 'Number exceeds 2^53-1');
  return hi * 0x100000000 + lo;
}

function readI48BE(data, off) {
  const val = data[off++] * 0x100 + data[off++];

  return ((val | (val & 0x8000) * 0x1fffe) * 0x100000000
    + data[off++] * 0x1000000
    + data[off++] * 0x10000
    + data[off++] * 0x100
    + data[off]);
}

function readI40BE(data, off) {
  const val = data[off++];

  return ((val | (val & 0x80) * 0x1fffffe) * 0x100000000
    + data[off++] * 0x1000000
    + data[off++] * 0x10000
    + data[off++] * 0x100
    + data[off]);
}

function readI32BE(data, off) {
  return ((data[off++] << 24)
    + data[off++] * 0x10000
    + data[off++] * 0x100
    + data[off]);
}

function readI24BE(data, off) {
  const val = (data[off++] * 0x10000
    + data[off++] * 0x100
    + data[off]);

  return val | (val & 0x800000) * 0x1fe;
}

function readI16BE(data, off) {
  const val = data[off++] * 0x100 + data[off];
  return val | (val & 0x8000) * 0x1fffe;
}

/*
 * Read Float
 */

function _readFloatBackwards(data, off) {
  F328_ARRAY[3] = data[off++];
  F328_ARRAY[2] = data[off++];
  F328_ARRAY[1] = data[off++];
  F328_ARRAY[0] = data[off];
  return F32_ARRAY[0];
}

function _readFloatForwards(data, off) {
  F328_ARRAY[0] = data[off++];
  F328_ARRAY[1] = data[off++];
  F328_ARRAY[2] = data[off++];
  F328_ARRAY[3] = data[off];
  return F32_ARRAY[0];
}

function _readDoubleBackwards(data, off) {
  F648_ARRAY[7] = data[off++];
  F648_ARRAY[6] = data[off++];
  F648_ARRAY[5] = data[off++];
  F648_ARRAY[4] = data[off++];
  F648_ARRAY[3] = data[off++];
  F648_ARRAY[2] = data[off++];
  F648_ARRAY[1] = data[off++];
  F648_ARRAY[0] = data[off];
  return F64_ARRAY[0];
}

function _readDoubleForwards(data, off) {
  F648_ARRAY[0] = data[off++];
  F648_ARRAY[1] = data[off++];
  F648_ARRAY[2] = data[off++];
  F648_ARRAY[3] = data[off++];
  F648_ARRAY[4] = data[off++];
  F648_ARRAY[5] = data[off++];
  F648_ARRAY[6] = data[off++];
  F648_ARRAY[7] = data[off];
  return F64_ARRAY[0];
}

const readFloat = BIG_ENDIAN ? _readFloatBackwards : _readFloatForwards;
const readFloatBE = BIG_ENDIAN ? _readFloatForwards : _readFloatBackwards;
const readDouble = BIG_ENDIAN ? _readDoubleBackwards : _readDoubleForwards;
const readDoubleBE = BIG_ENDIAN ? _readDoubleForwards : _readDoubleBackwards;

/*
 * Write Unsigned LE
 */

function writeU(dst, num, off, len) {
  switch (len) {
    case 8:
      return writeU64(dst, num, off);
    case 7:
      return writeU56(dst, num, off);
    case 6:
      return writeU48(dst, num, off);
    case 5:
      return writeU40(dst, num, off);
    case 4:
      return writeU32(dst, num, off);
    case 3:
      return writeU24(dst, num, off);
    case 2:
      return writeU16(dst, num, off);
    case 1:
      return writeU8(dst, num, off);
    default:
      throw new EncodingError(off, 'Invalid write length');
  }
}

function writeU64(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');
  return write64(dst, num, off, false);
}

function writeU56(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');
  return write56(dst, num, off, false);
}

function writeU48(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');

  const hi = (num * HI) | 0;

  dst[off++] = num;
  num >>>= 8;
  dst[off++] = num;
  num >>>= 8;
  dst[off++] = num;
  num >>>= 8;
  dst[off++] = num;
  dst[off++] = hi;
  dst[off++] = hi >>> 8;

  return off;
}

function writeU40(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');

  const hi = (num * HI) | 0;

  dst[off++] = num;
  num >>>= 8;
  dst[off++] = num;
  num >>>= 8;
  dst[off++] = num;
  num >>>= 8;
  dst[off++] = num;
  dst[off++] = hi;

  return off;
}

function writeU32(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');

  dst[off++] = num;
  num >>>= 8;
  dst[off++] = num;
  num >>>= 8;
  dst[off++] = num;
  num >>>= 8;
  dst[off++] = num;
  return off;
}

function writeU24(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');

  dst[off++] = num;
  num >>>= 8;
  dst[off++] = num;
  num >>>= 8;
  dst[off++] = num;
  return off;
}

function writeU16(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');
  dst[off++] = num;
  dst[off++] = num >>> 8;
  return off;
}

function writeU8(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');
  dst[off] = num;
  return off + 1;
}

/*
 * Write Unsigned BE
 */

function writeUBE(dst, num, off, len) {
  switch (len) {
    case 8:
      return writeU64BE(dst, num, off);
    case 7:
      return writeU56BE(dst, num, off);
    case 6:
      return writeU48BE(dst, num, off);
    case 5:
      return writeU40BE(dst, num, off);
    case 4:
      return writeU32BE(dst, num, off);
    case 3:
      return writeU24BE(dst, num, off);
    case 2:
      return writeU16BE(dst, num, off);
    case 1:
      return writeU8(dst, num, off);
    default:
      throw new EncodingError(off, 'Invalid write length');
  }
}

function writeU64BE(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');
  return write64(dst, num, off, true);
}

function writeU56BE(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');
  return write56(dst, num, off, true);
}

function writeU48BE(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');

  const hi = (num * HI) | 0;

  dst[off++] = hi >>> 8;
  dst[off++] = hi;
  dst[off + 3] = num;
  num >>>= 8;
  dst[off + 2] = num;
  num >>>= 8;
  dst[off + 1] = num;
  num >>>= 8;
  dst[off] = num;

  return off + 4;
}

function writeU40BE(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');

  const hi = (num * HI) | 0;

  dst[off++] = hi;
  dst[off + 3] = num;
  num >>>= 8;
  dst[off + 2] = num;
  num >>>= 8;
  dst[off + 1] = num;
  num >>>= 8;
  dst[off] = num;

  return off + 4;
}

function writeU32BE(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');
  dst[off + 3] = num;
  num >>>= 8;
  dst[off + 2] = num;
  num >>>= 8;
  dst[off + 1] = num;
  num >>>= 8;
  dst[off] = num;
  return off + 4;
}

function writeU24BE(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');
  dst[off + 2] = num;
  num >>>= 8;
  dst[off + 1] = num;
  num >>>= 8;
  dst[off] = num;
  return off + 3;
}

function writeU16BE(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');
  dst[off++] = num >>> 8;
  dst[off++] = num;
  return off;
}

/*
 * Write Signed LE
 */

function writeI(dst, num, off, len) {
  switch (len) {
    case 8:
      return writeU64(dst, num, off);
    case 7:
      return writeU56(dst, num, off);
    case 6:
      return writeU48(dst, num, off);
    case 5:
      return writeU40(dst, num, off);
    case 4:
      return writeU24(dst, num, off);
    case 3:
      return writeU32(dst, num, off);
    case 2:
      return writeU16(dst, num, off);
    case 1:
      return writeU8(dst, num, off);
    default:
      throw new EncodingError(off, 'Invalid write length');
  }
}

function writeI64(dst, num, off) {
  return writeU64(dst, num, off);
}

function writeI56(dst, num, off) {
  return writeU56(dst, num, off);
}

function writeI48(dst, num, off) {
  return writeU48(dst, num, off);
}

function writeI40(dst, num, off) {
  return writeU40(dst, num, off);
}

function writeI32(dst, num, off) {
  return writeU32(dst, num, off);
}

function writeI24(dst, num, off) {
  return writeU24(dst, num, off);
}

function writeI16(dst, num, off) {
  return writeU16(dst, num, off);
}

function writeI8(dst, num, off) {
  return writeU8(dst, num, off);
}

/*
 * Write Signed BE
 */

function writeIBE(dst, num, off, len) {
  switch (len) {
    case 8:
      return writeU64BE(dst, num, off);
    case 7:
      return writeU56BE(dst, num, off);
    case 6:
      return writeU48BE(dst, num, off);
    case 5:
      return writeU40BE(dst, num, off);
    case 4:
      return writeU32BE(dst, num, off);
    case 3:
      return writeU24BE(dst, num, off);
    case 2:
      return writeU16BE(dst, num, off);
    case 1:
      return writeU8(dst, num, off);
    default:
      throw new EncodingError(off, 'Invalid write length');
  }
}

function writeI64BE(dst, num, off) {
  return writeU64BE(dst, num, off);
}

function writeI56BE(dst, num, off) {
  return writeU56BE(dst, num, off);
}

function writeI48BE(dst, num, off) {
  return writeU48BE(dst, num, off);
}

function writeI40BE(dst, num, off) {
  return writeU40BE(dst, num, off);
}

function writeI32BE(dst, num, off) {
  return writeU32BE(dst, num, off);
}

function writeI24BE(dst, num, off) {
  return writeU24BE(dst, num, off);
}

function writeI16BE(dst, num, off) {
  return writeU16BE(dst, num, off);
}

function _writeDoubleForwards(dst, num, off) {
  enforce(isNumber(num), 'num', 'number');
  F64_ARRAY[0] = num;
  dst[off++] = F648_ARRAY[0];
  dst[off++] = F648_ARRAY[1];
  dst[off++] = F648_ARRAY[2];
  dst[off++] = F648_ARRAY[3];
  dst[off++] = F648_ARRAY[4];
  dst[off++] = F648_ARRAY[5];
  dst[off++] = F648_ARRAY[6];
  dst[off++] = F648_ARRAY[7];
  return off;
}

function _writeDoubleBackwards(dst, num, off) {
  enforce(isNumber(num), 'num', 'number');
  F64_ARRAY[0] = num;
  dst[off++] = F648_ARRAY[7];
  dst[off++] = F648_ARRAY[6];
  dst[off++] = F648_ARRAY[5];
  dst[off++] = F648_ARRAY[4];
  dst[off++] = F648_ARRAY[3];
  dst[off++] = F648_ARRAY[2];
  dst[off++] = F648_ARRAY[1];
  dst[off++] = F648_ARRAY[0];
  return off;
}

function _writeFloatForwards(dst, num, off) {
  enforce(isNumber(num), 'num', 'number');
  F32_ARRAY[0] = num;
  dst[off++] = F328_ARRAY[0];
  dst[off++] = F328_ARRAY[1];
  dst[off++] = F328_ARRAY[2];
  dst[off++] = F328_ARRAY[3];
  return off;
}

function _writeFloatBackwards(dst, num, off) {
  enforce(isNumber(num), 'num', 'number');
  F32_ARRAY[0] = num;
  dst[off++] = F328_ARRAY[3];
  dst[off++] = F328_ARRAY[2];
  dst[off++] = F328_ARRAY[1];
  dst[off++] = F328_ARRAY[0];
  return off;
}

const writeFloat = BIG_ENDIAN ? _writeFloatBackwards : _writeFloatForwards;
const writeFloatBE = BIG_ENDIAN ? _writeFloatForwards : _writeFloatBackwards;
const writeDouble = BIG_ENDIAN ? _writeDoubleBackwards : _writeDoubleForwards;
const writeDoubleBE = BIG_ENDIAN ? _writeDoubleForwards : _writeDoubleBackwards;

/*
 * Varints
 */

function readVarint(data, off) {
  let value, size;

  checkRead(off < data.length, off);

  switch (data[off]) {
    case 0xff:
      size = 9;
      checkRead(off + size <= data.length, off);
      value = readU64(data, off + 1);
      check(value > 0xffffffff, off, 'Non-canonical varint');
      break;
    case 0xfe:
      size = 5;
      checkRead(off + size <= data.length, off);
      value = readU32(data, off + 1);
      check(value > 0xffff, off, 'Non-canonical varint');
      break;
    case 0xfd:
      size = 3;
      checkRead(off + size <= data.length, off);
      value = readU16(data, off + 1);
      check(value >= 0xfd, off, 'Non-canonical varint');
      break;
    default:
      size = 1;
      value = data[off];
      break;
  }

  return new Varint(size, value);
}

function writeVarint(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');

  if (num < 0xfd) {
    dst[off++] = num;
    return off;
  }

  if (num <= 0xffff) {
    dst[off++] = 0xfd;
    return writeU16(dst, num, off);
  }

  if (num <= 0xffffffff) {
    dst[off++] = 0xfe;
    return writeU32(dst, num, off);
  }

  dst[off++] = 0xff;
  return writeU64(dst, num, off);
}

function sizeVarint(num) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');

  if (num < 0xfd)
    return 1;

  if (num <= 0xffff)
    return 3;

  if (num <= 0xffffffff)
    return 5;

  return 9;
}

function readVarint2(data, off) {
  let num = 0;
  let size = 0;

  for (;;) {
    checkRead(off < data.length, off);

    const ch = data[off++];
    size += 1;

    // Number.MAX_SAFE_INTEGER >>> 7
    check(num <= 0x3fffffffffff - (ch & 0x7f), off, 'Number exceeds 2^53-1');

    // num = (num << 7) | (ch & 0x7f);
    num = (num * 0x80) + (ch & 0x7f);

    if ((ch & 0x80) === 0)
      break;

    check(num !== MAX_SAFE_INTEGER, off, 'Number exceeds 2^53-1');
    num += 1;
  }

  return new Varint(size, num);
}

function writeVarint2(dst, num, off) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');

  const tmp = [];

  let len = 0;

  for (;;) {
    tmp[len] = (num & 0x7f) | (len ? 0x80 : 0x00);
    if (num <= 0x7f)
      break;
    // num = (num >>> 7) - 1;
    num = ((num - (num % 0x80)) / 0x80) - 1;
    len += 1;
  }

  checkRead(off + len + 1 <= dst.length, off);

  do {
    dst[off++] = tmp[len];
  } while (len--);

  return off;
}

function sizeVarint2(num) {
  enforce(Number.isSafeInteger(num), 'num', 'integer');

  let size = 0;

  for (;;) {
    size += 1;
    if (num <= 0x7f)
      break;
    // num = (num >>> 7) - 1;
    num = ((num - (num % 0x80)) / 0x80) - 1;
  }

  return size;
}

/*
 * Bytes
 */

function sliceBytes(data, off, size) {
  enforce(Buffer.isBuffer(data), 'data', 'buffer');
  enforce((off >>> 0) === off, 'off', 'integer');
  enforce((size >>> 0) === size, 'size', 'integer');

  if (off + size > data.length)
    throw new EncodingError(off, 'Out of bounds read');

  return data.slice(off, off + size);
}

function readBytes(data, off, size) {
  enforce(Buffer.isBuffer(data), 'data', 'buffer');
  enforce((off >>> 0) === off, 'off', 'integer');
  enforce((size >>> 0) === size, 'size', 'integer');

  if (off + size > data.length)
    throw new EncodingError(off, 'Out of bounds read');

  const buf = Buffer.allocUnsafe(size);
  data.copy(buf, 0, off, off + size);
  return buf;
}

function writeBytes(data, value, off) {
  enforce(Buffer.isBuffer(data), 'data', 'buffer');
  enforce(Buffer.isBuffer(value), 'value', 'buffer');
  enforce((off >>> 0) === off, 'off', 'integer');

  if (off + value.length > data.length)
    throw new EncodingError(off, 'Out of bounds write');

  return value.copy(data, off, 0, value.length);
}

function readString(data, off, size, enc) {
  if (enc == null)
    enc = 'binary';

  enforce(Buffer.isBuffer(data), 'data', 'buffer');
  enforce((off >>> 0) === off, 'off', 'integer');
  enforce((size >>> 0) === size, 'size', 'integer');
  enforce(typeof enc === 'string', 'enc', 'string');

  if (off + size > data.length)
    throw new EncodingError(off, 'Out of bounds read');

  return data.toString(enc, off, off + size);
}

function writeString(data, str, off, enc) {
  if (enc == null)
    enc = 'binary';

  enforce(Buffer.isBuffer(data), 'data', 'buffer');
  enforce(typeof str === 'string', 'str', 'string');
  enforce((off >>> 0) === off, 'off', 'integer');
  enforce(typeof enc === 'string', 'enc', 'string');

  if (str.length === 0)
    return 0;

  const size = Buffer.byteLength(str, enc);

  if (off + size > data.length)
    throw new EncodingError(off, 'Out of bounds write');

  return data.write(str, off, enc);
}

function realloc(data, size) {
  enforce(Buffer.isBuffer(data), 'data', 'buffer');

  const buf = Buffer.allocUnsafe(size);
  data.copy(buf, 0);
  return buf;
}

function copy(data) {
  enforce(Buffer.isBuffer(data), 'data', 'buffer');
  return realloc(data, data.length);
}

function concat(a, b) {
  enforce(Buffer.isBuffer(a), 'a', 'buffer');
  enforce(Buffer.isBuffer(b), 'b', 'buffer');

  const size = a.length + b.length;
  const buf = Buffer.allocUnsafe(size);

  a.copy(buf, 0);
  b.copy(buf, a.length);

  return buf;
}

/*
 * Size Helpers
 */

function sizeVarBytes(data) {
  enforce(Buffer.isBuffer(data), 'data', 'buffer');
  return sizeVarint(data.length) + data.length;
}

function sizeVarlen(len) {
  return sizeVarint(len) + len;
}

function sizeVarString(str, enc) {
  if (enc == null)
    enc = 'binary';

  enforce(typeof str === 'string', 'str', 'string');
  enforce(typeof enc === 'string', 'enc', 'string');

  if (str.length === 0)
    return 1;

  const len = Buffer.byteLength(str, enc);

  return sizeVarint(len) + len;
}

/*
 * Helpers
 */

function isSafe(hi, lo) {
  if (hi < 0) {
    hi = ~hi;
    if (lo === 0)
      hi += 1;
  }

  return (hi & 0xffe00000) === 0;
}

function write64(dst, num, off, be) {
  let neg = false;

  if (num < 0) {
    num = -num;
    neg = true;
  }

  let hi = (num * HI) | 0;
  let lo = num | 0;

  if (neg) {
    if (lo === 0) {
      hi = (~hi + 1) | 0;
    } else {
      hi = ~hi;
      lo = ~lo + 1;
    }
  }

  if (be) {
    off = writeI32BE(dst, hi, off);
    off = writeI32BE(dst, lo, off);
  } else {
    off = writeI32(dst, lo, off);
    off = writeI32(dst, hi, off);
  }

  return off;
}

function write56(dst, num, off, be) {
  let neg = false;

  if (num < 0) {
    num = -num;
    neg = true;
  }

  let hi = (num * HI) | 0;
  let lo = num | 0;

  if (neg) {
    if (lo === 0) {
      hi = (~hi + 1) | 0;
    } else {
      hi = ~hi;
      lo = ~lo + 1;
    }
  }

  if (be) {
    off = writeI24BE(dst, hi, off);
    off = writeI32BE(dst, lo, off);
  } else {
    off = writeI32(dst, lo, off);
    off = writeI24(dst, hi, off);
  }

  return off;
}

class Varint {
  constructor(size, value) {
    this.size = size;
    this.value = value;
  }
}

function isNumber(num) {
  return typeof num === 'number' && isFinite(num);
}

function checkRead(value, offset) {
  if (!value)
    throw new EncodingError(offset, 'Out of bounds read', checkRead);
}

function check(value, offset, reason) {
  if (!value)
    throw new EncodingError(offset, reason, check);
}

/*
 * Expose
 */

exports.readU = readU;
exports.readU64 = readU64;
exports.readU56 = readU56;
exports.readU48 = readU48;
exports.readU40 = readU40;
exports.readU32 = readU32;
exports.readU24 = readU24;
exports.readU16 = readU16;
exports.readU8 = readU8;

exports.readUBE = readUBE;
exports.readU64BE = readU64BE;
exports.readU56BE = readU56BE;
exports.readU48BE = readU48BE;
exports.readU40BE = readU40BE;
exports.readU32BE = readU32BE;
exports.readU24BE = readU24BE;
exports.readU16BE = readU16BE;

exports.readI = readI;
exports.readI64 = readI64;
exports.readI56 = readI56;
exports.readI48 = readI48;
exports.readI40 = readI40;
exports.readI32 = readI32;
exports.readI24 = readI24;
exports.readI16 = readI16;
exports.readI8 = readI8;

exports.readIBE = readIBE;
exports.readI64BE = readI64BE;
exports.readI56BE = readI56BE;
exports.readI48BE = readI48BE;
exports.readI40BE = readI40BE;
exports.readI32BE = readI32BE;
exports.readI24BE = readI24BE;
exports.readI16BE = readI16BE;

exports.readFloat = readFloat;
exports.readFloatBE = readFloatBE;
exports.readDouble = readDouble;
exports.readDoubleBE = readDoubleBE;

exports.writeU = writeU;
exports.writeU64 = writeU64;
exports.writeU56 = writeU56;
exports.writeU48 = writeU48;
exports.writeU40 = writeU40;
exports.writeU32 = writeU32;
exports.writeU24 = writeU24;
exports.writeU16 = writeU16;
exports.writeU8 = writeU8;

exports.writeUBE = writeUBE;
exports.writeU64BE = writeU64BE;
exports.writeU56BE = writeU56BE;
exports.writeU48BE = writeU48BE;
exports.writeU40BE = writeU40BE;
exports.writeU32BE = writeU32BE;
exports.writeU24BE = writeU24BE;
exports.writeU16BE = writeU16BE;

exports.writeI = writeI;
exports.writeI64 = writeI64;
exports.writeI56 = writeI56;
exports.writeI48 = writeI48;
exports.writeI40 = writeI40;
exports.writeI32 = writeI32;
exports.writeI24 = writeI24;
exports.writeI16 = writeI16;
exports.writeI8 = writeI8;

exports.writeIBE = writeIBE;
exports.writeI64BE = writeI64BE;
exports.writeI56BE = writeI56BE;
exports.writeI48BE = writeI48BE;
exports.writeI40BE = writeI40BE;
exports.writeI32BE = writeI32BE;
exports.writeI24BE = writeI24BE;
exports.writeI16BE = writeI16BE;

exports.writeFloat = writeFloat;
exports.writeFloatBE = writeFloatBE;
exports.writeDouble = writeDouble;
exports.writeDoubleBE = writeDoubleBE;

exports.readVarint = readVarint;
exports.writeVarint = writeVarint;
exports.sizeVarint = sizeVarint;
exports.readVarint2 = readVarint2;
exports.writeVarint2 = writeVarint2;
exports.sizeVarint2 = sizeVarint2;

exports.sliceBytes = sliceBytes;
exports.readBytes = readBytes;
exports.writeBytes = writeBytes;
exports.readString = readString;
exports.writeString = writeString;

exports.realloc = realloc;
exports.copy = copy;
exports.concat = concat;

exports.sizeVarBytes = sizeVarBytes;
exports.sizeVarlen = sizeVarlen;
exports.sizeVarString = sizeVarString;
}],
[/* 3 */ 'bufio', '/lib/enforce.js', function(exports, module, __filename, __dirname, __meta) {
/*!
 * enforce.js - type enforcement for bcoin
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

/*
 * Enforce
 */

function enforce(value, name, type) {
  if (!value) {
    const err = new TypeError(`'${name}' must be a(n) ${type}.`);
    if (Error.captureStackTrace)
      Error.captureStackTrace(err, enforce);
    throw err;
  }
}

/*
 * Expose
 */

module.exports = enforce;
}],
[/* 4 */ 'bufio', '/lib/error.js', function(exports, module, __filename, __dirname, __meta) {
/*!
 * error.js - encoding error for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

/**
 * Encoding Error
 * @extends {Error}
 */

class EncodingError extends Error {
  /**
   * Create an encoding error.
   * @constructor
   * @param {Number} offset
   * @param {String} reason
   */

  constructor(offset, reason, start) {
    super();

    this.type = 'EncodingError';
    this.name = 'EncodingError';
    this.code = 'ERR_ENCODING';
    this.message = `${reason} (offset=${offset}).`;

    if (Error.captureStackTrace)
      Error.captureStackTrace(this, start || EncodingError);
  }
}

/*
 * Expose
 */

module.exports = EncodingError;
}],
[/* 5 */ 'bufio', '/lib/reader.js', function(exports, module, __filename, __dirname, __meta) {
/*!
 * reader.js - buffer reader for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const enforce = __node_require__(3 /* './enforce' */);
const encoding = __node_require__(2 /* './encoding' */);
const EncodingError = __node_require__(4 /* './error' */);

/*
 * Constants
 */

const EMPTY = Buffer.alloc(0);

/**
 * Buffer Reader
 */

class BufferReader {
  /**
   * Create a buffer reader.
   * @constructor
   * @param {Buffer} data
   * @param {Boolean?} zeroCopy - Do not reallocate buffers when
   * slicing. Note that this can lead to memory leaks if not used
   * carefully.
   */

  constructor(data, zeroCopy = false) {
    enforce(Buffer.isBuffer(data), 'data', 'buffer');
    enforce(typeof zeroCopy === 'boolean', 'zeroCopy', 'boolean');

    this.data = data;
    this.offset = 0;
    this.zeroCopy = zeroCopy;
    this.stack = [];
  }

  /**
   * Assertion.
   * @param {Number} size
   */

  check(size) {
    if (this.offset + size > this.data.length)
      throw new EncodingError(this.offset, 'Out of bounds read', this.check);
  }

  /**
   * Get total size of passed-in Buffer.
   * @returns {Buffer}
   */

  getSize() {
    return this.data.length;
  }

  /**
   * Calculate number of bytes left to read.
   * @returns {Number}
   */

  left() {
    this.check(0);
    return this.data.length - this.offset;
  }

  /**
   * Seek to a position to read from by offset.
   * @param {Number} off - Offset (positive or negative).
   */

  seek(off) {
    enforce(Number.isSafeInteger(off), 'off', 'integer');

    if (this.offset + off < 0)
      throw new EncodingError(this.offset, 'Out of bounds read');

    this.check(off);
    this.offset += off;

    return this;
  }

  /**
   * Mark the current starting position.
   */

  start() {
    this.stack.push(this.offset);
    return this.offset;
  }

  /**
   * Stop reading. Pop the start position off the stack
   * and calculate the size of the data read.
   * @returns {Number} Size.
   * @throws on empty stack.
   */

  end() {
    if (this.stack.length === 0)
      throw new Error('Cannot end without a stack item.');

    const start = this.stack.pop();

    return this.offset - start;
  }

  /**
   * Stop reading. Pop the start position off the stack
   * and return the data read.
   * @param {Bolean?} zeroCopy - Do a fast buffer
   * slice instead of allocating a new buffer (warning:
   * may cause memory leaks if not used with care).
   * @returns {Buffer} Data read.
   * @throws on empty stack.
   */

  endData(zeroCopy = false) {
    enforce(typeof zeroCopy === 'boolean', 'zeroCopy', 'boolean');

    if (this.stack.length === 0)
      throw new Error('Cannot end without a stack item.');

    const start = this.stack.pop();
    const end = this.offset;
    const size = end - start;
    const data = this.data;

    if (size === data.length)
      return data;

    if (this.zeroCopy || zeroCopy)
      return data.slice(start, end);

    const ret = Buffer.allocUnsafe(size);
    data.copy(ret, 0, start, end);

    return ret;
  }

  /**
   * Destroy the reader. Remove references to the data.
   */

  destroy() {
    this.data = EMPTY;
    this.offset = 0;
    this.stack.length = 0;
    return this;
  }

  /**
   * Read uint8.
   * @returns {Number}
   */

  readU8() {
    this.check(1);
    const ret = this.data[this.offset];
    this.offset += 1;
    return ret;
  }

  /**
   * Read uint16le.
   * @returns {Number}
   */

  readU16() {
    this.check(2);
    const ret = encoding.readU16(this.data, this.offset);
    this.offset += 2;
    return ret;
  }

  /**
   * Read uint16be.
   * @returns {Number}
   */

  readU16BE() {
    this.check(2);
    const ret = encoding.readU16BE(this.data, this.offset);
    this.offset += 2;
    return ret;
  }

  /**
   * Read uint24le.
   * @returns {Number}
   */

  readU24() {
    this.check(3);
    const ret = encoding.readU24(this.data, this.offset);
    this.offset += 3;
    return ret;
  }

  /**
   * Read uint24be.
   * @returns {Number}
   */

  readU24BE() {
    this.check(3);
    const ret = encoding.readU24BE(this.data, this.offset);
    this.offset += 3;
    return ret;
  }

  /**
   * Read uint32le.
   * @returns {Number}
   */

  readU32() {
    this.check(4);
    const ret = encoding.readU32(this.data, this.offset);
    this.offset += 4;
    return ret;
  }

  /**
   * Read uint32be.
   * @returns {Number}
   */

  readU32BE() {
    this.check(4);
    const ret = encoding.readU32BE(this.data, this.offset);
    this.offset += 4;
    return ret;
  }

  /**
   * Read uint40le.
   * @returns {Number}
   */

  readU40() {
    this.check(5);
    const ret = encoding.readU40(this.data, this.offset);
    this.offset += 5;
    return ret;
  }

  /**
   * Read uint40be.
   * @returns {Number}
   */

  readU40BE() {
    this.check(5);
    const ret = encoding.readU40BE(this.data, this.offset);
    this.offset += 5;
    return ret;
  }

  /**
   * Read uint48le.
   * @returns {Number}
   */

  readU48() {
    this.check(6);
    const ret = encoding.readU48(this.data, this.offset);
    this.offset += 6;
    return ret;
  }

  /**
   * Read uint48be.
   * @returns {Number}
   */

  readU48BE() {
    this.check(6);
    const ret = encoding.readU48BE(this.data, this.offset);
    this.offset += 6;
    return ret;
  }

  /**
   * Read uint56le.
   * @returns {Number}
   */

  readU56() {
    this.check(7);
    const ret = encoding.readU56(this.data, this.offset);
    this.offset += 7;
    return ret;
  }

  /**
   * Read uint56be.
   * @returns {Number}
   */

  readU56BE() {
    this.check(7);
    const ret = encoding.readU56BE(this.data, this.offset);
    this.offset += 7;
    return ret;
  }

  /**
   * Read uint64le as a js number.
   * @returns {Number}
   * @throws on num > MAX_SAFE_INTEGER
   */

  readU64() {
    this.check(8);
    const ret = encoding.readU64(this.data, this.offset);
    this.offset += 8;
    return ret;
  }

  /**
   * Read uint64be as a js number.
   * @returns {Number}
   * @throws on num > MAX_SAFE_INTEGER
   */

  readU64BE() {
    this.check(8);
    const ret = encoding.readU64BE(this.data, this.offset);
    this.offset += 8;
    return ret;
  }

  /**
   * Read int8.
   * @returns {Number}
   */

  readI8() {
    this.check(1);
    const ret = encoding.readI8(this.data, this.offset);
    this.offset += 1;
    return ret;
  }

  /**
   * Read int16le.
   * @returns {Number}
   */

  readI16() {
    this.check(2);
    const ret = encoding.readI16(this.data, this.offset);
    this.offset += 2;
    return ret;
  }

  /**
   * Read int16be.
   * @returns {Number}
   */

  readI16BE() {
    this.check(2);
    const ret = encoding.readI16BE(this.data, this.offset);
    this.offset += 2;
    return ret;
  }

  /**
   * Read int24le.
   * @returns {Number}
   */

  readI24() {
    this.check(3);
    const ret = encoding.readI24(this.data, this.offset);
    this.offset += 3;
    return ret;
  }

  /**
   * Read int24be.
   * @returns {Number}
   */

  readI24BE() {
    this.check(3);
    const ret = encoding.readI24BE(this.data, this.offset);
    this.offset += 3;
    return ret;
  }

  /**
   * Read int32le.
   * @returns {Number}
   */

  readI32() {
    this.check(4);
    const ret = encoding.readI32(this.data, this.offset);
    this.offset += 4;
    return ret;
  }

  /**
   * Read int32be.
   * @returns {Number}
   */

  readI32BE() {
    this.check(4);
    const ret = encoding.readI32BE(this.data, this.offset);
    this.offset += 4;
    return ret;
  }

  /**
   * Read int40le.
   * @returns {Number}
   */

  readI40() {
    this.check(5);
    const ret = encoding.readI40(this.data, this.offset);
    this.offset += 5;
    return ret;
  }

  /**
   * Read int40be.
   * @returns {Number}
   */

  readI40BE() {
    this.check(5);
    const ret = encoding.readI40BE(this.data, this.offset);
    this.offset += 5;
    return ret;
  }

  /**
   * Read int48le.
   * @returns {Number}
   */

  readI48() {
    this.check(6);
    const ret = encoding.readI48(this.data, this.offset);
    this.offset += 6;
    return ret;
  }

  /**
   * Read int48be.
   * @returns {Number}
   */

  readI48BE() {
    this.check(6);
    const ret = encoding.readI48BE(this.data, this.offset);
    this.offset += 6;
    return ret;
  }

  /**
   * Read int56le.
   * @returns {Number}
   */

  readI56() {
    this.check(7);
    const ret = encoding.readI56(this.data, this.offset);
    this.offset += 7;
    return ret;
  }

  /**
   * Read int56be.
   * @returns {Number}
   */

  readI56BE() {
    this.check(7);
    const ret = encoding.readI56BE(this.data, this.offset);
    this.offset += 7;
    return ret;
  }

  /**
   * Read int64le as a js number.
   * @returns {Number}
   * @throws on num > MAX_SAFE_INTEGER
   */

  readI64() {
    this.check(8);
    const ret = encoding.readI64(this.data, this.offset);
    this.offset += 8;
    return ret;
  }

  /**
   * Read int64be as a js number.
   * @returns {Number}
   * @throws on num > MAX_SAFE_INTEGER
   */

  readI64BE() {
    this.check(8);
    const ret = encoding.readI64BE(this.data, this.offset);
    this.offset += 8;
    return ret;
  }

  /**
   * Read float le.
   * @returns {Number}
   */

  readFloat() {
    this.check(4);
    const ret = encoding.readFloat(this.data, this.offset);
    this.offset += 4;
    return ret;
  }

  /**
   * Read float be.
   * @returns {Number}
   */

  readFloatBE() {
    this.check(4);
    const ret = encoding.readFloatBE(this.data, this.offset);
    this.offset += 4;
    return ret;
  }

  /**
   * Read double float le.
   * @returns {Number}
   */

  readDouble() {
    this.check(8);
    const ret = encoding.readDouble(this.data, this.offset);
    this.offset += 8;
    return ret;
  }

  /**
   * Read double float be.
   * @returns {Number}
   */

  readDoubleBE() {
    this.check(8);
    const ret = encoding.readDoubleBE(this.data, this.offset);
    this.offset += 8;
    return ret;
  }

  /**
   * Read a varint.
   * @returns {Number}
   */

  readVarint() {
    const {size, value} = encoding.readVarint(this.data, this.offset);
    this.offset += size;
    return value;
  }

  /**
   * Read a varint (type 2).
   * @returns {Number}
   */

  readVarint2() {
    const {size, value} = encoding.readVarint2(this.data, this.offset);
    this.offset += size;
    return value;
  }

  /**
   * Read N bytes (will do a fast slice if zero copy).
   * @param {Number} size
   * @param {Bolean?} zeroCopy - Do a fast buffer
   * slice instead of allocating a new buffer (warning:
   * may cause memory leaks if not used with care).
   * @returns {Buffer}
   */

  readBytes(size, zeroCopy = false) {
    enforce((size >>> 0) === size, 'size', 'integer');
    enforce(typeof zeroCopy === 'boolean', 'zeroCopy', 'boolean');

    this.check(size);

    let ret;
    if (this.zeroCopy || zeroCopy) {
      ret = this.data.slice(this.offset, this.offset + size);
    } else {
      ret = Buffer.allocUnsafe(size);
      this.data.copy(ret, 0, this.offset, this.offset + size);
    }

    this.offset += size;

    return ret;
  }

  /**
   * Read a varint number of bytes (will do a fast slice if zero copy).
   * @param {Bolean?} zeroCopy - Do a fast buffer
   * slice instead of allocating a new buffer (warning:
   * may cause memory leaks if not used with care).
   * @returns {Buffer}
   */

  readVarBytes(zeroCopy = false) {
    return this.readBytes(this.readVarint(), zeroCopy);
  }

  /**
   * Slice N bytes and create a child reader.
   * @param {Number} size
   * @returns {BufferReader}
   */

  readChild(size) {
    enforce((size >>> 0) === size, 'size', 'integer');

    this.check(size);

    const data = this.data.slice(0, this.offset + size);

    const br = new this.constructor(data);
    br.offset = this.offset;

    this.offset += size;

    return br;
  }

  /**
   * Read a string.
   * @param {Number} size
   * @param {String} enc - Any buffer-supported encoding.
   * @returns {String}
   */

  readString(size, enc) {
    if (enc == null)
      enc = 'binary';

    enforce((size >>> 0) === size, 'size', 'integer');
    enforce(typeof enc === 'string', 'enc', 'string');

    this.check(size);

    const ret = this.data.toString(enc, this.offset, this.offset + size);

    this.offset += size;

    return ret;
  }

  /**
   * Read a 32-byte hash.
   * @param {String} enc - `"hex"` or `null`.
   * @returns {Hash|Buffer}
   */

  readHash(enc) {
    if (enc)
      return this.readString(32, enc);
    return this.readBytes(32);
  }

  /**
   * Read string of a varint length.
   * @param {String} enc - Any buffer-supported encoding.
   * @param {Number?} limit - Size limit.
   * @returns {String}
   */

  readVarString(enc, limit = 0) {
    if (enc == null)
      enc = 'binary';

    enforce(typeof enc === 'string', 'enc', 'string');
    enforce((limit >>> 0) === limit, 'limit', 'integer');

    const size = this.readVarint();

    if (limit !== 0 && size > limit)
      throw new EncodingError(this.offset, 'String exceeds limit');

    return this.readString(size, enc);
  }

  /**
   * Read a null-terminated string.
   * @param {String} enc - Any buffer-supported encoding.
   * @returns {String}
   */

  readNullString(enc) {
    if (enc == null)
      enc = 'binary';

    enforce(typeof enc === 'string', 'enc', 'string');

    let i = this.offset;

    for (; i < this.data.length; i++) {
      if (this.data[i] === 0)
        break;
    }

    if (i === this.data.length)
      throw new EncodingError(this.offset, 'No NUL terminator');

    const ret = this.readString(i - this.offset, enc);

    this.offset = i + 1;

    return ret;
  }

  /**
   * Create a checksum from the last start position.
   * @param {Function} hash
   * @returns {Number} Checksum.
   */

  createChecksum(hash) {
    enforce(typeof hash === 'function', 'hash', 'function');

    let start = 0;

    if (this.stack.length > 0)
      start = this.stack[this.stack.length - 1];

    const data = this.data.slice(start, this.offset);

    return encoding.readU32(hash(data), 0);
  }

  /**
   * Verify a 4-byte checksum against a calculated checksum.
   * @param {Function} hash
   * @returns {Number} checksum
   * @throws on bad checksum
   */

  verifyChecksum(hash) {
    const checksum = this.createChecksum(hash);
    const expect = this.readU32();

    if (checksum !== expect)
      throw new EncodingError(this.offset, 'Checksum mismatch');

    return checksum;
  }
}

/*
 * Expose
 */

module.exports = BufferReader;
}],
[/* 6 */ 'bufio', '/lib/writer.js', function(exports, module, __filename, __dirname, __meta) {
/*!
 * writer.js - buffer writer for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const enforce = __node_require__(3 /* './enforce' */);
const encoding = __node_require__(2 /* './encoding' */);
const EncodingError = __node_require__(4 /* './error' */);

/*
 * Constants
 */

const SEEK = 0;
const U8 = 1;
const U16 = 2;
const U16BE = 3;
const U24 = 4;
const U24BE = 5;
const U32 = 6;
const U32BE = 7;
const U40 = 8;
const U40BE = 9;
const U48 = 10;
const U48BE = 11;
const U56 = 12;
const U56BE = 13;
const U64 = 14;
const U64BE = 15;
const I8 = 16;
const I16 = 17;
const I16BE = 18;
const I24 = 19;
const I24BE = 20;
const I32 = 21;
const I32BE = 22;
const I40 = 23;
const I40BE = 24;
const I48 = 25;
const I48BE = 26;
const I56 = 27;
const I56BE = 28;
const I64 = 29;
const I64BE = 30;
const FL = 31;
const FLBE = 32;
const DBL = 33;
const DBLBE = 34;
const VARINT = 35;
const VARINT2 = 36;
const BYTES = 37;
const STR = 38;
const CHECKSUM = 39;
const FILL = 40;

/**
 * Buffer Writer
 */

class BufferWriter {
  /**
   * Create a buffer writer.
   * @constructor
   */

  constructor() {
    this.ops = [];
    this.offset = 0;
  }

  /**
   * Allocate and render the final buffer.
   * @returns {Buffer} Rendered buffer.
   */

  render() {
    const data = Buffer.allocUnsafe(this.offset);

    let off = 0;

    for (const op of this.ops) {
      switch (op.type) {
        case SEEK:
          off += op.value;
          break;
        case U8:
          off = encoding.writeU8(data, op.value, off);
          break;
        case U16:
          off = encoding.writeU16(data, op.value, off);
          break;
        case U16BE:
          off = encoding.writeU16BE(data, op.value, off);
          break;
        case U24:
          off = encoding.writeU24(data, op.value, off);
          break;
        case U24BE:
          off = encoding.writeU24BE(data, op.value, off);
          break;
        case U32:
          off = encoding.writeU32(data, op.value, off);
          break;
        case U32BE:
          off = encoding.writeU32BE(data, op.value, off);
          break;
        case U40:
          off = encoding.writeU40(data, op.value, off);
          break;
        case U40BE:
          off = encoding.writeU40BE(data, op.value, off);
          break;
        case U48:
          off = encoding.writeU48(data, op.value, off);
          break;
        case U48BE:
          off = encoding.writeU48BE(data, op.value, off);
          break;
        case U56:
          off = encoding.writeU56(data, op.value, off);
          break;
        case U56BE:
          off = encoding.writeU56BE(data, op.value, off);
          break;
        case U64:
          off = encoding.writeU64(data, op.value, off);
          break;
        case U64BE:
          off = encoding.writeU64BE(data, op.value, off);
          break;
        case I8:
          off = encoding.writeI8(data, op.value, off);
          break;
        case I16:
          off = encoding.writeI16(data, op.value, off);
          break;
        case I16BE:
          off = encoding.writeI16BE(data, op.value, off);
          break;
        case I24:
          off = encoding.writeI24(data, op.value, off);
          break;
        case I24BE:
          off = encoding.writeI24BE(data, op.value, off);
          break;
        case I32:
          off = encoding.writeI32(data, op.value, off);
          break;
        case I32BE:
          off = encoding.writeI32BE(data, op.value, off);
          break;
        case I40:
          off = encoding.writeI40(data, op.value, off);
          break;
        case I40BE:
          off = encoding.writeI40BE(data, op.value, off);
          break;
        case I48:
          off = encoding.writeI48(data, op.value, off);
          break;
        case I48BE:
          off = encoding.writeI48BE(data, op.value, off);
          break;
        case I56:
          off = encoding.writeI56(data, op.value, off);
          break;
        case I56BE:
          off = encoding.writeI56BE(data, op.value, off);
          break;
        case I64:
          off = encoding.writeI64(data, op.value, off);
          break;
        case I64BE:
          off = encoding.writeI64BE(data, op.value, off);
          break;
        case FL:
          off = encoding.writeFloat(data, op.value, off);
          break;
        case FLBE:
          off = encoding.writeFloatBE(data, op.value, off);
          break;
        case DBL:
          off = encoding.writeDouble(data, op.value, off);
          break;
        case DBLBE:
          off = encoding.writeDoubleBE(data, op.value, off);
          break;
        case VARINT:
          off = encoding.writeVarint(data, op.value, off);
          break;
        case VARINT2:
          off = encoding.writeVarint2(data, op.value, off);
          break;
        case BYTES:
          off += op.data.copy(data, off);
          break;
        case STR:
          off += data.write(op.value, off, op.enc);
          break;
        case CHECKSUM:
          off += op.func(data.slice(0, off)).copy(data, off, 0, 4);
          break;
        case FILL:
          data.fill(op.value, off, off + op.size);
          off += op.size;
          break;
        default:
          throw new Error('Invalid type.');
      }
    }

    if (off !== data.length)
      throw new EncodingError(off, 'Out of bounds write');

    this.destroy();

    return data;
  }

  /**
   * Get size of data written so far.
   * @returns {Number}
   */

  getSize() {
    return this.offset;
  }

  /**
   * Seek to relative offset.
   * @param {Number} offset
   */

  seek(off) {
    enforce(Number.isSafeInteger(off), 'off', 'integer');

    if (this.offset + off < 0)
      throw new EncodingError(this.offset, 'Out of bounds write');

    this.offset += off;
    this.ops.push(new NumberOp(SEEK, off));

    return this;
  }

  /**
   * Destroy the buffer writer. Remove references to `ops`.
   */

  destroy() {
    this.ops.length = 0;
    this.offset = 0;
    return this;
  }

  /**
   * Write uint8.
   * @param {Number} value
   */

  writeU8(value) {
    this.offset += 1;
    this.ops.push(new NumberOp(U8, value));
    return this;
  }

  /**
   * Write uint16le.
   * @param {Number} value
   */

  writeU16(value) {
    this.offset += 2;
    this.ops.push(new NumberOp(U16, value));
    return this;
  }

  /**
   * Write uint16be.
   * @param {Number} value
   */

  writeU16BE(value) {
    this.offset += 2;
    this.ops.push(new NumberOp(U16BE, value));
    return this;
  }

  /**
   * Write uint24le.
   * @param {Number} value
   */

  writeU24(value) {
    this.offset += 3;
    this.ops.push(new NumberOp(U24, value));
    return this;
  }

  /**
   * Write uint24be.
   * @param {Number} value
   */

  writeU24BE(value) {
    this.offset += 3;
    this.ops.push(new NumberOp(U24BE, value));
    return this;
  }

  /**
   * Write uint32le.
   * @param {Number} value
   */

  writeU32(value) {
    this.offset += 4;
    this.ops.push(new NumberOp(U32, value));
    return this;
  }

  /**
   * Write uint32be.
   * @param {Number} value
   */

  writeU32BE(value) {
    this.offset += 4;
    this.ops.push(new NumberOp(U32BE, value));
    return this;
  }

  /**
   * Write uint40le.
   * @param {Number} value
   */

  writeU40(value) {
    this.offset += 5;
    this.ops.push(new NumberOp(U40, value));
    return this;
  }

  /**
   * Write uint40be.
   * @param {Number} value
   */

  writeU40BE(value) {
    this.offset += 5;
    this.ops.push(new NumberOp(U40BE, value));
    return this;
  }

  /**
   * Write uint48le.
   * @param {Number} value
   */

  writeU48(value) {
    this.offset += 6;
    this.ops.push(new NumberOp(U48, value));
    return this;
  }

  /**
   * Write uint48be.
   * @param {Number} value
   */

  writeU48BE(value) {
    this.offset += 6;
    this.ops.push(new NumberOp(U48BE, value));
    return this;
  }

  /**
   * Write uint56le.
   * @param {Number} value
   */

  writeU56(value) {
    this.offset += 7;
    this.ops.push(new NumberOp(U56, value));
    return this;
  }

  /**
   * Write uint56be.
   * @param {Number} value
   */

  writeU56BE(value) {
    this.offset += 7;
    this.ops.push(new NumberOp(U56BE, value));
    return this;
  }

  /**
   * Write uint64le.
   * @param {Number} value
   */

  writeU64(value) {
    this.offset += 8;
    this.ops.push(new NumberOp(U64, value));
    return this;
  }

  /**
   * Write uint64be.
   * @param {Number} value
   */

  writeU64BE(value) {
    this.offset += 8;
    this.ops.push(new NumberOp(U64BE, value));
    return this;
  }

  /**
   * Write int8.
   * @param {Number} value
   */

  writeI8(value) {
    this.offset += 1;
    this.ops.push(new NumberOp(I8, value));
    return this;
  }

  /**
   * Write int16le.
   * @param {Number} value
   */

  writeI16(value) {
    this.offset += 2;
    this.ops.push(new NumberOp(I16, value));
    return this;
  }

  /**
   * Write int16be.
   * @param {Number} value
   */

  writeI16BE(value) {
    this.offset += 2;
    this.ops.push(new NumberOp(I16BE, value));
    return this;
  }

  /**
   * Write int24le.
   * @param {Number} value
   */

  writeI24(value) {
    this.offset += 3;
    this.ops.push(new NumberOp(I24, value));
    return this;
  }

  /**
   * Write int24be.
   * @param {Number} value
   */

  writeI24BE(value) {
    this.offset += 3;
    this.ops.push(new NumberOp(I24BE, value));
    return this;
  }

  /**
   * Write int32le.
   * @param {Number} value
   */

  writeI32(value) {
    this.offset += 4;
    this.ops.push(new NumberOp(I32, value));
    return this;
  }

  /**
   * Write int32be.
   * @param {Number} value
   */

  writeI32BE(value) {
    this.offset += 4;
    this.ops.push(new NumberOp(I32BE, value));
    return this;
  }

  /**
   * Write int40le.
   * @param {Number} value
   */

  writeI40(value) {
    this.offset += 5;
    this.ops.push(new NumberOp(I40, value));
    return this;
  }

  /**
   * Write int40be.
   * @param {Number} value
   */

  writeI40BE(value) {
    this.offset += 5;
    this.ops.push(new NumberOp(I40BE, value));
    return this;
  }

  /**
   * Write int48le.
   * @param {Number} value
   */

  writeI48(value) {
    this.offset += 6;
    this.ops.push(new NumberOp(I48, value));
    return this;
  }

  /**
   * Write int48be.
   * @param {Number} value
   */

  writeI48BE(value) {
    this.offset += 6;
    this.ops.push(new NumberOp(I48BE, value));
    return this;
  }

  /**
   * Write int56le.
   * @param {Number} value
   */

  writeI56(value) {
    this.offset += 7;
    this.ops.push(new NumberOp(I56, value));
    return this;
  }

  /**
   * Write int56be.
   * @param {Number} value
   */

  writeI56BE(value) {
    this.offset += 7;
    this.ops.push(new NumberOp(I56BE, value));
    return this;
  }

  /**
   * Write int64le.
   * @param {Number} value
   */

  writeI64(value) {
    this.offset += 8;
    this.ops.push(new NumberOp(I64, value));
    return this;
  }

  /**
   * Write int64be.
   * @param {Number} value
   */

  writeI64BE(value) {
    this.offset += 8;
    this.ops.push(new NumberOp(I64BE, value));
    return this;
  }

  /**
   * Write float le.
   * @param {Number} value
   */

  writeFloat(value) {
    this.offset += 4;
    this.ops.push(new NumberOp(FL, value));
    return this;
  }

  /**
   * Write float be.
   * @param {Number} value
   */

  writeFloatBE(value) {
    this.offset += 4;
    this.ops.push(new NumberOp(FLBE, value));
    return this;
  }

  /**
   * Write double le.
   * @param {Number} value
   */

  writeDouble(value) {
    this.offset += 8;
    this.ops.push(new NumberOp(DBL, value));
    return this;
  }

  /**
   * Write double be.
   * @param {Number} value
   */

  writeDoubleBE(value) {
    this.offset += 8;
    this.ops.push(new NumberOp(DBLBE, value));
    return this;
  }

  /**
   * Write a varint.
   * @param {Number} value
   */

  writeVarint(value) {
    this.offset += encoding.sizeVarint(value);
    this.ops.push(new NumberOp(VARINT, value));
    return this;
  }

  /**
   * Write a varint (type 2).
   * @param {Number} value
   */

  writeVarint2(value) {
    this.offset += encoding.sizeVarint2(value);
    this.ops.push(new NumberOp(VARINT2, value));
    return this;
  }

  /**
   * Write bytes.
   * @param {Buffer} value
   */

  writeBytes(value) {
    enforce(Buffer.isBuffer(value), 'value', 'buffer');

    if (value.length === 0)
      return this;

    this.offset += value.length;
    this.ops.push(new BufferOp(BYTES, value));

    return this;
  }

  /**
   * Write bytes with a varint length before them.
   * @param {Buffer} value
   */

  writeVarBytes(value) {
    enforce(Buffer.isBuffer(value), 'value', 'buffer');

    this.offset += encoding.sizeVarint(value.length);
    this.ops.push(new NumberOp(VARINT, value.length));

    if (value.length === 0)
      return this;

    this.offset += value.length;
    this.ops.push(new BufferOp(BYTES, value));

    return this;
  }

  /**
   * Copy bytes.
   * @param {Buffer} value
   * @param {Number} start
   * @param {Number} end
   */

  copy(value, start, end) {
    enforce(Buffer.isBuffer(value), 'value', 'buffer');
    enforce((start >>> 0) === start, 'start', 'integer');
    enforce((end >>> 0) === end, 'end', 'integer');
    enforce(end >= start, 'start', 'integer');

    const buf = value.slice(start, end);

    this.writeBytes(buf);

    return this;
  }

  /**
   * Write string to buffer.
   * @param {String} value
   * @param {String?} enc - Any buffer-supported encoding.
   */

  writeString(value, enc) {
    if (enc == null)
      enc = 'binary';

    enforce(typeof value === 'string', 'value', 'string');
    enforce(typeof enc === 'string', 'enc', 'string');

    if (value.length === 0)
      return this;

    this.offset += Buffer.byteLength(value, enc);
    this.ops.push(new StringOp(STR, value, enc));

    return this;
  }

  /**
   * Write a 32 byte hash.
   * @param {Hash} value
   */

  writeHash(value) {
    if (typeof value !== 'string') {
      enforce(Buffer.isBuffer(value), 'value', 'buffer');
      enforce(value.length === 32, 'value', '32-byte hash');
      this.writeBytes(value);
      return this;
    }
    enforce(value.length === 64, 'value', '32-byte hash');
    this.writeString(value, 'hex');
    return this;
  }

  /**
   * Write a string with a varint length before it.
   * @param {String}
   * @param {String?} enc - Any buffer-supported encoding.
   */

  writeVarString(value, enc) {
    if (enc == null)
      enc = 'binary';

    enforce(typeof value === 'string', 'value', 'string');
    enforce(typeof enc === 'string', 'enc', 'string');

    if (value.length === 0) {
      this.ops.push(new NumberOp(VARINT, 0));
      return this;
    }

    const size = Buffer.byteLength(value, enc);

    this.offset += encoding.sizeVarint(size);
    this.offset += size;

    this.ops.push(new NumberOp(VARINT, size));
    this.ops.push(new StringOp(STR, value, enc));

    return this;
  }

  /**
   * Write a null-terminated string.
   * @param {String|Buffer}
   * @param {String?} enc - Any buffer-supported encoding.
   */

  writeNullString(value, enc) {
    this.writeString(value, enc);
    this.writeU8(0);
    return this;
  }

  /**
   * Calculate and write a checksum for the data written so far.
   * @param {Function} hash
   */

  writeChecksum(hash) {
    enforce(typeof hash === 'function', 'hash', 'function');
    this.offset += 4;
    this.ops.push(new FunctionOp(CHECKSUM, hash));
    return this;
  }

  /**
   * Fill N bytes with value.
   * @param {Number} value
   * @param {Number} size
   */

  fill(value, size) {
    enforce((value & 0xff) === value, 'value', 'byte');
    enforce((size >>> 0) === size, 'size', 'integer');

    if (size === 0)
      return this;

    this.offset += size;
    this.ops.push(new FillOp(FILL, value, size));

    return this;
  }
}

/*
 * Helpers
 */

class WriteOp {
  constructor(type) {
    this.type = type;
  }
}

class NumberOp extends WriteOp {
  constructor(type, value) {
    super(type);
    this.value = value;
  }
}

class BufferOp extends WriteOp {
  constructor(type, data) {
    super(type);
    this.data = data;
  }
}

class StringOp extends WriteOp {
  constructor(type, value, enc) {
    super(type);
    this.value = value;
    this.enc = enc;
  }
}

class FunctionOp extends WriteOp {
  constructor(type, func) {
    super(type);
    this.func = func;
  }
}

class FillOp extends WriteOp {
  constructor(type, value, size) {
    super(type);
    this.value = value;
    this.size = size;
  }
}

/*
 * Expose
 */

module.exports = BufferWriter;
}],
[/* 7 */ 'bufio', '/lib/staticwriter.js', function(exports, module, __filename, __dirname, __meta) {
/*!
 * staticwriter.js - buffer writer for bcoin
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const enforce = __node_require__(3 /* './enforce' */);
const encoding = __node_require__(2 /* './encoding' */);
const EncodingError = __node_require__(4 /* './error' */);

/*
 * Constants
 */

const EMPTY = Buffer.alloc(0);
const POOL_SIZE = 100 << 10;

let POOL = null;

/**
 * Statically Allocated Writer
 */

class StaticWriter {
  /**
   * Statically allocated buffer writer.
   * @constructor
   * @param {Number|Buffer} options
   */

  constructor(options) {
    this.data = EMPTY;
    this.offset = 0;

    if (options != null)
      this.init(options);
  }

  /**
   * Assertion.
   * @param {Number} size
   */

  check(size) {
    if (this.offset + size > this.data.length)
      throw new EncodingError(this.offset, 'Out of bounds write', this.check);
  }

  /**
   * Initialize options.
   * @param {Object} options
   */

  init(options) {
    if (Buffer.isBuffer(options)) {
      this.data = options;
      this.offset = 0;
      return this;
    }

    enforce((options >>> 0) === options, 'size', 'integer');

    this.data = Buffer.allocUnsafe(options);
    this.offset = 0;

    return this;
  }

  /**
   * Allocate writer from preallocated 100kb pool.
   * @param {Number} size
   * @returns {StaticWriter}
   */

  static pool(size) {
    enforce((size >>> 0) === size, 'size', 'integer');

    if (size <= POOL_SIZE) {
      if (!POOL)
        POOL = Buffer.allocUnsafe(POOL_SIZE);

      const bw = new StaticWriter();
      bw.data = POOL.slice(0, size);
      return bw;
    }

    return new StaticWriter(size);
  }

  /**
   * Allocate and render the final buffer.
   * @returns {Buffer} Rendered buffer.
   */

  render() {
    const {data, offset} = this;

    if (offset !== data.length)
      throw new EncodingError(offset, 'Out of bounds write');

    this.destroy();

    return data;
  }

  /**
   * Slice the final buffer at written offset.
   * @returns {Buffer} Rendered buffer.
   */

  slice() {
    const {data, offset} = this;

    if (offset > data.length)
      throw new EncodingError(offset, 'Out of bounds write');

    this.destroy();

    return data.slice(0, offset);
  }

  /**
   * Get size of data written so far.
   * @returns {Number}
   */

  getSize() {
    return this.offset;
  }

  /**
   * Seek to relative offset.
   * @param {Number} off
   */

  seek(off) {
    enforce(Number.isSafeInteger(off), 'off', 'integer');

    if (this.offset + off < 0)
      throw new EncodingError(this.offset, 'Out of bounds write');

    this.check(off);
    this.offset += off;

    return this;
  }

  /**
   * Destroy the buffer writer.
   */

  destroy() {
    this.data = EMPTY;
    this.offset = 0;
    return this;
  }

  /**
   * Write uint8.
   * @param {Number} value
   */

  writeU8(value) {
    this.check(1);
    this.offset = encoding.writeU8(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint16le.
   * @param {Number} value
   */

  writeU16(value) {
    this.check(2);
    this.offset = encoding.writeU16(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint16be.
   * @param {Number} value
   */

  writeU16BE(value) {
    this.check(2);
    this.offset = encoding.writeU16BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint24le.
   * @param {Number} value
   */

  writeU24(value) {
    this.check(3);
    this.offset = encoding.writeU24(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint24be.
   * @param {Number} value
   */

  writeU24BE(value) {
    this.check(3);
    this.offset = encoding.writeU24BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint32le.
   * @param {Number} value
   */

  writeU32(value) {
    this.check(4);
    this.offset = encoding.writeU32(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint32be.
   * @param {Number} value
   */

  writeU32BE(value) {
    this.check(4);
    this.offset = encoding.writeU32BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint40le.
   * @param {Number} value
   */

  writeU40(value) {
    this.check(5);
    this.offset = encoding.writeU40(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint40be.
   * @param {Number} value
   */

  writeU40BE(value) {
    this.check(5);
    this.offset = encoding.writeU40BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint48le.
   * @param {Number} value
   */

  writeU48(value) {
    this.check(6);
    this.offset = encoding.writeU48(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint48be.
   * @param {Number} value
   */

  writeU48BE(value) {
    this.check(6);
    this.offset = encoding.writeU48BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint56le.
   * @param {Number} value
   */

  writeU56(value) {
    this.check(7);
    this.offset = encoding.writeU56(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint56be.
   * @param {Number} value
   */

  writeU56BE(value) {
    this.check(7);
    this.offset = encoding.writeU56BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint64le.
   * @param {Number} value
   */

  writeU64(value) {
    this.check(8);
    this.offset = encoding.writeU64(this.data, value, this.offset);
    return this;
  }

  /**
   * Write uint64be.
   * @param {Number} value
   */

  writeU64BE(value) {
    this.check(8);
    this.offset = encoding.writeU64BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int8.
   * @param {Number} value
   */

  writeI8(value) {
    this.check(1);
    this.offset = encoding.writeI8(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int16le.
   * @param {Number} value
   */

  writeI16(value) {
    this.check(2);
    this.offset = encoding.writeI16(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int16be.
   * @param {Number} value
   */

  writeI16BE(value) {
    this.check(2);
    this.offset = encoding.writeI16BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int24le.
   * @param {Number} value
   */

  writeI24(value) {
    this.check(3);
    this.offset = encoding.writeI24(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int24be.
   * @param {Number} value
   */

  writeI24BE(value) {
    this.check(3);
    this.offset = encoding.writeI24BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int32le.
   * @param {Number} value
   */

  writeI32(value) {
    this.check(4);
    this.offset = encoding.writeI32(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int32be.
   * @param {Number} value
   */

  writeI32BE(value) {
    this.check(4);
    this.offset = encoding.writeI32BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int40le.
   * @param {Number} value
   */

  writeI40(value) {
    this.check(5);
    this.offset = encoding.writeI40(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int40be.
   * @param {Number} value
   */

  writeI40BE(value) {
    this.check(5);
    this.offset = encoding.writeI40BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int48le.
   * @param {Number} value
   */

  writeI48(value) {
    this.check(6);
    this.offset = encoding.writeI48(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int48be.
   * @param {Number} value
   */

  writeI48BE(value) {
    this.check(6);
    this.offset = encoding.writeI48BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int56le.
   * @param {Number} value
   */

  writeI56(value) {
    this.check(7);
    this.offset = encoding.writeI56(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int56be.
   * @param {Number} value
   */

  writeI56BE(value) {
    this.check(7);
    this.offset = encoding.writeI56BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int64le.
   * @param {Number} value
   */

  writeI64(value) {
    this.check(8);
    this.offset = encoding.writeI64(this.data, value, this.offset);
    return this;
  }

  /**
   * Write int64be.
   * @param {Number} value
   */

  writeI64BE(value) {
    this.check(8);
    this.offset = encoding.writeI64BE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write float le.
   * @param {Number} value
   */

  writeFloat(value) {
    this.check(4);
    this.offset = encoding.writeFloat(this.data, value, this.offset);
    return this;
  }

  /**
   * Write float be.
   * @param {Number} value
   */

  writeFloatBE(value) {
    this.check(4);
    this.offset = encoding.writeFloatBE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write double le.
   * @param {Number} value
   */

  writeDouble(value) {
    this.check(8);
    this.offset = encoding.writeDouble(this.data, value, this.offset);
    return this;
  }

  /**
   * Write double be.
   * @param {Number} value
   */

  writeDoubleBE(value) {
    this.check(8);
    this.offset = encoding.writeDoubleBE(this.data, value, this.offset);
    return this;
  }

  /**
   * Write a varint.
   * @param {Number} value
   */

  writeVarint(value) {
    this.offset = encoding.writeVarint(this.data, value, this.offset);
    return this;
  }

  /**
   * Write a varint (type 2).
   * @param {Number} value
   */

  writeVarint2(value) {
    this.offset = encoding.writeVarint2(this.data, value, this.offset);
    return this;
  }

  /**
   * Write bytes.
   * @param {Buffer} value
   */

  writeBytes(value) {
    enforce(Buffer.isBuffer(value), 'value', 'buffer');
    this.check(value.length);
    this.offset += value.copy(this.data, this.offset);
    return this;
  }

  /**
   * Write bytes with a varint length before them.
   * @param {Buffer} value
   */

  writeVarBytes(value) {
    enforce(Buffer.isBuffer(value), 'value', 'buffer');
    this.writeVarint(value.length);
    this.writeBytes(value);
    return this;
  }

  /**
   * Copy bytes.
   * @param {Buffer} value
   * @param {Number} start
   * @param {Number} end
   */

  copy(value, start, end) {
    enforce(Buffer.isBuffer(value), 'value', 'buffer');
    enforce((start >>> 0) === start, 'start', 'integer');
    enforce((end >>> 0) === end, 'end', 'integer');
    enforce(end >= start, 'start', 'integer');

    this.check(end - start);
    this.offset += value.copy(this.data, this.offset, start, end);

    return this;
  }

  /**
   * Write string to buffer.
   * @param {String} value
   * @param {String?} enc - Any buffer-supported encoding.
   */

  writeString(value, enc) {
    if (enc == null)
      enc = 'binary';

    enforce(typeof value === 'string', 'value', 'string');
    enforce(typeof enc === 'string', 'enc', 'string');

    if (value.length === 0)
      return this;

    const size = Buffer.byteLength(value, enc);
    this.check(size);

    this.offset += this.data.write(value, this.offset, enc);

    return this;
  }

  /**
   * Write a 32 byte hash.
   * @param {Hash} value
   */

  writeHash(value) {
    if (typeof value !== 'string') {
      enforce(Buffer.isBuffer(value), 'value', 'buffer');
      enforce(value.length === 32, 'value', '32-byte hash');
      this.writeBytes(value);
      return this;
    }
    enforce(value.length === 64, 'value', '32-byte hash');
    this.check(32);
    this.offset += this.data.write(value, this.offset, 'hex');
    return this;
  }

  /**
   * Write a string with a varint length before it.
   * @param {String}
   * @param {String?} enc - Any buffer-supported encoding.
   */

  writeVarString(value, enc) {
    if (enc == null)
      enc = 'binary';

    enforce(typeof value === 'string', 'value', 'string');
    enforce(typeof enc === 'string', 'enc', 'string');

    if (value.length === 0) {
      this.writeVarint(0);
      return this;
    }

    const size = Buffer.byteLength(value, enc);

    this.writeVarint(size);
    this.check(size);
    this.offset += this.data.write(value, this.offset, enc);

    return this;
  }

  /**
   * Write a null-terminated string.
   * @param {String|Buffer}
   * @param {String?} enc - Any buffer-supported encoding.
   */

  writeNullString(value, enc) {
    this.writeString(value, enc);
    this.writeU8(0);
    return this;
  }

  /**
   * Calculate and write a checksum for the data written so far.
   * @param {Function} hash
   */

  writeChecksum(hash) {
    enforce(typeof hash === 'function', 'hash', 'function');

    this.check(4);

    const data = this.data.slice(0, this.offset);

    hash(data).copy(this.data, this.offset, 0, 4);

    this.offset += 4;

    return this;
  }

  /**
   * Fill N bytes with value.
   * @param {Number} value
   * @param {Number} size
   */

  fill(value, size) {
    enforce((value & 0xff) === value, 'value', 'byte');
    enforce((size >>> 0) === size, 'size', 'integer');

    this.check(size);

    this.data.fill(value, this.offset, this.offset + size);
    this.offset += size;

    return this;
  }
}

/*
 * Expose
 */

module.exports = StaticWriter;
}],
[/* 8 */ 'bufio', '/lib/struct.js', function(exports, module, __filename, __dirname, __meta) {
/*!
 * struct.js - struct object for bcoin
 * Copyright (c) 2018, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const enforce = __node_require__(3 /* './enforce' */);
const BufferReader = __node_require__(5 /* './reader' */);
const BufferWriter = __node_require__(6 /* './writer' */);
const StaticWriter = __node_require__(7 /* './staticwriter' */);
const {custom} = __node_require__(1 /* './custom' */);

/**
 * Struct
 */

class Struct {
  constructor() {}

  inject(obj) {
    enforce(obj instanceof this.constructor, 'obj', 'struct');
    return this.decode(obj.encode());
  }

  clone() {
    const copy = new this.constructor();
    return copy.inject(this);
  }

  /*
   * Bindable
   */

  getSize(extra) {
    return -1;
  }

  write(bw, extra) {
    return bw;
  }

  read(br, extra) {
    return this;
  }

  toString() {
    return Object.prototype.toString.call(this);
  }

  fromString(str, extra) {
    return this;
  }

  getJSON() {
    return this;
  }

  fromJSON(json, extra) {
    return this;
  }

  fromOptions(options, extra) {
    return this;
  }

  from(options, extra) {
    return this.fromOptions(options, extra);
  }

  format() {
    return this.getJSON();
  }

  /*
   * API
   */

  encode(extra) {
    const size = this.getSize(extra);
    const bw = size === -1
      ? new BufferWriter()
      : new StaticWriter(size);
    this.write(bw, extra);
    return bw.render();
  }

  decode(data, extra) {
    const br = new BufferReader(data);
    this.read(br, extra);
    return this;
  }

  toHex(extra) {
    return this.encode(extra).toString('hex');
  }

  fromHex(str, extra) {
    enforce(typeof str === 'string', 'str', 'string');

    const size = str.length >>> 1;
    const data = Buffer.from(str, 'hex');

    if (data.length !== size)
      throw new Error('Invalid hex string.');

    return this.decode(data, extra);
  }

  toBase64(extra) {
    return this.encode(extra).toString('base64');
  }

  fromBase64(str, extra) {
    enforce(typeof str === 'string', 'str', 'string');

    const data = Buffer.from(str, 'base64');

    if (str.length > size64(data.length))
      throw new Error('Invalid base64 string.');

    return this.decode(data, extra);
  }

  toJSON() {
    return this.getJSON();
  }

  [custom]() {
    return this.format();
  }

  /*
   * Static API
   */

  static read(br, extra) {
    return new this().read(br, extra);
  }

  static decode(data, extra) {
    return new this().decode(data, extra);
  }

  static fromHex(str, extra) {
    return new this().fromHex(str, extra);
  }

  static fromBase64(str, extra) {
    return new this().fromBase64(str, extra);
  }

  static fromString(str, extra) {
    return new this().fromString(str, extra);
  }

  static fromJSON(json, extra) {
    return new this().fromJSON(json, extra);
  }

  static fromOptions(options, extra) {
    return new this().fromOptions(options, extra);
  }

  static from(options, extra) {
    return new this().from(options, extra);
  }

  /*
   * Aliases
   */

  toWriter(bw, extra) {
    return this.write(bw, extra);
  }

  fromReader(br, extra) {
    return this.read(br, extra);
  }

  toRaw(extra) {
    return this.encode(extra);
  }

  fromRaw(data, extra) {
    return this.decode(data, extra);
  }

  /*
   * Static Aliases
   */

  static fromReader(br, extra) {
    return this.read(br, extra);
  }

  static fromRaw(data, extra) {
    return this.decode(data, extra);
  }
}

/*
 * Helpers
 */

function size64(size) {
  const expect = ((4 * size / 3) + 3) & ~3;
  return expect >>> 0;
}

/*
 * Expose
 */

module.exports = Struct;
}]
];

var __node_cache__ = [];

function __node_error__(location) {
  var err = new Error('Cannot find module \'' + location + '\'');
  err.code = 'MODULE_NOT_FOUND';
  throw err;
}

function __node_require__(id) {
  if ((id >>> 0) !== id || id > __node_modules__.length)
    return __node_error__(id);

  while (__node_cache__.length <= id)
    __node_cache__.push(null);

  var cache = __node_cache__[id];

  if (cache)
    return cache.exports;

  var mod = __node_modules__[id];
  var name = mod[0];
  var path = mod[1];
  var func = mod[2];
  var meta;

  var _exports = exports;
  var _module = module;

  if (id !== 0) {
    _exports = {};
    _module = {
      id: '/' + name + path,
      exports: _exports,
      parent: module.parent,
      filename: module.filename,
      loaded: false,
      children: module.children,
      paths: module.paths
    };
  }

  __node_cache__[id] = _module;

  try {
    func.call(_exports, _exports, _module,
              __filename, __dirname, meta);
  } catch (e) {
    __node_cache__[id] = null;
    throw e;
  }

  __node_modules__[id] = null;

  if (id !== 0)
    _module.loaded = true;

  return _module.exports;
}

__node_require__(0);
