/* global describe it BigInt */
import * as chai from 'chai';
import * as utils from '../src/utils';
import * as ser from '../src/ser';
import * as ValidateSPV from '../src/ValidateSPV';
import * as vectors from '../../testVectors.json';
import * as testProofs from '../../testProofs.json';

const { assert } = chai;

const vectorObj = JSON.parse(JSON.stringify(vectors));
utils.updateJSON(vectorObj);

const {
  prove,
  calculateTxId,
  validateHeaderChain,
  validateHeaderChainError,
  validateHeaderWork,
  validateHeaderPrevHash
} = vectorObj;

const testProofsObj = JSON.parse(JSON.stringify(testProofs));
utils.updateJSON(testProofsObj);

const {
  valid,
  badHeaders,
  badSPVProofs
} = testProofsObj;
const validProof = ser.deserializeSPVProof(valid);

describe('ValidateSPV', () => {
  describe('#prove', () => {
    it('returns true if proof is valid, false if otherwise', () => {
      for (let i = 0; i < prove.length; i += 1) {
        const {
          txIdLE, merkleRootLE, proof, index
        } = prove[i].input;

        const res = ValidateSPV.prove(txIdLE, merkleRootLE, proof, index);
        assert.strictEqual(res, prove[i].output);
      }
    });
  });

  describe('#calculateTxId', () => {
    it('returns the transaction hash', () => {
      for (let i = 0; i < calculateTxId.length; i += 1) {
        const {
          version, vin, vout, locktime
        } = calculateTxId[i].input;

        const res = ValidateSPV.calculateTxId(version, vin, vout, locktime);
        const arraysAreEqual = utils.typedArraysAreEqual(res, calculateTxId[i].output);
        assert.isTrue(arraysAreEqual);
      }
    });
  });

  describe('#validateHeaderChain', () => {
    it('returns true if header chain is valid', () => {
      for (let i = 0; i < validateHeaderChain.length; i += 1) {
        const res = ValidateSPV.validateHeaderChain(validateHeaderChain[i].input);
        assert.strictEqual(res, BigInt(validateHeaderChain[i].output));
      }
    });

    it('throws error if header chain is not valid', () => {
      for (let i = 0; i < validateHeaderChainError.length; i += 1) {
        try {
          ValidateSPV.validateHeaderChain(validateHeaderChainError[i].input);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, validateHeaderChainError[i].jsError);
        }
      }
    });
  });

  describe('#validateHeaderWork', () => {
    it('returns true if the digest has sufficient work, false if otherwise', () => {
      for (let i = 0; i < validateHeaderWork.length; i += 1) {
        let t;
        if (typeof validateHeaderWork[i].target === 'number') {
          t = BigInt(validateHeaderWork[i].target);
        } else {
          t = utils.bytesToUint(validateHeaderWork[i].input.target);
        }

        const res = ValidateSPV.validateHeaderWork(validateHeaderWork[i].input.digest, t);
        assert.strictEqual(res, validateHeaderWork[i].output);
      }
    });
  });

  describe('#validateHeaderPrevHash', () => {
    it('returns true if header prevHash is valid, false if otherwise', () => {
      for (let i = 0; i < validateHeaderPrevHash.length; i += 1) {
        const res = ValidateSPV.validateHeaderPrevHashLE(
          validateHeaderPrevHash[i].input.header,
          validateHeaderPrevHash[i].input.prevHash
        );
        assert.strictEqual(res, validateHeaderPrevHash[i].output);
      }
    });
  });

  describe('#validateHeader', () => {
    it('returns true if the header object is syntactically valid', () => {
      const res = ValidateSPV.validateHeader(validProof.confirming_header);
      assert.strictEqual(res, true);
    });

    it('throws error if any element of the header is invalid', () => {
      for (let i = 0; i < badHeaders.length; i += 1) {
        try {
          ValidateSPV.validateHeader(badHeaders[i].header);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, badHeaders[i].e);
        }
      }
    });
  });

  describe('#validateProof', () => {
    it('returns true if the SPV Proof object is syntactically valid', () => {
      const res = ValidateSPV.validateProof(validProof);
      assert.isTrue(res);
    });

    it('throws error if any element in the SPV Proof is invalid', () => {
      for (let i = 0; i < badSPVProofs.length; i += 1) {
        try {
          ValidateSPV.validateProof(badSPVProofs[i].proof);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, badSPVProofs[i].e);
        }
      }
    });
  });
});
