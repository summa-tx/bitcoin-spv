/* global artifacts contract describe before it assert */
/* eslint-disable no-underscore-dangle */
const BN = require('bn.js');

/* eslint-disable-next-line no-unresolved */
const vectors = require('./testVectors.json');

const ValidateSPV = artifacts.require('ValidateSPVTest');

const {
  getErrBadLength,
  getErrInvalidChain,
  getErrLowWork,
  prove,
  calculateTxId,
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

  describe('#validateHeaderChain', async () => {
    it('returns true if header chain is valid', async () => {
      for (let i = 0; i < validateHeaderChain.length; i += 1) {
        const res = await instance.validateHeaderChain(validateHeaderChain[i].input);

        // Execute within Tx to measure gas amount
        await instance.validateHeaderChainTx(validateHeaderChain[i].input);

        assert(res.eq(new BN(validateHeaderChain[i].output, 10)));
      }
    });

    it('returns error if header chain is invalid', async () => {
      for (let i = 0; i < validateHeaderChainError.length; i += 1) {
        const res = await instance.validateHeaderChain(validateHeaderChainError[i].input);

        // Execute within Tx to measure gas amount
        await instance.validateHeaderChainTx(validateHeaderChainError[i].input);

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
