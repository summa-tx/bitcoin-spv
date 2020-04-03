/* globals it describe */

import * as chai from 'chai';
import * as utils from '../src/utils';
import * as sighash from '../src/sighash';

const { assert } = chai;

describe('sighash functions', () => {
  it('validates the sighash flag', () => {
    assert.isTrue(sighash.validateFlag(0x01));
    assert.isTrue(sighash.validateFlag(0x81));
    assert.isTrue(sighash.validateFlag(0x03));
    assert.isTrue(sighash.validateFlag(0x83));
    for (let i = 4; i < 0x81; i += 1) {
      assert.isFalse(sighash.validateFlag(i));
    }
  });

  it('does hashOutputs', () => {
    assert(utils.typedArraysAreEqual(sighash.hashOutputs([], 0x02), sighash.NULL_HASH));
  });

  it('finds possible absolute locks', () => {
    const blankInput = new Uint8Array(36 + 1 + 4);
    assert.isTrue(sighash.possibleAbsoluteLock([], [], 0x80));
    assert.isFalse(sighash.possibleAbsoluteLock([], [], 0x01));
    assert.isTrue(sighash.possibleAbsoluteLock(
      [blankInput],
      sighash.U32_MAX,
      0x01
    ));
    assert.isTrue(sighash.possibleAbsoluteLock(
      [blankInput],
      new Uint8Array([0x80, 0xf0, 0xfa, 0x02]),
      0x01
    ));
    assert.isFalse(sighash.possibleAbsoluteLock(
      [blankInput],
      new Uint8Array([0x80, 0xf0, 0, 0]),
      0x01
    ));
  });

  it('finds possible relative locks', () => {
    const blankInput = new Uint8Array(36 + 1 + 4);
    const withMaxSeq = utils.concatUint8Arrays(
      new Uint8Array(36 + 1),
      sighash.U32_MAX
    );
    assert.isFalse(sighash.possibleRelativeLock([], [1]));
    assert.isTrue(sighash.possibleRelativeLock([blankInput], [2]));
    assert.isFalse(sighash.possibleRelativeLock([withMaxSeq], [2]));
  });

  describe('sighash', () => {
    it('errors on invalid flags', () => {
      try {
        sighash.sighash({}, 0, 0xff);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Invalid sighash flag');
      }
    });

    it('errors on invalid vin', () => {
      try {
        sighash.sighash({ vin: new Uint8Array(3) }, 0, 0x01);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Malformatted vin');
      }
    });

    it('errors on invalid vout', () => {
      const blankVin = utils.concatUint8Arrays(
        new Uint8Array([0x01]),
        new Uint8Array(36 + 1 + 4)
      );
      try {
        sighash.sighash({
          vin: blankVin,
          vout: new Uint8Array(3)
        },
        0,
        0x01);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Malformatted vout');
      }
    });
  });

  describe('deserAndSighash', () => {
    it('calculates BIP143 sighash digests', () => {
      const tx = {
        version: '0x02000000',
        vin: '0x02ee9242c89e79ab2aa537408839329895392b97505b3496d5543d6d2f531b94d20000000000fdffffffee9242c89e79ab2aa537408839329895392b97505b3496d5543d6d2f531b94d20000000000fdffffff',
        vout: '0x0273d301000000000017a914bba5acbec4e6e3374a0345bf3609fa7cfea825f18773d301000000000017a914bba5acbec4e6e3374a0345bf3609fa7cfea825f187',
        locktime: '0xcafd0700'
      };
      const prevoutScript = '0x160014758ce550380d964051086798d6546bebdca27a73';
      const prevoutValue = '0xc0d4010000000000';

      const expectedAll = '0x75385c87ece4980b581cfd71bc5814f607801a87f6e0973c63dc9fda465c19c4';
      const ALL = sighash.rpcSighash({
        tx, index: 1, sighashFlag: 0x01, prevoutScript, prevoutValue
      });
      assert.strictEqual(ALL.digest, expectedAll);

      const expectedAllACP = '0xbc55c4303c82cdcc8e290c597a00d662ab34414d79ec15d63912b8be7fe2ca3c';
      const ALL_ACP = sighash.rpcSighash({
        tx, index: 1, sighashFlag: 0x81, prevoutScript, prevoutValue
      });
      assert.strictEqual(ALL_ACP.digest, expectedAllACP);

      const expectedSingle = '0x9d57bf7af01a4e0baa57e749aa193d37a64e3bbc08eb88af93944f41af8dfc70';
      const SINGLE = sighash.rpcSighash({
        tx, index: 1, sighashFlag: 0x03, prevoutScript, prevoutValue
      });
      assert.strictEqual(SINGLE.digest, expectedSingle);

      const expectedSingleACP = '0xffea9cdda07170af9bc9967cedf485e9fe15b78a622e0c196c0b6fc64f40c615';
      const SINGLE_ACP = sighash.rpcSighash({
        tx, index: 1, sighashFlag: 0x83, prevoutScript, prevoutValue
      });
      assert.strictEqual(SINGLE_ACP.digest, expectedSingleACP);
    });

    it('does another set of bip143 sighash digests', () => {
      const tx = {
        version: '0x02000000',
        vin: '0x01ee9242c89e79ab2aa537408839329895392b97505b3496d5543d6d2f531b94d20000000000fdffffff',
        vout: '0x0173d301000000000017a914bba5acbec4e6e3374a0345bf3609fa7cfea825f187',
        locktime: '0xcafd0700'
      };
      const prevoutScript = '0x160014758ce550380d964051086798d6546bebdca27a73';
      const prevoutValue = '0xc0d4010000000000';

      const expectedAll = '0x135754ab872e4943f7a9c30d6143c4c7187e33d0f63c75ec82a7f9a15e2f2d00';
      const ALL = sighash.rpcSighash({
        tx, index: 0, sighashFlag: 0x01, prevoutScript, prevoutValue
      });
      assert.strictEqual(ALL.digest, expectedAll);

      const expectedAllACP = '0xcc7438d5b15e93ba612dcd227cf1937c35273675b3aa7d1b771573667376ddf6';
      const ALL_ACP = sighash.rpcSighash({
        tx, index: 0, sighashFlag: 0x81, prevoutScript, prevoutValue
      });
      assert.strictEqual(ALL_ACP.digest, expectedAllACP);

      const expectedSingle = '0xd04631d2742e6fd8e80e2e4309dece65becca41d37fd6bc0bcba041c52d824d5';
      const SINGLE = sighash.rpcSighash({
        tx, index: 0, sighashFlag: 0x03, prevoutScript, prevoutValue
      });
      assert.strictEqual(SINGLE.digest, expectedSingle);

      const expectedSingleACP = '0xffea9cdda07170af9bc9967cedf485e9fe15b78a622e0c196c0b6fc64f40c615';
      const SINGLE_ACP = sighash.rpcSighash({
        tx, index: 0, sighashFlag: 0x83, prevoutScript, prevoutValue
      });
      assert.strictEqual(SINGLE_ACP.digest, expectedSingleACP);
    });
  });
});
