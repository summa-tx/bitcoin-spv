/* global artifacts contract describe before it assert */
/* eslint-disable no-underscore-dangle */
// const BN = require('bn.js');
const assert = require('chai').assert;

const ValidateSPV = require('../contracts-js/ValidateSPV');
const utils = require('./utils');
const btcUtils = require('../utils/utils');
const constants = require('./constants');

const OP_RETURN = constants.OP_RETURN;
const HEADER_ERR = constants.HEADER_ERR;

const INPUT_TYPES = {
  NONE: 0,
  LEGACY: 1,
  COMPATIBILITY: 2,
  WITNESS: 3
}

describe('ValidateSPV', () => {
  describe('#error constants', async () => {
    it('tests the constant getters for that sweet sweet coverage', async () => {
      let res = await ValidateSPV.getErrBadLength();
      assert.equal(res, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16));

      res = await ValidateSPV.getErrInvalidChain();
      assert.equal(res, BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe', 16));

      res = await ValidateSPV.getErrLowWork();
      assert.equal(res, BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd', 16));
    });
  });

  describe('#prove', async () => {
    it('returns true if proof is valid', async () => {
      const res = await ValidateSPV.prove(
        btcUtils.deserializeHex(OP_RETURN.TXID_LE),
        btcUtils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE),
        btcUtils.deserializeHex(OP_RETURN.PROOF),
        OP_RETURN.PROOF_INDEX
      );
      assert.isTrue(res);
      // assert.equal(res, [0,0,0])
    });

    it('shortcuts the coinbase special case', async () => {
      const res = await ValidateSPV.prove(
        btcUtils.deserializeHex(OP_RETURN.TXID_LE),
        btcUtils.deserializeHex(OP_RETURN.TXID_LE),
        new Uint8Array(),
        0
      );
      assert.isTrue(res);
    });

    it('returns false if Merkle root is invalid', async () => {
      const res = await ValidateSPV.prove(
        btcUtils.deserializeHex(OP_RETURN.TXID_LE),
        btcUtils.deserializeHex(OP_RETURN.TXID_LE),
        btcUtils.deserializeHex(OP_RETURN.PROOF),
        OP_RETURN.PROOF_INDEX
      );
      assert.isFalse(res);
    });
  });

  describe('#calculateTxId', async () => {
    it('returns the transaction hash', async () => {
      const res = await ValidateSPV.calculateTxId(
        btcUtils.deserializeHex(OP_RETURN.VERSION),
        btcUtils.deserializeHex(OP_RETURN.VIN),
        btcUtils.deserializeHex(OP_RETURN.VOUT),
        btcUtils.deserializeHex(OP_RETURN.LOCKTIME_LE)
      );
      let arraysAreEqual = btcUtils.typedArraysAreEqual(res, btcUtils.deserializeHex(OP_RETURN.TXID_LE))
      assert.isTrue(arraysAreEqual);
    });
  });

  describe.only('#parseInput', async () => {
    const input = btcUtils.deserializeHex('0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab3750000000000ffffffff');
    const legacyInput = btcUtils.deserializeHex('0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab375000000000101ffffffff');
    const compatibilityWSHInput = btcUtils.deserializeHex('0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab37500000000220020eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeffffffff');
    const compatibilityWPKHInput = btcUtils.deserializeHex('0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab37500000000160014eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeffffffff');
    const sequence = 4294967295n;
    const index = 0n;
    const outpointTxId = btcUtils.deserializeHex('0x75b37afaab896321d175acdccd7cb7c79737c09d2f0a2baf13bf9e2bf3b8b27b');

    it('returns the tx input sequence and outpoint', async () => {
      const txIn = await ValidateSPV.parseInput(input);

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(btcUtils.typedArraysAreEqual(txIn.inputId, outpointTxId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, INPUT_TYPES.WITNESS);
    });

    it('handles Legacy inputs', async () => {
      const txIn = await ValidateSPV.parseInput(legacyInput);

      assert.equal(txIn.sequence, sequence);
      assert.equal(txIn.hash, outpointTxId);
      assert.equal(txIn.index, index);
      assert.equal(txIn.inputType, new BN(utils.INPUT_TYPES.LEGACY, 10));
    });

    it('handles p2wpkh-via-p2sh compatibility inputs', async () => {
      const txIn = await ValidateSPV.parseInput(compatibilityWPKHInput);

      assert.equal(txIn.sequence, sequence);
      assert.equal(txIn.hash, outpointTxId);
      assert.equal(txIn.index, index);
      assert.equal(txIn.inputType, BigInt(utils.INPUT_TYPES.COMPATIBILITY, 10));
    });

    it('handles p2wsh-via-p2sh compatibility inputs', async () => {
      const txIn = await ValidateSPV.parseInput(compatibilityWSHInput);

      assert.equal(txIn.sequence, sequence);
      assert.equal(txIn.hash, outpointTxId);
      assert.equal(txIn.index, index);
      assert.equal(txIn.inputType, BigInt(utils.INPUT_TYPES.COMPATIBILITY, 10));
    });
  });

  describe('#parseOutput', async () => {
    it('returns the tx output value, output type, and payload for an OP_RETURN output', async () => {
      const opReturnTxOut = await ValidateSPV.parseOutput(
        btcUtils.deserializeHex(OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT)
      );

      const value = BigInt(String(OP_RETURN.INDEXED_OUTPUTS[1].VALUE), 10);

      assert.equal(opReturnTxOut.value, value);
      assert.equal(opReturnTxOut.outputType, utils.OUTPUT_TYPES.OP_RETURN);
      assert.equal(opReturnTxOut.payload, OP_RETURN.INDEXED_OUTPUTS[1].PAYLOAD);
    });

    it('returns the tx output value, output type, and payload for an WPKH output', async () => {
      const output = btcUtils.deserializeHex('0xe8cd9a3b000000001600147849e6bf5e4b1ba7235572d1b0cbc094f0213e6c');
      const value = 1000001000n;
      const payload = btcUtils.deserializeHex('0x7849e6bf5e4b1ba7235572d1b0cbc094f0213e6c');

      const wpkhOutput = await ValidateSPV.parseOutput(output);

      assert.equal(wpkhOutput.value, value);
      assert.equal(wpkhOutput.outputType, utils.OUTPUT_TYPES.WPKH);
      assert.equal(wpkhOutput.payload, payload);
    });

    it('returns the tx output value, output type, and payload for an WSH output', async () => {
      const output = btcUtils.deserializeHex('0x40420f0000000000220020aedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c91922');
      const value = 1000000n;
      const payload = '0xaedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c91922';

      const wshOutput = await ValidateSPV.parseOutput(output);

      assert.equal(wshOutput.value, value);
      assert.equal(wshOutput.outputType, utils.OUTPUT_TYPES.WSH);
      assert.equal(wshOutput.payload, payload);
    });

    it('shows non-standard if the tx output type is not identifiable', async () => {
      // Changes 0x6a (OP_RETURN) to 0x7a to create error
      const output = btcUtils.deserializeHex('0x0000000000000000167a14edb1b5c2f39af0fec151732585b1049b07895211');

      const nonstandardOutput = await ValidateSPV.parseOutput(output);

      assert.equal(0n, nonstandardOutput.value);
      assert.equal(nonstandardOutput.outputType, utils.OUTPUT_TYPES.NONSTANDARD);
      assert.isNull(nonstandardOutput.payload);
    });

    it('returns the tx output value, output type, and payload for an SH output', async () => {
      const output = btcUtils.deserializeHex('0xe8df05000000000017a914a654ebafa7a37e04a7ec3f684e34897e48f0496287');
      const value = 385000n;
      const payload = btcUtils.deserializeHex('0xa654ebafa7a37e04a7ec3f684e34897e48f04962');

      const shOutput = await ValidateSPV.parseOutput(output);

      assert.equal(shOutput.value, value);
      assert.equal(shOutput.outputType, utils.OUTPUT_TYPES.SH);
      assert.equal(shOutput.payload, payload);
    });

    it('returns the tx output value, output type, and payload for an PKH output', async () => {
      const output = btcUtils.deserializeHex('0x88080000000000001976a9141458514240d7287e5254af48cd292eb876cb07eb88ac');
      const value = 2184n;
      const payload = btcUtils.deserializeHex('0x1458514240d7287e5254af48cd292eb876cb07eb');
      const pkhOutput = await ValidateSPV.parseOutput(output);

      assert.equal(pkhOutput.value, value);
      assert.equal(pkhOutput.outputType, utils.OUTPUT_TYPES.PKH);
      assert.equal(pkhOutput.payload, payload);
    });
  });

  describe('#parseHeader', async () => {
    it('returns the header digest, version, prevHash, merkleRoot, timestamp, target, and nonce',
      async () => {
        const validHeader = await ValidateSPV.parseHeader(
          btcUtils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].HEADER)
        );

        assert.equal(validHeader.digest, btcUtils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE));
        assert.equal(validHeader.version, OP_RETURN.INDEXED_HEADERS[0].VERSION);
        assert.equal(validHeader.prevHash, btcUtils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].PREV_HASH_LE));
        assert.equal(validHeader.merkleRoot, btcUtils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE));
        assert.equal(validHeader.timestamp, OP_RETURN.INDEXED_HEADERS[0].TIMESTAMP);
        assert.equal(validHeader.target, OP_RETURN.INDEXED_HEADERS[0].TARGET);
        assert.equal(validHeader.nonce, OP_RETURN.INDEXED_HEADERS[0].NONCE);
      });

    it('bubble up errors if input header is not 80 bytes', async () => {
      // Removed a byte from the header version to create error
      const invalidHeader = await ValidateSPV.parseHeader(
        btcUtils.deserializeHex(HEADER_ERR.HEADER_0_LEN)
      );

      assert.equal(btcUtils.deserializeHex(constants.EMPTY), invalidHeader.digest);
      assert.equal(0n, invalidHeader.version);
      assert.equal(btcUtils.deserializeHex(constants.EMPTY), invalidHeader.prevHash);
      assert.equal(btcUtils.deserializeHex(constants.EMPTY), invalidHeader.merkleRoot);
      assert.equal(0n, invalidHeader.timestamp);
      assert.equal(0n, invalidHeader.target);
      assert.equal(0n, invalidHeader.nonce);
    });
  });

  describe('#validateHeaderChain', async () => {
    it('returns true if header chain is valid', async () => {
      const res = await ValidateSPV.validateHeaderChain(btcUtils.deserializeHex(OP_RETURN.HEADER_CHAIN));
      assert.equal (res, 49134394618239n);
    });

    it('throws Error("Header bytes not multiple of 80.") if header chain is not divisible by 80', async () => {
      try {
        const res = await ValidateSPV.validateHeaderChain(btcUtils.deserializeHex(HEADER_ERR.HEADER_CHAIN_INVALID_LEN));
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Header bytes not multiple of 80.');
      }
    });

    it('throws Error("Header bytes not a valid chain.") if header chain prevHash is invalid', async () => {
      try {
        const res = await ValidateSPV.validateHeaderChain(
          btcUtils.deserializeHex(HEADER_ERR.HEADER_CHAIN_INVALID_PREVHASH)
        );
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Header bytes not a valid chain.');
      }
    });

    it('throws Error("Header does not meet its own difficulty target.) if a header does not meet its target', async () => {
      try {
        const res = await ValidateSPV.validateHeaderChain(btcUtils.deserializeHex(HEADER_ERR.HEADER_CHAIN_LOW_WORK));
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Header does not meet its own difficulty target.');
      }
    });
  });

  describe('#validateHeaderWork', async () => {
    it('returns false on an empty digest', async () => {
      const res = await ValidateSPV.validateHeaderWork(btcUtils.deserializeHex(constants.EMPTY), 0);
      assert.isFalse(res);
    });

    it('returns false if the digest has insufficient work', async () => {
      const res = await ValidateSPV.validateHeaderWork(btcUtils.deserializeHex('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'), 1);
      assert.isFalse(res);
    });

    it('returns true if the digest has sufficient work', async () => {
      const res = await ValidateSPV.validateHeaderWork(
        btcUtils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE),
        3840827764407250199942201944063224491938810378873470976n
      );
      assert.isTrue(res);
    });
  });

  describe('#validateHeaderPrevHash', async () => {
    it('returns true if header prevHash is valid', async () => {
      const res = await ValidateSPV.validateHeaderPrevHash(
        btcUtils.deserializeHex(OP_RETURN.INDEXED_HEADERS[1].HEADER),
        btcUtils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].DIGEST_LE)
      );
      assert.isTrue(res);
    });

    it('returns false if header prevHash is invalid', async () => {
      const res = await ValidateSPV.validateHeaderPrevHash(
        btcUtils.deserializeHex(OP_RETURN.INDEXED_HEADERS[1].HEADER),
        btcUtils.deserializeHex(OP_RETURN.INDEXED_HEADERS[1].DIGEST_LE)
      );
      assert.isFalse(res);
    });
  });
});
