/* global artifacts contract describe before it assert */
/* eslint-disable no-underscore-dangle */
const BN = require('bn.js');

/* eslint-disable-next-line no-unresolved */
const vectors = require('./testVectors.json');

const ViewSPV = artifacts.require('ViewSPVTest');

const {
  getErrBadLength,
  getErrInvalidChain,
  getErrLowWork,
  prove,
  calculateTxId,
  checkWork,
  validateHeaderChain,
  validateHeaderChainError,
  validateHeaderPrevHash
} = vectors;


contract('ViewSPV', () => {
  let instance;

  before(async () => {
    instance = await ViewSPV.new();
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
        const res = await instance.calculateTxId.call(version, vin, vout, locktime);
        assert.strictEqual(res, calculateTxId[i].output);
      }
    });
  });

  describe('#checkWork', async () => {
    it('Checks validity of header work', async () => {
      for (let i = 0; i < checkWork.length; i += 1) {
        const res = await instance.checkWork(
          checkWork[i].input.header,
          checkWork[i].input.target
        );
        assert.strictEqual(res, checkWork[i].output);
      }
    });
  });

  describe('#checkChain', async () => {
    it('returns true if header chain is valid', async () => {
      for (let i = 0; i < validateHeaderChain.length; i += 1) {
        const res = await instance.checkChain.call(validateHeaderChain[i].input);
        const expected = new BN(validateHeaderChain[i].output, 10);
        assert(
          res.eq(expected),
          `expected ${expected.toString(16)} got ${res.toString(16)}`

        );
      }
    });

    it('returns error if header chain is invalid', async () => {
      for (let i = 0; i < validateHeaderChainError.length; i += 1) {
        if (validateHeaderChainError[i].solidityViewError) {
          try {
            await instance.checkChain(validateHeaderChainError[i].input);
            assert(false, 'expected an error');
          } catch (e) {
            assert.include(e.message, validateHeaderChainError[i].solidityViewError);
          }
        } else {
          const res = await instance.checkChain(validateHeaderChainError[i].input);
          const expected = new BN(validateHeaderChainError[i].solidityError, 16);
          assert(
            res.eq(expected),
            `expected ${expected.toString(16)} got ${res.toString(16)}`
          );
        }
      }
    });
  });

  describe('#checkParent', async () => {
    it('returns true if header prevHash is valid', async () => {
      for (let i = 0; i < validateHeaderPrevHash.length; i += 1) {
        const res = await instance.checkParent.call(
          validateHeaderPrevHash[i].input.header,
          validateHeaderPrevHash[i].input.prevHash
        );
        assert.strictEqual(res, validateHeaderPrevHash[i].output);
      }
    });
  });
});
