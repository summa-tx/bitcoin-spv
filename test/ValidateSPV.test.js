/* global artifacts contract describe before it assert */
/* eslint-disable no-underscore-dangle */
const BN = require('bn.js');

const ValidateSPV = artifacts.require('ValidateSPVTest');
const utils = require('./utils');
const constants = require('./constants');


contract('ValidateSPV', () => {
  const zeroBN = new BN('0', 10);

  let instance;

  before(async () => {
    instance = await ValidateSPV.new();
  });

  describe.only('#error constants', async () => {
    it('tests the constant getters for that sweet sweet coverage', async () => {
      let res = await instance.getErrBadLength.call();
      assert(res.eq(new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16)));

      res = await instance.getErrInvalidChain.call();
      assert(res.eq(new BN('fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe', 16)));

      res = await instance.getErrLowWork.call();
      assert(res.eq(new BN('fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd', 16)));
    });
  });

  describe('#prove', async () => {
    it('returns true if proof is valid', async () => {
      const res = await instance.prove(
        constants.OP_RETURN.TXID_LE,
        constants.OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE,
        constants.OP_RETURN.PROOF,
        constants.OP_RETURN.PROOF_INDEX
      );
      assert.isTrue(res);
    });

    it('shortcuts the coinbase special case', async () => {
      const res = await instance.prove(
        constants.OP_RETURN.TXID_LE,
        constants.OP_RETURN.TXID_LE,
        '0x',
        0
      );
      assert.isTrue(res);
    });

    it('returns false if Merkle root is invalid', async () => {
      const res = await instance.prove(
        constants.OP_RETURN.TXID_LE,
        constants.OP_RETURN.TXID_LE,
        constants.OP_RETURN.PROOF,
        constants.OP_RETURN.PROOF_INDEX
      );
      assert.isFalse(res);
    });
  });

  describe('#calculateTxId', async () => {
    it('returns the transaction hash', async () => {
      const res = await instance.calculateTxId(
        constants.OP_RETURN.VERSION,
        constants.OP_RETURN.VIN,
        constants.OP_RETURN.VOUT,
        constants.OP_RETURN.LOCKTIME_LE
      );
      assert.equal(res, constants.OP_RETURN.TXID_LE);
    });
  });

  describe('#parseInput', async () => {
    const input = '0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab3750000000000ffffffff';
    const legacyInput = '0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab375000000000101ffffffff';
    const compatibilityWSHInput = '0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab37500000000220020eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeffffffff';
    const compatibilityWPKHInput = '0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab37500000000160014eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeffffffff';
    const sequence = new BN('ffffffff', 16);
    const index = zeroBN;
    const outpointTxId = '0x75b37afaab896321d175acdccd7cb7c79737c09d2f0a2baf13bf9e2bf3b8b27b';

    it('returns the tx input sequence and outpoint', async () => {
      const txIn = await instance.parseInput(input);

      assert(txIn._sequence.eq(sequence));
      assert.equal(txIn._hash, outpointTxId);
      assert(txIn._index.eq(index));
      assert(txIn._inputType.eq(new BN(utils.INPUT_TYPES.WITNESS, 10)));
    });

    it('handles Legacy inputs', async () => {
      const txIn = await instance.parseInput(legacyInput);

      assert(txIn._sequence.eq(sequence));
      assert.equal(txIn._hash, outpointTxId);
      assert(txIn._index.eq(index));
      assert(txIn._inputType.eq(new BN(utils.INPUT_TYPES.LEGACY, 10)));
    });

    it('handles p2wpkh-via-p2sh compatibility inputs', async () => {
      const txIn = await instance.parseInput(compatibilityWPKHInput);

      assert(txIn._sequence.eq(sequence));
      assert.equal(txIn._hash, outpointTxId);
      assert(txIn._index.eq(index));
      assert(txIn._inputType.eq(new BN(utils.INPUT_TYPES.COMPATIBILITY, 10)));
    });

    it('handles p2wsh-via-p2sh compatibility inputs', async () => {
      const txIn = await instance.parseInput(compatibilityWSHInput);

      assert(txIn._sequence.eq(sequence));
      assert.equal(txIn._hash, outpointTxId);
      assert(txIn._index.eq(index));
      assert(txIn._inputType.eq(new BN(utils.INPUT_TYPES.COMPATIBILITY, 10)));
    });
  });

  describe('#parseOutput', async () => {
    it('returns the tx output value, output type, and payload for an OP_RETURN output', async () => {
      const opReturnTxOut = await instance.parseOutput(
        constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT
      );

      const value = new BN(String(constants.OP_RETURN.INDEXED_OUTPUTS[1].VALUE), 10);

      assert(opReturnTxOut._value.eq(value));
      assert(opReturnTxOut._outputType.eq(utils.OUTPUT_TYPES.OP_RETURN));
      assert.equal(opReturnTxOut._payload, constants.OP_RETURN.INDEXED_OUTPUTS[1].PAYLOAD);
    });

    it('returns the tx output value, output type, and payload for an WPKH output', async () => {
      const output = '0xe8cd9a3b000000001600147849e6bf5e4b1ba7235572d1b0cbc094f0213e6c';
      const value = new BN('1000001000', 10);
      const payload = '0x7849e6bf5e4b1ba7235572d1b0cbc094f0213e6c';

      const wpkhOutput = await instance.parseOutput(output);

      assert(wpkhOutput._value.eq(value));
      assert(wpkhOutput._outputType.eq(utils.OUTPUT_TYPES.WPKH));
      assert.equal(wpkhOutput._payload, payload);
    });

    it('returns the tx output value, output type, and payload for an WSH output', async () => {
      const output = '0x40420f0000000000220020aedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c91922';
      const value = new BN('1000000', 10);
      const payload = '0xaedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c91922';

      const wshOutput = await instance.parseOutput(output);

      assert(wshOutput._value.eq(value));
      assert(wshOutput._outputType.eq(utils.OUTPUT_TYPES.WSH));
      assert.equal(wshOutput._payload, payload);
    });

    it('shows non-standard if the tx output type is not identifiable', async () => {
      // Changes 0x6a (OP_RETURN) to 0x7a to create error
      const output = '0x0000000000000000167a14edb1b5c2f39af0fec151732585b1049b07895211';

      const nonstandardOutput = await instance.parseOutput(output);

      assert(zeroBN.eq(nonstandardOutput._value));
      assert(nonstandardOutput._outputType.eq(utils.OUTPUT_TYPES.NONSTANDARD));
      assert.isNull(nonstandardOutput._payload);
    });

    it('returns the tx output value, output type, and payload for an SH output', async () => {
      const output = '0xe8df05000000000017a914a654ebafa7a37e04a7ec3f684e34897e48f0496287';
      const value = new BN('05dfe8', 16);
      const payload = '0xa654ebafa7a37e04a7ec3f684e34897e48f04962';

      const shOutput = await instance.parseOutput(output);

      assert(shOutput._value.eq(value));
      assert(shOutput._outputType.eq(utils.OUTPUT_TYPES.SH));
      assert.equal(shOutput._payload, payload);
    });

    it('returns the tx output value, output type, and payload for an PKH output', async () => {
      const output = '0x88080000000000001976a9141458514240d7287e5254af48cd292eb876cb07eb88ac';
      const value = new BN('0888', 16);
      const payload = '0x1458514240d7287e5254af48cd292eb876cb07eb';
      const pkhOutput = await instance.parseOutput(output);

      assert(pkhOutput._value.eq(value));
      assert(pkhOutput._outputType.eq(utils.OUTPUT_TYPES.PKH));
      assert.equal(pkhOutput._payload, payload);
    });
  });

  describe('#parseHeader', async () => {
    it('returns the header digest, version, prevHash, merkleRoot, timestamp, target, and nonce',
      async () => {
        const validHeader = await instance.parseHeader(
          constants.OP_RETURN.INDEXED_HEADERS[0].HEADER
        );

        assert.equal(validHeader._digest, constants.OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE);
        assert.equal(validHeader._version, constants.OP_RETURN.INDEXED_HEADERS[0].VERSION);
        assert.equal(validHeader._prevHash, constants.OP_RETURN.INDEXED_HEADERS[0].PREV_HASH_LE);
        assert.equal(
          validHeader._merkleRoot,
          constants.OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE
        );
        assert.equal(validHeader._timestamp, constants.OP_RETURN.INDEXED_HEADERS[0].TIMESTAMP);
        assert.equal(validHeader._target, constants.OP_RETURN.INDEXED_HEADERS[0].TARGET);
        assert.equal(validHeader._nonce, constants.OP_RETURN.INDEXED_HEADERS[0].NONCE);
      });

    it('bubble up errors if input header is not 80 bytes', async () => {
      // Removed a byte from the header version to create error
      const invalidHeader = await instance.parseHeader(
        constants.HEADER_ERR.HEADER_0_LEN
      );

      assert.equal(constants.EMPTY, invalidHeader._digest);
      assert(zeroBN.eq(invalidHeader._version));
      assert.equal(constants.EMPTY, invalidHeader._prevHash);
      assert.equal(constants.EMPTY, invalidHeader._merkleRoot);
      assert(zeroBN.eq(invalidHeader._timestamp));
      assert(zeroBN.eq(invalidHeader._target));
      assert(zeroBN.eq(invalidHeader._nonce));
    });
  });

  describe('#validateHeaderChain', async () => {
    it('returns true if header chain is valid', async () => {
      const res = await instance.validateHeaderChain(constants.OP_RETURN.HEADER_CHAIN);
      assert(res.eq(new BN('49134394618239', 10)));
    });

    it('returns ERR_BAD_LENGTH if header chain is not divisible by 80', async () => {
      const res = await instance.validateHeaderChain(constants.HEADER_ERR.HEADER_CHAIN_INVALID_LEN);
      assert(res.eq(new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16)));
    });

    it('returns ERR_INVALID_CHAIN if header chain prevHash is invalid', async () => {
      const res = await instance.validateHeaderChain(
        constants.HEADER_ERR.HEADER_CHAIN_INVALID_PREVHASH
      );
      assert(res.eq(new BN('fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe', 16)));
    });

    it('returns ERR_LOW_WORK if a header does not meet its target', async () => {
      const res = await instance.validateHeaderChain(constants.HEADER_ERR.HEADER_CHAIN_LOW_WORK);
      assert(res.eq(new BN('fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd', 16)));
    });
  });

  describe('#validateHeaderWork', async () => {
    it('returns false on an empty digest', async () => {
      const res = await instance.validateHeaderWork(constants.EMPTY, 0);
      assert.isFalse(res);
    });

    it('returns false if the digest has insufficient work', async () => {
      const res = await instance.validateHeaderWork('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 1);
      assert.isFalse(res);
    });

    it('returns true if the digest has sufficient work', async () => {
      const res = await instance.validateHeaderWork(
        constants.OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE,
        new BN('3840827764407250199942201944063224491938810378873470976', 10)
      );
      assert.isTrue(res);
    });
  });

  describe('#validateHeaderPrevHash', async () => {
    it('returns true if header prevHash is valid', async () => {
      const res = await instance.validateHeaderPrevHash(
        constants.OP_RETURN.INDEXED_HEADERS[1].HEADER,
        constants.OP_RETURN.INDEXED_HEADERS[0].DIGEST_LE
      );
      assert.isTrue(res);
    });

    it('returns false if header prevHash is invalid', async () => {
      const res = await instance.validateHeaderPrevHash(
        constants.OP_RETURN.INDEXED_HEADERS[1].HEADER,
        constants.OP_RETURN.INDEXED_HEADERS[1].DIGEST_LE
      );
      assert.isFalse(res);
    });
  });
});
