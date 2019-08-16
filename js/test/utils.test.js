/* global BigInt describe it */

import * as chai from 'chai';
import * as utils from '../utils/utils';
import * as vectors from '../../testVectors.json';

let vectorObj = JSON.parse(JSON.stringify(vectors));

utils.parseJson(vectorObj)

let {
  LAST_BYTES,
  REVERSE_ENDIANNESS,
  LARGE_BYTES,
  HASH
} = vectorObj;

const { assert } = chai;

describe('utils', () => {
  describe('#lastBytes', () => {
    it('gets the last bytes correctly', () => {
      const res = utils.lastBytes(LAST_BYTES.INPUT, 2);
      const arraysAreEqual = utils.typedArraysAreEqual(res, LAST_BYTES.OUTPUT);
      assert.isTrue(arraysAreEqual);
    });

    it('errors if slice is larger than the bytearray', () => {
      try {
        utils.lastBytes(new Uint8Array([0]), 2);
        assert(false, 'expected an errror');
      } catch (e) {
        assert.include(e.message, 'Slice must not use negative indexes');
      }
    });
  });

  describe('reverseEndianness', () => {
    it('reverses endianness', () => {
      let res;
      let arraysAreEqual;

      res = utils.reverseEndianness(REVERSE_ENDIANNESS[0].BE);
      arraysAreEqual = utils.typedArraysAreEqual(res, REVERSE_ENDIANNESS[0].LE);
      assert.isTrue(arraysAreEqual);

      res = utils.reverseEndianness(REVERSE_ENDIANNESS[1].BE);
      arraysAreEqual = utils.typedArraysAreEqual(res, REVERSE_ENDIANNESS[1].LE);
      assert.isTrue(arraysAreEqual);
    });
  });

  describe('#bytesToUint', () => {
    it('converts big-endian bytes to integers', () => {
      let res = utils.bytesToUint(new Uint8Array([0]));
      assert.equal(res, BigInt(0));

      res = utils.bytesToUint(new Uint8Array([255]));
      assert.equal(res, BigInt(255));

      res = utils.bytesToUint(new Uint8Array([0, 255]));
      assert.equal(res, BigInt(255));

      res = utils.bytesToUint(new Uint8Array([255, 0]));
      assert.equal(res, BigInt(65280));

      res = utils.bytesToUint(new Uint8Array([1]));
      assert.equal(res, BigInt(1));

      res = utils.bytesToUint(new Uint8Array([0, 1]));
      assert.equal(res, BigInt(1));

      res = utils.bytesToUint(new Uint8Array([1, 0]));
      assert.equal(res, BigInt(256));

      // max uint256: (2^256)-1
      res = utils.bytesToUint(LARGE_BYTES);
      assert.equal(res, BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'));
    });
  });

  describe('#serializeHex', () => {
    it('serializes a Uint8Array into a hex string', () => {
      let res;

      res = utils.serializeHex(new Uint8Array([]));
      assert.equal(res, '');

      res = utils.serializeHex();
      assert.equal(res, '');

      res = utils.serializeHex(new Uint8Array([0, 1, 2, 42, 100, 101, 102, 255]));
      assert.equal(res, '0x0001022a646566ff');
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
  });

  describe('#sha256', () => {
    it('returns a sha256 hash', () => {
      let res;
      let arraysAreEqual;
      res = utils.sha256(HASH.SHA_256[0].PRE_IMAGE);
      arraysAreEqual = utils.typedArraysAreEqual(res, HASH.SHA_256[0].DIGEST);
      assert.isTrue(arraysAreEqual);

      res = utils.sha256(new Uint8Array([]));
      arraysAreEqual = utils.typedArraysAreEqual(res, HASH.SHA_256[1].DIGEST);
      assert.isTrue(arraysAreEqual);
    });
  });

  describe('#ripemd160', () => {
    it('returns a ripemd160 hash', () => {
      let res;
      let arraysAreEqual;

      res = utils.ripemd160(new Uint8Array([0]));
      arraysAreEqual = utils.typedArraysAreEqual(res, HASH.RIPEMD_160[0].DIGEST);
      assert.isTrue(arraysAreEqual);

      res = utils.ripemd160(HASH.RIPEMD_160[1].PRE_IMAGE);
      arraysAreEqual = utils.typedArraysAreEqual(res, HASH.RIPEMD_160[1].DIGEST);
      assert.isTrue(arraysAreEqual);
    });
  });

  describe('#typedArraysAreEqual', () => {
    it('returns true if Uint8Arrays are equal', () => {
      const arr1 = new Uint8Array([255, 255, 255]);
      const arr2 = new Uint8Array([255, 255, 255]);
      const res = utils.typedArraysAreEqual(arr1, arr2);
      assert.isTrue(res);
    });
    it('returns false if Uint8Arrays are not equal', () => {
      const arr1 = new Uint8Array([255, 255, 254]);
      const arr2 = new Uint8Array([255, 255, 255]);
      const res = utils.typedArraysAreEqual(arr1, arr2);
      assert.isFalse(res);
    });
    it('throws error if any arrays are not of type Uint8Array', () => {
      const arr1 = new Uint8Array([255, 255, 255]);
      const arr2 = [255, 255, 255];
      try {
        utils.typedArraysAreEqual(arr1, arr2);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Arrays must be of type Uint8Array');
      }
    });
    it('returns false if Uint8Arrays lengths are not equal', () => {
      const arr1 = new Uint8Array([255, 255]);
      const arr2 = new Uint8Array([255, 255, 255]);
      const res = utils.typedArraysAreEqual(arr1, arr2);
      assert.isFalse(res);
    });
  });

  describe('#safeSlice', () => {
    it('returns a safe slice on an array', () => {
      const arr = new Uint8Array([1, 2, 3, 4, 5]);
      let res;
      let arraysAreEqual;

      // regular slice
      res = utils.safeSlice(arr, 0, 3);
      arraysAreEqual = utils.typedArraysAreEqual(res, new Uint8Array([1, 2, 3]));
      assert.isTrue(arraysAreEqual);

      // slice that copies the original array
      res = utils.safeSlice(arr);
      arraysAreEqual = utils.typedArraysAreEqual(res, arr);
      assert.isTrue(arraysAreEqual);

      // slice with start index, but not end index
      res = utils.safeSlice(arr, 2);
      arraysAreEqual = utils.typedArraysAreEqual(res, new Uint8Array([3, 4, 5]));
      assert.isTrue(arraysAreEqual);
    });
    it('uses default values', () => {
      const arr = new Uint8Array([1, 2, 3, 4, 5]);
      let res;
      let arraysAreEqual;

      // default end
      res = utils.safeSlice(arr, 3);
      arraysAreEqual = utils.typedArraysAreEqual(res, new Uint8Array([4, 5]));
      assert.isTrue(arraysAreEqual);

      // default start
      res = utils.safeSlice(arr, null, 3);
      arraysAreEqual = utils.typedArraysAreEqual(res, new Uint8Array([1, 2, 3]));
      assert.isTrue(arraysAreEqual);
    });
    it('error if passed invalid arguments', () => {
      const arr = [1, 2, 3, 4, 5];
      const OUT_OF_RANGE = BigInt(Number.MAX_SAFE_INTEGER + 1);

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

      // end number is greater than the length of the array
      try {
        utils.safeSlice(arr, 0, 6);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Tried to slice past end of array');
      }

      // start is a negative number
      try {
        utils.safeSlice(arr, -1, 3);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Slice must not use negative indexes');
      }

      // end is a negative number
      try {
        utils.safeSlice(arr, 2, -1);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Slice must not use negative indexes');
      }

      // start is greater than end
      try {
        utils.safeSlice(arr, 4, 3);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Slice must not have 0 length');
      }

      // start and end are the same
      try {
        utils.safeSlice(arr, 4, 4);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Slice must not have 0 length');
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
