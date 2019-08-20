/* global artifacts contract describe before it assert */
/* eslint-disable no-underscore-dangle */
const BN = require('bn.js');
const utils = require('./utils');

/* eslint-disable-next-line no-unresolved */
const vectors = require('./testVectors.json');

const ValidateSPV = artifacts.require('ValidateSPVTest');

const {
  getErrBadLength,
  getErrInvalidChain,
  getErrLowWork,
  prove,
  calculateTxId,
  parseInput,
  parseOutput,
  parseHeader,
  parseHeaderSolErr,
  validateHeaderChain,
  validateHeaderChainError,
  validateHeaderWork,
  validateHeaderPrevHash
} = vectors;


contract('ValidateSPV', () => {
  let instance;

  before(async () => {
    instance = await ValidateSPV.new();
  });

  describe('#error constants', async () => {
    it('tests the constant getters for that sweet sweet coverage', async () => {
      let res = await instance.getErrBadLength.call();
      assert(res.eq(new BN(getErrBadLength[0].output, 16)));

      res = await instance.getErrInvalidChain.call();
      assert(res.eq(new BN(getErrInvalidChain[0].output, 16)));

      res = await instance.getErrLowWork.call();
      assert(res.eq(new BN(getErrLowWork[0].output, 16)));
    });
  });

  describe('#prove', async () => {
    it('returns true if proof is valid', async () => {
      for (let i = 0; i < prove.length; i += 1) {
        const {
          txIdLE, merkleRootLE, proof, index
        } = prove[i].input;
        const res = await instance.prove(txIdLE, merkleRootLE, proof, index);
        assert.strictEqual(res, prove[i].output);
      }
    });
  });

  describe('#calculateTxId', async () => {
    it('returns the transaction hash', async () => {
      for (let i = 0; i < calculateTxId.length; i += 1) {
        const {
          version, vin, vout, locktime
        } = calculateTxId[i].input;
        const res = await instance.calculateTxId(version, vin, vout, locktime);
        assert.strictEqual(res, calculateTxId[i].output);
      }
    });
  });

  describe('#parseInput', async () => {
    it('returns the tx input sequence and outpoint', async () => {
      for (let i = 0; i < parseInput.length; i += 1) {
        const txIn = await instance.parseInput(parseInput[i].input);
        const {
          sequence, txId, index, type
        } = parseInput[i].output;

        assert(txIn._sequence.eq(new BN(sequence, 10)));
        assert.strictEqual(txIn._hash, txId);
        assert(txIn._index.eq(new BN(index, 10)));
        assert(txIn._inputType.eq(utils.OUTPUT_TYPES[type]));
      }
    });
  });

  describe('#parseOutput', async () => {
    it('returns the tx output value, output type, and payload for an OP_RETURN output', async () => {
      for (let i = 0; i < parseOutput.length; i += 1) {
        const { value, type } = parseOutput[i].output;
        let { payload } = parseOutput[i].output;

        // better way to do this?
        if (payload === '0x') {
          payload = null;
        }

        const txOut = await instance.parseOutput(parseOutput[i].input);

        assert(txOut._value.eq(new BN(value, 10)));
        assert(txOut._outputType.eq(utils.OUTPUT_TYPES[type]));
        assert.strictEqual(txOut._payload, payload);
      }
    });
  });

  describe('#parseHeader', async () => {
    it('returns the header digest, version, prevHash, merkleRoot, timestamp, target, and nonce',
      async () => {
        for (let i = 0; i < parseHeader.length; i += 1) {
          const validHeader = await instance.parseHeader(parseHeader[i].input);
          const {
            digest, version, prevHash, merkleRoot, timestamp, target, nonce
          } = parseHeader[i].output;

          assert.strictEqual(validHeader._digest, digest);
          assert(validHeader._version.eq(new BN(version, 10)));
          assert.strictEqual(validHeader._prevHash, prevHash);
          assert.strictEqual(validHeader._merkleRoot, merkleRoot);
          assert(validHeader._timestamp.eq(new BN(timestamp, 10)));
          assert(validHeader._target.eq(new BN(target.slice(2), 16)));
          assert(validHeader._nonce.eq(new BN(nonce, 10)));
        }
      });

    it('bubble up errors if input header is not 80 bytes', async () => {
      for (let i = 0; i < parseHeaderSolErr.length; i += 1) {
        const invalidHeader = await instance.parseHeader(parseHeaderSolErr[i].input);
        const {
          digest, version, prevHash, merkleRoot, timestamp, target, nonce
        } = parseHeaderSolErr[i].output;

        assert.strictEqual(digest, invalidHeader._digest);
        assert(new BN(version, 10).eq(invalidHeader._version));
        assert.strictEqual(prevHash, invalidHeader._prevHash);
        assert.strictEqual(merkleRoot, invalidHeader._merkleRoot);
        assert(new BN(timestamp, 10).eq(invalidHeader._timestamp));
        assert(new BN(target, 10).eq(invalidHeader._target));
        assert(new BN(nonce, 10).eq(invalidHeader._nonce));
      }
    });
  });

  describe('#validateHeaderChain', async () => {
    it('returns true if header chain is valid', async () => {
      for (let i = 0; i < validateHeaderChain.length; i += 1) {
        const res = await instance.validateHeaderChain(validateHeaderChain[i].input);
        assert(res.eq(new BN(validateHeaderChain[i].output, 10)));
      }
    });

    it('returns error if header chain is invalid', async () => {
      for (let i = 0; i < validateHeaderChainError.length; i += 1) {
        const res = await instance.validateHeaderChain(validateHeaderChainError[i].input);
        assert(res.eq(new BN(validateHeaderChainError[i].solidityError, 16)));
      }
    });
  });

  describe('#validateHeaderWork', async () => {
    it('returns false on an empty digest', async () => {
      for (let i = 0; i < validateHeaderWork.length; i += 1) {
        const { digest, target } = validateHeaderWork[i].input;
        // Is this right?
        const res = await instance.validateHeaderWork(digest, target);
        assert.strictEqual(res, validateHeaderWork[i].output);
      }
    });
  });

  describe('#validateHeaderPrevHash', async () => {
    it('returns true if header prevHash is valid', async () => {
      for (let i = 0; i < validateHeaderPrevHash.length; i += 1) {
        const res = await instance.validateHeaderPrevHash(
          validateHeaderPrevHash[i].input.header,
          validateHeaderPrevHash[i].input.prevHash
        );
        assert.strictEqual(res, validateHeaderPrevHash[i].output);
      }
    });
  });
});
