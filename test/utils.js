const createHash = require('create-hash');

module.exports = {

  getPreimageAndHash: function* getPreimageAndHash() {
    const buff = Buffer.alloc(32);
    for (let j = 31; j >= 0; j -= 1) {
      for (let i = 1; i < 256; i += 1) {
        let hexString = buff.toString('hex');
        const digest = this.sha256(hexString);
        hexString = `0x${hexString}`;
        buff[j] = i;
        yield [hexString, digest];
      }
    }
  },

  hash160: function hash160(hexString) {
    const buffer = Buffer.from(hexString, 'hex');
    const t = createHash('sha256').update(buffer).digest();
    const u = createHash('rmd160').update(t).digest();
    return `0x${u.toString('hex')}`;
  },

  sha256: function sha256(hexString) {
    const buffer = Buffer.from(hexString, 'hex');
    const t = createHash('sha256').update(buffer).digest();
    return `0x${t.toString('hex')}`;
  },

  duration: {
    seconds(val) { return val; },
    minutes(val) { return val * this.seconds(60); },
    hours(val) { return val * this.minutes(60); },
    days(val) { return val * this.hours(24); },
    weeks(val) { return val * this.days(7); },
    years(val) { return val * this.days(365); }
  },

  OUTPUT_TYPES: {
    NONE: 0,
    WPKH: 1,
    WSH: 2,
    OP_RETURN: 3,
  },
};


// Some code is used under the following license:
// The MIT License (MIT)
//
// Copyright (c) 2016 Smart Contract Solutions, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
