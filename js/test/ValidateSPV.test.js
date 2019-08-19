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
  validateHeaderChain,
  validateHeaderWork,
  validateHeaderPrevHash
} = vectorObj;

describe('ValidateSPV', () => {
  describe('#prove', () => {
    it('returns true if proof is valid', () => {
      const {
        txIdLE, merkleRootLE, proof, index
      } = prove[0].input;

      const res = ValidateSPV.prove(txIdLE, merkleRootLE, proof, index);
      assert.isTrue(res);
    });

    it('shortcuts the coinbase special case', () => {
      const {
        txIdLE, merkleRootLE, proof, index
      } = prove[1].input;

      const res = ValidateSPV.prove(txIdLE, merkleRootLE, proof, index);
      assert.isTrue(res);
    });

    it('returns false if Merkle root is invalid', () => {
      const {
        txIdLE, merkleRootLE, proof, index
      } = prove[2].input;

      const res = ValidateSPV.prove(txIdLE, merkleRootLE, proof, index);
      assert.isFalse(res);
    });
  });

  describe('#calculateTxId', () => {
    it('returns the transaction hash', () => {
      const {
        version, vin, vout, locktime
      } = calculateTxId[0].input;

      const res = ValidateSPV.calculateTxId(version, vin, vout, locktime);
      const arraysAreEqual = utils.typedArraysAreEqual(res, calculateTxId[0].output);
      assert.isTrue(arraysAreEqual);
    });
  });

  describe('#parseInput', () => {
    it('returns the tx input sequence and outpoint', () => {
      const txIn = ValidateSPV.parseInput(parseInput[0].input);
      const {
        sequence, txId, index, type
      } = parseInput[0].output;

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, txId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, type);
    });

    it('handles Legacy inputs', () => {
      const txIn = ValidateSPV.parseInput(parseInput[1].input);
      const {
        sequence, txId, index, type
      } = parseInput[1].output;

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, txId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, type);
    });

    it('handles p2wpkh-via-p2sh compatibility inputs', () => {
      const txIn = ValidateSPV.parseInput(parseInput[2].input);
      const {
        sequence, txId, index, type
      } = parseInput[2].output;

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, txId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, type);
    });

    it('handles p2wsh-via-p2sh compatibility inputs', () => {
      const txIn = ValidateSPV.parseInput(parseInput[3].input);
      const {
        sequence, txId, index, type
      } = parseInput[3].output;

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, txId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, type);
    });
  });

  describe('#parseOutput', () => {
    it('returns the tx output value, output type, and payload for an OP_RETURN output', () => {
      const output = parseOutput[0].input;
      const { value, type, payload } = parseOutput[0].output;

      const opReturnTxOut = ValidateSPV.parseOutput(output);

      assert.equal(opReturnTxOut.value, BigInt(value));
      assert.equal(opReturnTxOut.outputType, utils.OUTPUT_TYPES[type]);
      assert.isTrue(utils.typedArraysAreEqual(opReturnTxOut.payload, payload));
    });

    it('returns the tx output value, output type, and payload for an WPKH output', () => {
      const output = parseOutput[1].input;
      const { value, type, payload } = parseOutput[1].output;

      const wpkhOutput = ValidateSPV.parseOutput(output);

      assert.equal(wpkhOutput.value, BigInt(value));
      assert.equal(wpkhOutput.outputType, utils.OUTPUT_TYPES[type]);
      assert.isTrue(utils.typedArraysAreEqual(wpkhOutput.payload, payload));
    });

    it('returns the tx output value, output type, and payload for an WSH output', () => {
      const output = parseOutput[2].input;
      const { value, type, payload } = parseOutput[2].output;

      const wshOutput = ValidateSPV.parseOutput(output);

      assert.equal(wshOutput.value, BigInt(value));
      assert.equal(wshOutput.outputType, utils.OUTPUT_TYPES[type]);
      assert.isTrue(utils.typedArraysAreEqual(wshOutput.payload, payload));
    });

    it('shows non-standard if the tx output type is not identifiable', () => {
      const output = parseOutput[3].input;
      const { value, type, payload } = parseOutput[3].output;

      // Changes 0x6a (OP_RETURN) to 0x7a to create error
      const nonstandardOutput = ValidateSPV.parseOutput(output);

      assert.equal(nonstandardOutput.value, BigInt(value));
      assert.equal(nonstandardOutput.outputType, utils.OUTPUT_TYPES[type]);
      assert.isTrue(utils.typedArraysAreEqual(nonstandardOutput.payload, payload));
    });

    it('returns the tx output value, output type, and payload for an SH output', () => {
      const output = parseOutput[4].input;
      const { value, type, payload } = parseOutput[4].output;

      const shOutput = ValidateSPV.parseOutput(output);

      assert.equal(shOutput.value, BigInt(value));
      assert.equal(shOutput.outputType, utils.OUTPUT_TYPES[type]);
      assert.isTrue(utils.typedArraysAreEqual(shOutput.payload, payload));
    });

    it('returns the tx output value, output type, and payload for an PKH output', () => {
      const output = parseOutput[5].input;
      const { value, type, payload } = parseOutput[5].output;

      const pkhOutput = ValidateSPV.parseOutput(output);

      assert.equal(pkhOutput.value, BigInt(value));
      assert.equal(pkhOutput.outputType, utils.OUTPUT_TYPES[type]);
      assert.isTrue(utils.typedArraysAreEqual(pkhOutput.payload, payload));
    });
  });

  describe('#parseHeader', () => {
    it('returns the header digest, version, prevHash, merkleRoot, timestamp, target, and nonce',
      () => {
        const validHeader = ValidateSPV.parseHeader(parseHeader[0].input);
        const {
          digest, version, prevHash, merkleRoot, timestamp, target, nonce
        } = parseHeader[0].output;

        assert.isTrue(
          utils.typedArraysAreEqual(validHeader.digest, digest)
        );
        assert.equal(validHeader.version, version);
        assert.isTrue(
          utils.typedArraysAreEqual(validHeader.prevHash, prevHash)
        );
        assert.isTrue(
          utils.typedArraysAreEqual(validHeader.merkleRoot, merkleRoot)
        );
        assert.equal(validHeader.timestamp, timestamp);
        assert.equal(validHeader.target, utils.bytesToUint(target));
        assert.equal(validHeader.nonce, nonce);
      });

    it('throws errors if input header is not 80 bytes', () => {
      // Removed a byte from the header version to create error
      try {
        ValidateSPV.parseHeader(parseHeader[1].input);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, parseHeader[1].errorMessage);
      }
    });
  });

  describe('#validateHeaderChain', () => {
    it('returns true if header chain is valid', () => {
      const res = ValidateSPV.validateHeaderChain(validateHeaderChain[0].input);
      assert.equal(res, BigInt(validateHeaderChain[0].output));
    });

    it('throws Error("Header bytes not multiple of 80.") if header chain is not divisible by 80', () => {
      try {
        ValidateSPV.validateHeaderChain(validateHeaderChain[1].input);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, validateHeaderChain[1].errorMessage);
      }
    });

    it('throws Error("Header bytes not a valid chain.") if header chain prevHash is invalid', () => {
      try {
        ValidateSPV.validateHeaderChain(validateHeaderChain[2].input);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, validateHeaderChain[2].errorMessage);
      }
    });

    it('throws Error("Header does not meet its own difficulty target.) if a header does not meet its target', () => {
      try {
        ValidateSPV.validateHeaderChain(validateHeaderChain[3].input);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, validateHeaderChain[3].errorMessage);
      }
    });
  });

  describe('#validateHeaderWork', () => {
    it('returns false on an empty digest', () => {
      const res = ValidateSPV.validateHeaderWork(
        validateHeaderWork[0].input.proof,
        validateHeaderWork[0].input.index
      );
      assert.isFalse(res);
    });

    it('returns false if the digest has insufficient work', () => {
      const res = ValidateSPV.validateHeaderWork(
        validateHeaderWork[1].input.proof,
        validateHeaderWork[1].input.index
      );
      assert.isFalse(res);
    });

    it('returns true if the digest has sufficient work', () => {
      const res = ValidateSPV.validateHeaderWork(
        validateHeaderWork[2].input.proof,
        utils.bytesToUint(validateHeaderWork[2].input.index)
      );
      assert.isTrue(res);
    });
  });

  describe('#validateHeaderPrevHash', () => {
    it('returns true if header prevHash is valid', () => {
      const res = ValidateSPV.validateHeaderPrevHash(
        validateHeaderPrevHash[0].input.proof,
        validateHeaderPrevHash[0].input.prevHash
      );
      assert.isTrue(res);
    });

    it('returns false if header prevHash is invalid', () => {
      const res = ValidateSPV.validateHeaderPrevHash(
        validateHeaderPrevHash[1].input.proof,
        validateHeaderPrevHash[1].input.prevHash
      );
      assert.isFalse(res);
    });
  });
});
