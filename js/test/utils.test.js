/* global BigInt describe it */

import * as chai from 'chai';
import * as utils from '../utils/utils';

const { assert } = chai;

describe('utils', () => {
  describe('#lastBytes', () => {
    it('gets the last bytes correctly', () => {
      const res = utils.lastBytes(utils.deserializeHex('0x00112233'), 2);
      const arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0x2233'));
      assert.isTrue(arraysAreEqual);
    });

    it('errors if slice is larger than the bytearray', () => {
      try {
        utils.lastBytes(utils.deserializeHex('0x00'), 2);
        assert(false, 'expected an errror');
      } catch (e) {
        assert.include(e.message, 'Underflow during subtraction.');
      }
    });
  });

  describe('reverseEndianness', () => {
    it('reverses endianness', () => {
      let res;
      let arraysAreEqual;
      res = utils.reverseEndianness(utils.deserializeHex('0x00112233'));
      arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0x33221100'));
      assert.isTrue(arraysAreEqual);

      res = utils.reverseEndianness(utils.deserializeHex('0x0123456789abcdef'));
      arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0xefcdab8967452301'));
      assert.isTrue(arraysAreEqual);
    });
  });

  describe('#bytesToUint', () => {
    it('converts big-endian bytes to integers', () => {
      let res = utils.bytesToUint(utils.deserializeHex('0x00'));
      assert.equal(res, BigInt(0));

      res = utils.bytesToUint(utils.deserializeHex('0xff'));
      assert.equal(res, BigInt(255));

      res = utils.bytesToUint(utils.deserializeHex('0x00ff'));
      assert.equal(res, BigInt(255));

      res = utils.bytesToUint(utils.deserializeHex('0xff00'));
      assert.equal(res, BigInt(65280));

      res = utils.bytesToUint(utils.deserializeHex('0x01'));
      assert.equal(res, BigInt(1));

      res = utils.bytesToUint(utils.deserializeHex('0x0001'));
      assert.equal(res, BigInt(1));

      res = utils.bytesToUint(utils.deserializeHex('0x0100'));
      assert.equal(res, BigInt(256));

      // max uint256: (2^256)-1
      res = utils.bytesToUint(utils.deserializeHex('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'));
      assert.equal(res, BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'));
    });
  });

  describe('#serializeHex', () => {
    it('serializes a Uint8Array into a hex string', () => {

    });
    // empty string
    // not a hex string
  });

  describe('#deserializeHex', () => {
    it('deserializes a hex string into a Uint8Array');
    // empty array
    // not a uint8array
  });

  describe('#sha256', () => {
    it('returns a sha256 hash', () => {
      // returns false. are values wrong??? Erin halp!
      const res = utils.sha256(utils.deserializeHex('0x00'));
      const arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('c4dd67368286d02d62bdaa7a775b7594765d5210c9ad20cc3c24148d493353d7'));
      assert.isTrue(arraysAreEqual);
    });
  });

  describe('#ripemd160', () => {
    it('returns a ripemd160 hash');
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
    // return false if Uint8Arrays are not equal
  });

  describe('#safeSlice', () => {
    it('returns a safe slice on an array');
    // throws RangeError("BigInt argument out of safe number range") if `first` is out of range
    // throws RangeError("BigInt argument out of safe number range") if `last` is out of range
    // throws Error("Underflow during subtraction.") if `first` is less than 0 // unecessary???
    // throws Error("Underflow during subtraction.") if `last` is less than 0 // unecessary???
    // throws Error("Tried to slice past end of array") if `end` if larger than array length
    // throws Error("Slice must not use negative indexes") if `start` is negative
    // throws Error("Slice must not use negative indexes") if `end` is negative
    // throws Error("Slice must not have 0 length") is `start` is greater than or equal to `end`
  });

  describe('#concatUint8Arrays', () => {
    it('concatenates Uint8Arrays', () => {
      const arr1 = new Uint8Array([255, 255, 255]);
      const arr2 = new Uint8Array([0, 0, 0]);
      const arr3 = new Uint8Array([23, 70, 189]);
      const arrTotal = new Uint8Array([255, 255, 255, 0, 0, 0, 23, 70, 189]);
      const res = utils.concatUint8Arrays(arr1, arr2, arr3);
      const arraysAreEqual = utils.typedArraysAreEqual(res, arrTotal);
      assert.isTrue(arraysAreEqual);
    });
    // only one array
    // no arguments
    // input is not arrays
  });
});
