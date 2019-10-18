/* global describe it BigInt */
import * as chai from 'chai';
import * as utils from '../src/utils';
import * as ser from '../src/ser.js';
import * as ValidateSPV from '../src/ValidateSPV';
import * as vectors from '../../testVectors.json';
import * as testProofs from '../../testProofs.json';

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
      for (let i = 0; i < validProof.length; i += 1) {
        const { raw, hash, hash_le, height, merkle_root, merkle_root_le, prevhash } = validProof[i].confirming_header
        const res = ValidateSPV.validateHeader(
          raw, hash, hash_le, height, merkle_root, merkle_root_le, prevhash
        );
        assert.strictEqual(res, true);
      }
    });

    it('throws error if any element of a header is invalid', () => {
      for (let i = 0; i < badHeaders.length; i += 1) {
        const { raw, hash, hash_le, height, merkle_root, merkle_root_le, prevhash } = badHeaders[i].header
        try {
          ValidateSPV.validateHeader(
            raw, hash, hash_le, height, merkle_root, merkle_root_le, prevhash
          )
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, badHeaders[i].e);
        }
      }
    });
  });

  describe('#validateProof', () => {
    it('returns true if all elements of the SPV Proof are valid', () => {
      for (let i = 0; i < validProof.length; i += 1) {
        const { version, vin, vout, locktime, tx_id, tx_id_le, index, intermediate_nodes, confirming_header } = validProof[i]
        const { raw, hash, hash_le, height, merkle_root, merkle_root_le, prevhash } = confirming_header
        const res = ValidateSPV.validateProof(
          version,
          vin,
          vout,
          locktime,
          tx_id,
          tx_id_le,
          index,
          intermediate_nodes,
          raw,
          hash,
          hash_le,
          height,
          merkle_root,
          merkle_root_le,
          prevhash
        );
        assert.isTrue(res);
      }
    });

    it('throws error if any element in the SPV Proof are invalid', () => {
      for (let i = 0; i < badSPVProofs.length; i += 1) {
        const {
          version, vin, vout, locktime, tx_id, tx_id_le, index, intermediate_nodes, confirming_header
        } = badSPVProofs[i].proof
        const { raw, hash, hash_le, height, merkle_root, merkle_root_le, prevhash } = confirming_header

        try {
          ValidateSPV.validateProof(
            version,
            vin,
            vout,
            locktime,
            tx_id,
            tx_id_le,
            index,
            intermediate_nodes,
            raw,
            hash,
            hash_le,
            height,
            merkle_root,
            merkle_root_le,
            prevhash
          );
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, badSPVProofs[i].e);
        }
      }
    });
  });
});
