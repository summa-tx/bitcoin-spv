/* global describe it BigInt */
import * as chai from 'chai';
import * as utils from '../src/utils';
import * as ValidateSPV from '../src/ValidateSPV';
import * as vectors from '../../testVectors.json';

const { assert } = chai;

const vectorObj = JSON.parse(JSON.stringify(vectors));
utils.parseJson(vectorObj);

const {
  prove,
  calculateTxId,
  parseInput,
  parseOutput,
  parseHeader,
  parseHeaderError,
  validateHeaderChain,
  validateHeaderChainError,
  validateHeaderWork,
  validateHeaderPrevHash
} = vectorObj;

describe('ValidateSPV', () => {
  describe('#prove', () => {
    it('returns true if proof is valid', () => {
      for (let i = 0; i < prove.length; i += 1) {
        const {
          txIdLE, merkleRootLE, proof, index
        } = prove[i].input;

        const res = ValidateSPV.prove(txIdLE, merkleRootLE, proof, index);
        if (prove[i].output) {
          assert.isTrue(res);
        } else {
          assert.isFalse(res);
        }
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

  describe('#parseInput', () => {
    it('returns the tx input sequence and outpoint', () => {
      for (let i = 0; i < parseInput.length; i += 1) {
        const txIn = ValidateSPV.parseInput(parseInput[i].input);
        const {
          sequence, txId, index, type
        } = parseInput[i].output;

        assert.strictEqual(txIn.sequence, BigInt(sequence));
        assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, txId));
        assert.strictEqual(txIn.inputIndex, BigInt(index));
        assert.strictEqual(txIn.inputType, BigInt(type));
      }
    });
  });

  describe('#parseOutput', () => {
    it('returns the tx output value, output type, and payload for an output', () => {
      for (let i = 0; i < parseOutput.length; i += 1) {
        const output = parseOutput[i].input;
        const { value, type, payload } = parseOutput[i].output;

        const TxOut = ValidateSPV.parseOutput(output);

        assert.strictEqual(TxOut.value, BigInt(value));
        assert.strictEqual(TxOut.outputType, utils.OUTPUT_TYPES[type]);
        assert.isTrue(utils.typedArraysAreEqual(TxOut.payload, payload));
      }
    });
  });

  describe('#parseHeader', () => {
    it('returns the header digest, version, prevHash, merkleRoot, timestamp, target, and nonce',
      () => {
        for (let i = 0; i < parseHeader.length; i += 1) {
          const validHeader = ValidateSPV.parseHeader(parseHeader[0].input);
          const {
            digest, version, prevHash, merkleRoot, timestamp, target, nonce
          } = parseHeader[i].output;

          assert.isTrue(utils.typedArraysAreEqual(validHeader.digest, digest));
          assert.strictEqual(validHeader.version, BigInt(version));
          assert.isTrue(utils.typedArraysAreEqual(validHeader.prevHash, prevHash));
          assert.isTrue(utils.typedArraysAreEqual(validHeader.merkleRoot, merkleRoot));
          assert.strictEqual(validHeader.timestamp, BigInt(timestamp));
          assert.strictEqual(validHeader.target, BigInt(utils.bytesToUint(target)));
          assert.strictEqual(validHeader.nonce, BigInt(nonce));
        }
      });

    it('throws errors if input header is not 80 bytes', () => {
      for (let i = 0; i < parseHeaderError.length; i += 1) {
        try {
          ValidateSPV.parseHeader(parseHeaderError[i].input);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, parseHeaderError[i].errorMessage);
        }
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

    it('throws Error("Header bytes not multiple of 80.") if header chain is not divisible by 80', () => {
      for (let i = 0; i < validateHeaderChainError.length; i += 1) {
        try {
          ValidateSPV.validateHeaderChain(validateHeaderChainError[i].input);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, validateHeaderChainError[i].errorMessage);
        }
      }
    });
  });

  describe('#validateHeaderWork', () => {
    it('returns true if the digest has sufficient work, returns false if insufficient work or empty digest', () => {
      for (let i = 0; i < validateHeaderWork.length; i += 1) {
        let t;
        if (typeof validateHeaderWork[i].target === 'number') {
          t = BigInt(validateHeaderWork[i].target);
        } else {
          t = utils.bytesToUint(validateHeaderWork[i].input.target);
        }

        const res = ValidateSPV.validateHeaderWork(validateHeaderWork[i].input.digest, t);
        if (validateHeaderWork[i].output) {
          assert.isTrue(res);
        } else {
          assert.isFalse(res);
        }
      }
    });
  });

  describe('#validateHeaderPrevHash', () => {
    it('returns true if header prevHash is valid', () => {
      for (let i = 0; i < validateHeaderPrevHash.length; i += 1) {
        const res = ValidateSPV.validateHeaderPrevHash(
          validateHeaderPrevHash[i].input.header,
          validateHeaderPrevHash[i].input.prevHash
        );
        if (validateHeaderPrevHash[i].output) {
          assert.isTrue(res);
        } else {
          assert.isFalse(res);
        }
      }
    });
  });
});
