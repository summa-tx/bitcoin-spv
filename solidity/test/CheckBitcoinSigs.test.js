/* global artifacts contract describe before it assert */
const constants = require('./constants');

const CheckBitcoinSigs = artifacts.require('CheckBitcoinSigsTest');


contract('CheckBitcoinSigs', async () => {
  let instance;

  const pubkey = '0x4f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa385b6b1b8ead809ca67454d9683fcf2ba03456d6fe2c4abe2b07f0fbdbb2f1c1';
  const digest = '0x02d449a31fbb267c8f352e9968a79e3e5fc95c1bbeaa502fd6454ebde5a4bedc';
  const v = 27;
  const r = '0xd7e83e8687ba8b555f553f22965c74e81fd08b619a7337c5c16e4b02873b537e';
  const s = '0x633bf745cdf7ae303ca8a6f41d71b2c3a21fcbd1aed9e7ffffa295c08918c1b3';

  before(async () => {
    instance = await CheckBitcoinSigs.new();
  });

  describe('#accountFromPubkey', async () => {
    it('generates an account from a pubkey', async () => {
      const res = await instance.accountFromPubkey('0x33333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333');
      assert.equal(res.toLowerCase(), '0x183671cd69c7f9a760f9f1c59393df69e893e557');
    });

    it('errors if the input length is wrong', async () => {
      try {
        await instance.accountFromPubkey('0x33');
        assert(false, 'Expected an error');
      } catch (e) {
        assert.include(e.message, 'Pubkey must be 64-byte raw, uncompressed key.');
      }
    });
  });

  describe('#p2wpkhFromPubkey', async () => {
    const uncompressed = '0x3c72addb4fdf09af94f0c94d7fe92a386a7e70cf8a1d85916386bb2535c7b1b13b306b0fe085665d8fc1b28ae1676cd3ad6e08eaeda225fe38d0da4de55703e0';
    const compressed = '0x023c72addb4fdf09af94f0c94d7fe92a386a7e70cf8a1d85916386bb2535c7b1b1';
    const outputScript = '0x00143bc28d6d92d9073fb5e3adf481795eaf446bceed';

    it('handles unprefixed uncompressed keys', async () => {
      const res = await instance.p2wpkhFromPubkey(uncompressed);
      assert.equal(res, outputScript);
    });

    it('handles compressed keys', async () => {
      const res = await instance.p2wpkhFromPubkey(compressed);
      assert.equal(res, outputScript);
    });

    it('errors on non-standard key formats', async () => {
      try {
        await instance.p2wpkhFromPubkey('0x');
        assert(false);
      } catch (e) {
        assert.include(e.message, 'CheckBitcoinSigs/p2wpkhFromPubkey -- Invalid pubkey length. expected 64 or 33');
      }
    });
  });

  describe('#checkSig', async () => {
    // signing the sha 256 of '11' * 32
    // signing with privkey '11' * 32
    // using RFC 6979 nonce (libsecp256k1)
    it('validates signatures', async () => {
      const res = await instance.checkSig(pubkey, digest, v, r, s);
      assert.isTrue(res);
    });

    it('fails on bad signatures', async () => {
      const res = await instance.checkSig(pubkey, digest, 28, r, s);
      assert.isFalse(res);
    });

    it('errors on weird pubkey lengths', async () => {
      try {
        await instance.checkSig('0x00', constants.EMPTY, 1, constants.EMPTY, constants.EMPTY);
      } catch (e) {
        assert.include(e.message, 'Requires uncompressed unprefixed pubkey');
      }
    });
  });

  describe('#checkBitcoinSig', async () => {
    const witnessScript = '0x0014fc7250a211deddc70ee5a2738de5f07817351cef';
    it('returns false if the pubkey does not match the witness script', async () => {
      const res = await instance.checkBitcoinSig('0x00', pubkey, constants.EMPTY, 1, constants.EMPTY, constants.EMPTY);
      assert.isFalse(res);
    });

    it('returns true if the signature is valid and matches the script', async () => {
      const res = await instance.checkBitcoinSig(witnessScript, pubkey, digest, v, r, s);
      assert.isTrue(res);
    });

    it('returns false if the signature is invalid', async () => {
      const res = await instance.checkBitcoinSig(witnessScript, pubkey, digest, v + 1, r, s);
      assert.isFalse(res);
    });

    it('errors on weird pubkey lengths', async () => {
      try {
        await instance.checkBitcoinSig('0x00', '0x00', constants.EMPTY, 1, constants.EMPTY, constants.EMPTY);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Requires uncompressed unprefixed pubkey');
      }
    });
  });

  describe('#isSha256Preimage', async () => {
    it('identifies sha256 preimages', async () => {
      let res;
      res = await instance.isSha256Preimage('0x01', '0x4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a');
      assert.isTrue(res);
      res = await instance.isSha256Preimage('0x02', '0xdbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986');
      assert.isTrue(res);
      res = await instance.isSha256Preimage('0x03', '0x084fed08b978af4d7d196a7446a86b58009e636b611db16211b65a9aadff29c5');
      assert.isTrue(res);
      res = await instance.isSha256Preimage('0x04', '0x084fed08b978af4d7d196a7446a86b58009e636b611db16211b65a9aadff29c5');
      assert.isFalse(res);
    });
  });

  describe('#isKeccak256Preimage', async () => {
    it('identifies keccak256 preimages', async () => {
      let res;
      res = await instance.isKeccak256Preimage('0x01', '0x5fe7f977e71dba2ea1a68e21057beebb9be2ac30c6410aa38d4f3fbe41dcffd2');
      assert.isTrue(res);
      res = await instance.isKeccak256Preimage('0x02', '0xf2ee15ea639b73fa3db9b34a245bdfa015c260c598b211bf05a1ecc4b3e3b4f2');
      assert.isTrue(res);
      res = await instance.isKeccak256Preimage('0x03', '0x69c322e3248a5dfc29d73c5b0553b0185a35cd5bb6386747517ef7e53b15e287');
      assert.isTrue(res);
      res = await instance.isKeccak256Preimage('0x04', '0x69c322e3248a5dfc29d73c5b0553b0185a35cd5bb6386747517ef7e53b15e287');
      assert.isFalse(res);
    });
  });

  describe('#oneInputOneOutputSighash', async () => {
    // the TX produced will be:
    /* eslint-disable-next-line */
    // 01000000000101333333333333333333333333333333333333333333333333333333333333333333333333000000000001111111110000000016001433333333333333333333333333333333333333330000000000
    // the sighash preimage will be:
    /* eslint-disable-next-line */
    // 010000003fc8fd9fada5a3573744477d5e35b0d4d0645e42285e3dec25aac02078db0f838cb9012517c817fead650287d61bdd9c68803b6bf9c64133dcab3e65b5a50cb93333333333333333333333333333333333333333333333333333333333333333333333331976a9145eb9b5e445db673f0ed8935d18cd205b214e518788ac111111111111111100000000e4ca7a168bd64e3123edd7f39e1ab7d670b32311cac2dda8e083822139c7936c0000000001000000
    const outpoint = '0x333333333333333333333333333333333333333333333333333333333333333333333333';
    const inputPKH = '0x5eb9b5e445db673f0ed8935d18cd205b214e5187'; // pubkey is '02' + '33'.repeat(32)
    const inputValue = '0x1111111111111111';
    const outputValue = '0x1111111100000000';
    const outputPKH = '0x3333333333333333333333333333333333333333';
    const sighash = '0xb68a6378ddb770a82ae4779a915f0a447da7d753630f8dd3b00be8638677dd90';

    // the signer pkh will be:
    // 5eb9b5e445db673f0ed8935d18cd205b214e5187
    // == hash160(023333333333333333333333333333333333333333333333333333333333333333)

    it('calculates the sighash of a bizarre transaction that for some reason we need ;)', async () => {
      const res = await instance.oneInputOneOutputSighash(
        outpoint,
        inputPKH,
        inputValue,
        outputValue,
        outputPKH
      );
      assert.equal(res, sighash);
    });
  });
});
