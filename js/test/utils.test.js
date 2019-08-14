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
});
