/* global describe it BigInt */
import * as chai from 'chai';
import * as utils from '../src/utils';
import * as ValidateSPV from '../src/ValidateSPV';
import * as vectors from '../../testVectors.json';

const { assert } = chai;

const vectorObj = JSON.parse(JSON.stringify(vectors));
utils.updateJSON(vectorObj);

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
  validateHeaderPrevHash,
  validateHeader,
  validateHeaderError,
  validateProof,
  validateProofError
} = vectorObj;

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
        assert.strictEqual(TxOut.outputType, BigInt(type));
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

    it('throws error if input header is not valid', () => {
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

    it('throws error if header chain is not valid', () => {
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
        const res = ValidateSPV.validateHeaderPrevHash(
          validateHeaderPrevHash[i].input.header,
          validateHeaderPrevHash[i].input.prevHash
        );
        assert.strictEqual(res, validateHeaderPrevHash[i].output);
      }
    });
  });

  describe('#validateHeader', () => {
    it('returns true if all elements of the bitcoin header are valid', () => {
      for (let i = 0; i < validateHeader.length; i += 1) {
        const res = ValidateSPV.validateHeader(
          validateHeader[i].input.raw,
          validateHeader[i].input.hash,
          validateHeader[i].input.hash_le,
          validateHeader[i].input.height,
          validateHeader[i].input.merkle_root,
          validateHeader[i].input.merkle_root_le,
          validateHeader[i].input.prev_hash
        )
        assert.strictEqual(res, validateHeader[i].output)
      }
    })

    it('throws error if any element of a header is invalid'), () => {
      for (let i = 0; i < validateHeaderError.length; i += 1) {
        try {
          ValidateSPV.validateHeader(
            validateHeaderError[i].input.raw,
            validateHeaderError[i].input.hash,
            validateHeaderError[i].input.hash_le,
            validateHeaderError[i].input.height,
            validateHeaderError[i].input.merkle_root,
            validateHeaderError[i].input.merkle_root_le,
            validateHeaderError[i].input.prev_hash
          )
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, validateHeaderError[i].errorMessage);
        }
      }
    }
  })

  describe('#validateProof', () => {
    it('returns true if all elements of the SPV Proof are valid', () => {
      for (let i = 0; i < validateProof.length; i += 1) {
        const res = ValidateSPV.validateProof(
          validateProof[i].input.version,
          validateProof[i].input.vin,
          validateProof[i].input.vout,
          validateProof[i].input.locktime,
          validateProof[i].input.txid,
          validateProof[i].input.txid_le,
          validateProof[i].input.index,
          validateProof[i].input.intermediate_nodes,
          validateProof[i].input.raw,
          validateProof[i].input.hash,
          validateProof[i].input.hash_le,
          validateProof[i].input.height,
          validateProof[i].input.merkle_root,
          validateProof[i].input.merkle_root_le,
          validateProof[i].input.prev_hash
        )
        assert.strictEqual(res, validateProof[i].output)
      }
    })

    it('throws error if any element in the SPV Proof are invalid', () => {
      for (let i = 0; i < validateProofError.length; i += 1) {
        try {
          ValidateSPV.validateProof(
            validateProofError[i].input.version,
            validateProofError[i].input.vin,
            validateProofError[i].input.vout,
            validateProofError[i].input.locktime,
            validateProofError[i].input.txid,
            validateProofError[i].input.txid_le,
            validateProofError[i].input.index,
            validateProofError[i].input.intermediate_nodes,
            validateProofError[i].input.raw,
            validateProofError[i].input.hash,
            validateProofError[i].input.hash_le,
            validateProofError[i].input.height,
            validateProofError[i].input.merkle_root,
            validateProofError[i].input.merkle_root_le,
            validateProofError[i].input.prev_hash
          )
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, validateProofError[i].errorMessage);
        }
      }
    })
  })
});
