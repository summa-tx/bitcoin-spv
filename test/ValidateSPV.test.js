/* global artifacts contract describe before it assert */
/* eslint-disable no-underscore-dangle */
const BN = require('bn.js');

const ValidateSPV = artifacts.require('ValidateSPVDelegate');
const utils = require('./utils');
const constants = require('./constants');


contract('ValidateSPV', () => {
  const zeroBN = new BN('0', 10);

  let instance;

  before(async () => {
    instance = await ValidateSPV.new();
  });

  describe('#prove', async () => {
    it('returns true if proof is valid', async () => {
      const res = await instance.prove(
        constants.OP_RETURN.TXID_LE,
        constants.OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE,
        constants.OP_RETURN.PROOF,
        constants.OP_RETURN.PROOF_INDEX
      );
      assert.equal(res, true);
    });

    it('returns false if txid is invalid', async () => {
      const res = await instance.prove(
        constants.EMPTY,
        constants.OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE,
        constants.OP_RETURN.PROOF,
        constants.OP_RETURN.PROOF_INDEX
      );
      assert.equal(res, false);
    });

    it('returns false if first proof hash is not txid', async () => {
      const res = await instance.prove(
        constants.OP_RETURN.TXID_LE,
        constants.OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE,
        constants.OP_RETURN.PROOF_ERR.PROOF_FIRST_HASH,
        constants.OP_RETURN.PROOF_INDEX
      );
      assert.equal(res, false);
    });

    it('returns false if last proof hash is not Merkle root', async () => {
      const res = await instance.prove(
        constants.OP_RETURN.TXID_LE,
        constants.OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE,
        constants.OP_RETURN.PROOF_ERR.PROOF_LAST_HASH,
        constants.OP_RETURN.PROOF_INDEX
      );
      assert.equal(res, false);
    });

    it('returns false if Merkle root is invalid', async () => {
      const res = await instance.prove(
        constants.OP_RETURN.TXID_LE,
        constants.OP_RETURN.TXID_LE,
        constants.OP_RETURN.PROOF,
        constants.OP_RETURN.PROOF_INDEX
      );
      assert.equal(res, false);
    });
  });

  describe('#transactionHash', async () => {
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
    const sequence = '4294967295';
    const index = zeroBN;

    it('returns the tx input sequence and outpoint', async () => {
      const hashBE = '0x75b37afaab896321d175acdccd7cb7c79737c09d2f0a2baf13bf9e2bf3b8b27b';

      const txIn = await instance.parseInput(input);

      assert(txIn._sequence.eq(new BN(sequence, 10)));
      assert.equal(txIn._hash, hashBE);
      assert(txIn._index.eq(index));
    });
  });

  describe('#parseOutput', async () => {
    let output;
    let value;
    let payload;

    it('returns the tx output value, output type, and payload for an OP_RETURN output',
      async () => {
        const opReturnTxOut = await instance.parseOutput(
          constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT
        );

        assert.equal(constants.OP_RETURN.INDEXED_OUTPUTS[1].VALUE, opReturnTxOut._value);
        assert.equal(utils.OUTPUT_TYPES.OP_RETURN, opReturnTxOut._outputType);
        assert.equal(constants.OP_RETURN.INDEXED_OUTPUTS[1].PAYLOAD, opReturnTxOut._payload);
      });

    it('returns the tx output value, output type, and payload for an WPKH output', async () => {
      output = '0xe8cd9a3b000000001600147849e6bf5e4b1ba7235572d1b0cbc094f0213e6c';
      value = 1000001000;
      payload = '0x7849e6bf5e4b1ba7235572d1b0cbc094f0213e6c';

      const wpkhOutput = await instance.parseOutput(output);

      assert.equal(wpkhOutput._value, value);
      assert.equal(wpkhOutput._outputType, utils.OUTPUT_TYPES.WPKH);
      assert.equal(wpkhOutput._payload, payload);
    });

    it('returns the tx output value, output type, and payload for an WSH output', async () => {
      output = '0x40420f0000000000220020aedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c91922';
      value = 1000000;
      payload = '0xaedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c91922';

      const wshOutput = await instance.parseOutput(output);

      assert.equal(wshOutput._value, value);
      assert.equal(wshOutput._outputType, utils.OUTPUT_TYPES.WSH);
      assert.equal(wshOutput._payload, payload);
    });

    it('bubble up errors if the tx output type is not identifiable', async () => {
      // Changes 0x6a (OP_RETURN) to 0x7a to create error
      output = '0x0000000000000000167a14edb1b5c2f39af0fec151732585b1049b07895211';

      const invalidOutput = await instance.parseOutput(output);

      assert(zeroBN.eq(invalidOutput._value));
      assert(zeroBN.eq(invalidOutput._outputType));
      assert.isNull(invalidOutput._payload);
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

    it('returns 1 if header chain is not divisible by 80', async () => {
      const res = await instance.validateHeaderChain(constants.HEADER_ERR.HEADER_CHAIN_INVALID_LEN);
      assert(res.eq(new BN('1', 10)));
    });

    it('returns 2 if header chain prevHash is invalid', async () => {
      const res = await instance.validateHeaderChain(
        constants.HEADER_ERR.HEADER_CHAIN_INVALID_PREVHASH
      );
      assert(res.eq(new BN('2', 10)));
    });

    it('returns 3 if a header does not meet its target', async () => {
      const res = await instance.validateHeaderChain(constants.HEADER_ERR.HEADER_CHAIN_LOW_WORK);
      assert(res.eq(new BN('3', 10)));
    });
  });

  describe('#validateHeaderPrevHash', async () => {
    it('returns true if header prevHash is valid', async () => {
      const res = await instance.validateHeaderPrevHash(
        constants.OP_RETURN.INDEXED_HEADERS[1].HEADER,
        constants.OP_RETURN.INDEXED_HEADERS[0].DIGEST_LE
      );
      assert.equal(res, true);
    });

    it('returns false if header prevHash is invalid', async () => {
      const res = await instance.validateHeaderPrevHash(
        constants.OP_RETURN.INDEXED_HEADERS[1].HEADER,
        constants.OP_RETURN.INDEXED_HEADERS[1].DIGEST_LE
      );
      assert.equal(res, false);
    });
  });
});
