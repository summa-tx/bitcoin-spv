/* global describe it BigInt */
import * as chai from 'chai';
import * as utils from '../utils/utils';
import * as constants from './constants';
import * as ValidateSPV from '../lib/ValidateSPV';

const { assert } = chai;

const { OP_RETURN, HEADER_ERR } = constants;

const INPUT_TYPES = {
  NONE: 0,
  LEGACY: 1,
  COMPATIBILITY: 2,
  WITNESS: 3
};

describe('ValidateSPV', () => {
  describe('#prove', () => {
    it('returns true if proof is valid', () => {
      const res = ValidateSPV.prove(
        utils.deserializeHex(OP_RETURN.TXID_LE),
        utils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE),
        utils.deserializeHex(OP_RETURN.PROOF),
        OP_RETURN.PROOF_INDEX
      );
      assert.isTrue(res);
    });

    it('shortcuts the coinbase special case', () => {
      const res = ValidateSPV.prove(
        utils.deserializeHex(OP_RETURN.TXID_LE),
        utils.deserializeHex(OP_RETURN.TXID_LE),
        new Uint8Array(),
        0
      );
      assert.isTrue(res);
    });

    it('returns false if Merkle root is invalid', () => {
      const res = ValidateSPV.prove(
        utils.deserializeHex(OP_RETURN.TXID_LE),
        utils.deserializeHex(OP_RETURN.TXID_LE),
        utils.deserializeHex(OP_RETURN.PROOF),
        OP_RETURN.PROOF_INDEX
      );
      assert.isFalse(res);
    });
  });

  describe('#calculateTxId', () => {
    it('returns the transaction hash', () => {
      const res = ValidateSPV.calculateTxId(
        utils.deserializeHex(OP_RETURN.VERSION),
        utils.deserializeHex(OP_RETURN.VIN),
        utils.deserializeHex(OP_RETURN.VOUT),
        utils.deserializeHex(OP_RETURN.LOCKTIME_LE)
      );
      const arraysAreEqual = utils.typedArraysAreEqual(
        res,
        utils.deserializeHex(OP_RETURN.TXID_LE)
      );
      assert.isTrue(arraysAreEqual);
    });
  });

  describe('#parseInput', () => {
    const input = utils.deserializeHex('0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab3750000000000ffffffff');
    const legacyInput = utils.deserializeHex('0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab375000000000101ffffffff');
    const compatibilityWSHInput = utils.deserializeHex('0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab37500000000220020eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeffffffff');
    const compatibilityWPKHInput = utils.deserializeHex('0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab37500000000160014eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeffffffff');
    const sequence = BigInt(4294967295);
    const index = BigInt(0);
    const outpointTxId = utils.deserializeHex('0x75b37afaab896321d175acdccd7cb7c79737c09d2f0a2baf13bf9e2bf3b8b27b');

    it('returns the tx input sequence and outpoint', () => {
      const txIn = ValidateSPV.parseInput(input);

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, outpointTxId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, INPUT_TYPES.WITNESS);
    });

    it('handles Legacy inputs', () => {
      const txIn = ValidateSPV.parseInput(legacyInput);

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, outpointTxId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, INPUT_TYPES.LEGACY);
    });

    it('handles p2wpkh-via-p2sh compatibility inputs', () => {
      const txIn = ValidateSPV.parseInput(compatibilityWPKHInput);

      assert.equal(txIn.sequence, sequence);
      // assert.equal(txIn.hash, outpointTxId);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, outpointTxId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, INPUT_TYPES.COMPATIBILITY);
    });

    it('handles p2wsh-via-p2sh compatibility inputs', () => {
      const txIn = ValidateSPV.parseInput(compatibilityWSHInput);

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, outpointTxId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, INPUT_TYPES.COMPATIBILITY);
    });
  });

  describe('#parseOutput', () => {
    it('returns the tx output value, output type, and payload for an OP_RETURN output', () => {
      const opReturnTxOut = ValidateSPV.parseOutput(
        utils.deserializeHex(OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT)
      );

      const value = OP_RETURN.INDEXED_OUTPUTS[1].VALUE;

      assert.equal(opReturnTxOut.value, value);
      assert.equal(opReturnTxOut.outputType, utils.OUTPUT_TYPES.OP_RETURN);
      assert.isTrue(
        utils.typedArraysAreEqual(
          opReturnTxOut.payload,
          utils.deserializeHex(OP_RETURN.INDEXED_OUTPUTS[1].PAYLOAD)
        )
      );
    });

    it('returns the tx output value, output type, and payload for an WPKH output', () => {
      const output = utils.deserializeHex('0xe8cd9a3b000000001600147849e6bf5e4b1ba7235572d1b0cbc094f0213e6c');
      const value = BigInt(1000001000);
      const payload = utils.deserializeHex('0x7849e6bf5e4b1ba7235572d1b0cbc094f0213e6c');

      const wpkhOutput = ValidateSPV.parseOutput(output);

      assert.equal(wpkhOutput.value, value);
      assert.equal(wpkhOutput.outputType, utils.OUTPUT_TYPES.WPKH);
      assert.isTrue(utils.typedArraysAreEqual(wpkhOutput.payload, payload));
    });

    it('returns the tx output value, output type, and payload for an WSH output', () => {
      const output = utils.deserializeHex('0x40420f0000000000220020aedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c91922');
      const value = BigInt(1000000);
      const payload = utils.deserializeHex('0xaedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c91922');

      const wshOutput = ValidateSPV.parseOutput(output);

      assert.equal(wshOutput.value, value);
      assert.equal(wshOutput.outputType, utils.OUTPUT_TYPES.WSH);
      assert.isTrue(utils.typedArraysAreEqual(wshOutput.payload, payload));
    });

    it('shows non-standard if the tx output type is not identifiable', () => {
      // Changes 0x6a (OP_RETURN) to 0x7a to create error
      const output = utils.deserializeHex('0x0000000000000000167a14edb1b5c2f39af0fec151732585b1049b07895211');

      const nonstandardOutput = ValidateSPV.parseOutput(output);

      assert.equal(BigInt(0), nonstandardOutput.value);
      assert.equal(nonstandardOutput.outputType, utils.OUTPUT_TYPES.NONSTANDARD);
      assert.isNull(nonstandardOutput.payload);
    });

    it('returns the tx output value, output type, and payload for an SH output', () => {
      const output = utils.deserializeHex('0xe8df05000000000017a914a654ebafa7a37e04a7ec3f684e34897e48f0496287');
      const value = BigInt(385000);
      const payload = utils.deserializeHex('0xa654ebafa7a37e04a7ec3f684e34897e48f04962');

      const shOutput = ValidateSPV.parseOutput(output);

      assert.equal(shOutput.value, value);
      assert.equal(shOutput.outputType, utils.OUTPUT_TYPES.SH);
      assert.isTrue(utils.typedArraysAreEqual(shOutput.payload, payload));
    });

    it('returns the tx output value, output type, and payload for an PKH output', () => {
      const output = utils.deserializeHex('0x88080000000000001976a9141458514240d7287e5254af48cd292eb876cb07eb88ac');
      const value = BigInt(2184);
      const payload = utils.deserializeHex('0x1458514240d7287e5254af48cd292eb876cb07eb');
      const pkhOutput = ValidateSPV.parseOutput(output);

      assert.equal(pkhOutput.value, value);
      assert.equal(pkhOutput.outputType, utils.OUTPUT_TYPES.PKH);
      assert.isTrue(utils.typedArraysAreEqual(pkhOutput.payload, payload));
    });
  });

  describe('#parseHeader', () => {
    it('returns the header digest, version, prevHash, merkleRoot, timestamp, target, and nonce',
      () => {
        const validHeader = ValidateSPV.parseHeader(
          utils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].HEADER)
        );

        assert.isTrue(
          utils.typedArraysAreEqual(
            validHeader.digest,
            utils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE)
          )
        );
        assert.equal(validHeader.version, OP_RETURN.INDEXED_HEADERS[0].VERSION);
        assert.isTrue(
          utils.typedArraysAreEqual(
            validHeader.prevHash,
            utils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].PREV_HASH_LE)
          )
        );
        assert.isTrue(
          utils.typedArraysAreEqual(
            validHeader.merkleRoot,
            utils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE)
          )
        );
        assert.equal(validHeader.timestamp, OP_RETURN.INDEXED_HEADERS[0].TIMESTAMP);
        assert.equal(validHeader.target, OP_RETURN.INDEXED_HEADERS[0].TARGET);
        assert.equal(validHeader.nonce, OP_RETURN.INDEXED_HEADERS[0].NONCE);
      });

    it('throws errors if input header is not 80 bytes', () => {
      // Removed a byte from the header version to create error
      try {
        ValidateSPV.parseHeader(utils.deserializeHex(HEADER_ERR.HEADER_0_LEN));
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Malformatted header. Must be exactly 80 bytes.');
      }
    });
  });

  describe('#validateHeaderChain', () => {
    it('returns true if header chain is valid', () => {
      const res = ValidateSPV.validateHeaderChain(utils.deserializeHex(OP_RETURN.HEADER_CHAIN));
      assert.equal(res, BigInt('49134394618239'));
    });

    it('throws Error("Header bytes not multiple of 80.") if header chain is not divisible by 80', () => {
      try {
        ValidateSPV.validateHeaderChain(utils.deserializeHex(HEADER_ERR.HEADER_CHAIN_INVALID_LEN));
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Header bytes not multiple of 80.');
      }
    });

    it('throws Error("Header bytes not a valid chain.") if header chain prevHash is invalid', () => {
      try {
        ValidateSPV.validateHeaderChain(
          utils.deserializeHex(HEADER_ERR.HEADER_CHAIN_INVALID_PREVHASH)
        );
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Header bytes not a valid chain.');
      }
    });

    it('throws Error("Header does not meet its own difficulty target.) if a header does not meet its target', () => {
      try {
        ValidateSPV.validateHeaderChain(utils.deserializeHex(HEADER_ERR.HEADER_CHAIN_LOW_WORK));
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Header does not meet its own difficulty target.');
      }
    });
  });

  describe('#validateHeaderWork', () => {
    it('returns false on an empty digest', () => {
      const res = ValidateSPV.validateHeaderWork(utils.deserializeHex(constants.EMPTY), 0);
      assert.isFalse(res);
    });

    it('returns false if the digest has insufficient work', () => {
      const res = ValidateSPV.validateHeaderWork(utils.deserializeHex('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'), 1);
      assert.isFalse(res);
    });

    it('returns true if the digest has sufficient work', () => {
      const res = ValidateSPV.validateHeaderWork(
        utils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE),
        BigInt('3840827764407250199942201944063224491938810378873470976')
      );
      assert.isTrue(res);
    });
  });

  describe('#validateHeaderPrevHash', () => {
    it('returns true if header prevHash is valid', () => {
      const res = ValidateSPV.validateHeaderPrevHash(
        utils.deserializeHex(OP_RETURN.INDEXED_HEADERS[1].HEADER),
        utils.deserializeHex(OP_RETURN.INDEXED_HEADERS[0].DIGEST_LE)
      );
      assert.isTrue(res);
    });

    it('returns false if header prevHash is invalid', () => {
      const res = ValidateSPV.validateHeaderPrevHash(
        utils.deserializeHex(OP_RETURN.INDEXED_HEADERS[1].HEADER),
        utils.deserializeHex(OP_RETURN.INDEXED_HEADERS[1].DIGEST_LE)
      );
      assert.isFalse(res);
    });
  });
});
