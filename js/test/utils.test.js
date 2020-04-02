/* global BigInt describe it */
import * as chai from 'chai';
import * as utils from '../src/utils';
import * as vectors from '../../testVectors.json';
// import { type } from 'os';

const vectorObj = JSON.parse(JSON.stringify(vectors));
utils.updateJSON(vectorObj);

const {
  lastBytes,
  lastBytesError,
  reverseEndianness,
  bytesToUint,
  sha256,
  ripemd160,
  typedArraysAreEqual,
  typedArraysAreEqualError,
  safeSlice,
  safeSliceError
} = vectorObj;

const { assert } = chai;

describe('utils', () => {
  describe('#lastBytes', () => {
    it('gets the last bytes correctly', () => {
      for (let i = 0; i < lastBytes.length; i += 1) {
        const res = utils.lastBytes(lastBytes[i].input.bytes, lastBytes[i].input.num);
        const arraysAreEqual = utils.typedArraysAreEqual(res, lastBytes[i].output);
        assert.isTrue(arraysAreEqual);
      }
    });

    it('errors if slice is larger than the bytearray', () => {
      for (let i = 0; i < lastBytesError.length; i += 1) {
        try {
          utils.lastBytes(lastBytesError[i].input.bytes, lastBytesError[i].input.num);
          assert(false, 'expected an errror');
        } catch (e) {
          assert.include(e.message, lastBytesError[i].jsError);
        }
      }
    });
  });

  describe('reverseEndianness', () => {
    it('reverses endianness', () => {
      for (let i = 0; i < reverseEndianness.length; i += 1) {
        const res = utils.reverseEndianness(reverseEndianness[i].input);
        const arraysAreEqual = utils.typedArraysAreEqual(res, reverseEndianness[i].output);
        assert.isTrue(arraysAreEqual);
      }
    });
  });

  describe('#bytesToUint', () => {
    it('converts big-endian bytes to integers', () => {
      let res;
      for (let i = 0; i < bytesToUint.length; i += 1) {
        res = utils.bytesToUint(bytesToUint[i].input);
        assert.strictEqual(res, BigInt(bytesToUint[i].output));
      }

      // special case:
      // max uint256: (2^256)-1
      res = utils.bytesToUint(utils.deserializeHex(`0x${'ff'.repeat(32)}`));
      // cannot store this value in JSON and have it test meaningfully
      assert.strictEqual(res, BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'));
    });
  });

  describe('#serializeHex', () => {
    it('serializes a Uint8Array into a hex string', () => {
      let res;

      res = utils.serializeHex(new Uint8Array([]));
      assert.strictEqual(res, '');

      res = utils.serializeHex();
      assert.strictEqual(res, '');

      res = utils.serializeHex(new Uint8Array([0, 1, 2, 42, 100, 101, 102, 255]));
      assert.strictEqual(res, '0x0001022a646566ff');
    });
    it('errors if passed anything other than a Uint8Array', () => {
      try {
        utils.serializeHex('a');
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Cannot serialize hex, must be a Uint8Array');
      }

      try {
        utils.serializeHex([0]);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Cannot serialize hex, must be a Uint8Array');
      }
    });
  });

  describe('#deserializeHex', () => {
    it('deserializes a hex string into a Uint8Array', () => {
      let res;
      let arraysAreEqual;

      res = utils.deserializeHex();
      arraysAreEqual = utils.typedArraysAreEqual(res, new Uint8Array());


      res = utils.deserializeHex('0x00');
      arraysAreEqual = utils.typedArraysAreEqual(res, new Uint8Array([0]));
      assert.isTrue(arraysAreEqual);

      res = utils.deserializeHex('00');
      arraysAreEqual = utils.typedArraysAreEqual(res, new Uint8Array([0]));
      assert.isTrue(arraysAreEqual);

      res = utils.deserializeHex('0x0001022a646566ff');
      arraysAreEqual = utils.typedArraysAreEqual(
        res,
        new Uint8Array([0, 1, 2, 42, 100, 101, 102, 255])
      );
      assert.isTrue(arraysAreEqual);
    });

    it('errors if passed anything other than a string', () => {
      try {
        utils.deserializeHex(5);
        assert(false, 'expected an errror');
      } catch (e) {
        assert.include(e.message, 'Error deserializing hex, must be a string');
      }
    });

    it('errors when passed an odd-length string', () => {
      try {
        utils.deserializeHex('0xabc');
        assert(false, 'expected an errror');
      } catch (e) {
        assert.include(e.message, 'Error deserializing hex, string length is odd');
      }
    });

    it('errors when passed non-hex', () => {
      try {
        utils.deserializeHex('0xQQQQ');
        assert(false, 'expected an errror');
      } catch (e) {
        assert.include(e.message, 'Error deserializing hex, got non-hex byte: QQ');
      }
    });
  });

  describe('#sha256', () => {
    it('returns a sha256 hash', () => {
      for (let i = 0; i < sha256.length; i += 1) {
        const res = utils.sha256(sha256[i].input);
        const arraysAreEqual = utils.typedArraysAreEqual(res, sha256[i].output);
        assert.isTrue(arraysAreEqual);
      }
    });
  });

  describe('#ripemd160', () => {
    it('returns a ripemd160 hash', () => {
      for (let i = 0; i < ripemd160.length; i += 1) {
        const res = utils.ripemd160(ripemd160[i].input);
        const arraysAreEqual = utils.typedArraysAreEqual(res, ripemd160[i].output);
        assert.isTrue(arraysAreEqual);
      }
    });
  });

  describe('#typedArraysAreEqual', () => {
    it('returns true if Uint8Arrays are equal', () => {
      for (let i = 0; i < typedArraysAreEqual.length; i += 1) {
        const { arr1, arr2 } = typedArraysAreEqual[i].input;
        const res = utils.typedArraysAreEqual(arr1, arr2);
        if (typedArraysAreEqual[i].output) {
          assert.isTrue(res);
        } else {
          assert.isFalse(res);
        }
      }
    });
    it('throws error if any arrays are not of type Uint8Array', () => {
      for (let i = 0; i < typedArraysAreEqualError.length; i += 1) {
        const { arr1 } = typedArraysAreEqualError[i].input;
        const arr2 = Array.from(typedArraysAreEqualError[i].input.arr2);
        try {
          utils.typedArraysAreEqual(arr1, arr2);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, typedArraysAreEqualError[i].jsError);
        }
      }
    });
  });

  describe('#safeSlice', () => {
    it('returns a safe slice on an array', () => {
      for (let i = 0; i < 5; i += 1) {
        const { array, start, end } = safeSlice[i].input;
        const res = utils.safeSlice(array, start, end);
        const arraysAreEqual = utils.typedArraysAreEqual(res, safeSlice[i].output);
        assert.isTrue(arraysAreEqual);
      }
    });
    it('error if passed invalid arguments', () => {
      const arr = [1, 2, 3, 4, 5];
      // How can I store this value in json?
      const OUT_OF_RANGE = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);

      // start is a BigInt and is out of range
      try {
        utils.safeSlice(arr, OUT_OF_RANGE);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'BigInt argument out of safe number range');
      }

      // end is a BigInt and is out of range
      try {
        utils.safeSlice(arr, 0, OUT_OF_RANGE);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'BigInt argument out of safe number range');
      }

      for (let i = 0; i < safeSliceError.length; i += 1) {
        const { array, start, end } = safeSliceError[i].input;
        try {
          utils.safeSlice(array, start, end);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, safeSliceError[i].jsError);
        }
      }
    });
  });

  describe('#concatUint8Arrays', () => {
    it('concatenates Uint8Arrays', () => {
      const arr1 = new Uint8Array([255, 255, 255]);
      const arr2 = new Uint8Array([0, 0, 0]);
      const arr3 = new Uint8Array([23, 70, 189]);
      const arrTotal = new Uint8Array([255, 255, 255, 0, 0, 0, 23, 70, 189]);

      let res;
      let arraysAreEqual;

      res = utils.concatUint8Arrays(arr1, arr2, arr3);
      arraysAreEqual = utils.typedArraysAreEqual(res, arrTotal);
      assert.isTrue(arraysAreEqual);

      res = utils.concatUint8Arrays(arr1);
      arraysAreEqual = utils.typedArraysAreEqual(res, arr1);
      assert.isTrue(arraysAreEqual);

      res = utils.concatUint8Arrays();
      arraysAreEqual = utils.typedArraysAreEqual(res, new Uint8Array([]));
      assert.isTrue(arraysAreEqual);
    });
    it('throws error if arguments are not Uint8Arrays', () => {
      const arr1 = [255, 255, 255];
      const arr2 = [0, 0, 0];
      const arr3 = [23, 70, 189];
      try {
        utils.concatUint8Arrays(arr1, arr2, arr3);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Arrays must be of type Uint8Array');
      }

      try {
        utils.concatUint8Arrays(arr1, { arr: [1] }, arr3);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Arrays must be of type Uint8Array');
      }
    });
  });
});
