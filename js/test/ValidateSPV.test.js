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
      const res = ValidateSPV.prove(
        prove[0].input.txIdLE,
        prove[0].input.merkleRootLE,
        prove[0].input.proof,
        prove[0].input.index
      );
      assert.isTrue(res);
    });

    it('shortcuts the coinbase special case', () => {
      const res = ValidateSPV.prove(
        prove[1].input.txIdLE,
        prove[1].input.merkleRootLE,
        prove[1].input.proof,
        prove[1].input.index
      );
      assert.isTrue(res);
    });

    it('returns false if Merkle root is invalid', () => {
      const res = ValidateSPV.prove(
        prove[2].input.txIdLE,
        prove[2].input.merkleRootLE,
        prove[2].input.proof,
        prove[2].input.index
      );
      assert.isFalse(res);
    });
  });

  describe('#calculateTxId', () => {
    it('returns the transaction hash', () => {
      const res = ValidateSPV.calculateTxId(
        calculateTxId[0].input.version,
        calculateTxId[0].input.vin,
        calculateTxId[0].input.vout,
        calculateTxId[0].input.locktime
      );
      const arraysAreEqual = utils.typedArraysAreEqual(
        res,
        calculateTxId[0].output
      );
      assert.isTrue(arraysAreEqual);
    });
  });

  describe('#parseInput', () => {
    it('returns the tx input sequence and outpoint', () => {
      const txIn = ValidateSPV.parseInput(parseInput[0].input);

      assert.equal(txIn.sequence, parseInput[0].output.sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, parseInput[0].output.txId));
      assert.equal(txIn.inputIndex, parseInput[0].output.index);
      assert.equal(txIn.inputType, parseInput[0].output.type);
    });

    it('handles Legacy inputs', () => {
      const txIn = ValidateSPV.parseInput(parseInput[1].input);

      assert.equal(txIn.sequence, parseInput[1].output.sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, parseInput[1].output.txId));
      assert.equal(txIn.inputIndex, parseInput[1].output.index);
      assert.equal(txIn.inputType, parseInput[1].output.type);
    });

    it('handles p2wpkh-via-p2sh compatibility inputs', () => {
      const txIn = ValidateSPV.parseInput(parseInput[2].input);

      assert.equal(txIn.sequence, parseInput[2].output.sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, parseInput[2].output.txId));
      assert.equal(txIn.inputIndex, parseInput[2].output.index);
      assert.equal(txIn.inputType, parseInput[2].output.type);
    });

    it('handles p2wsh-via-p2sh compatibility inputs', () => {
      const txIn = ValidateSPV.parseInput(parseInput[3].input);

      assert.equal(txIn.sequence, parseInput[3].output.sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, parseInput[3].output.txId));
      assert.equal(txIn.inputIndex, parseInput[3].output.index);
      assert.equal(txIn.inputType, parseInput[3].output.type);
    });
  });

  describe('#parseOutput', () => {
    it('returns the tx output value, output type, and payload for an OP_RETURN output', () => {
      const output = parseOutput[0].input;
      const value = BigInt(parseOutput[0].output.value);
      // const type = parseOutput[0].output.type;
      const payload = parseOutput[0].output.payload;

      const opReturnTxOut = ValidateSPV.parseOutput(output);

      assert.equal(opReturnTxOut.value, value);
      assert.equal(opReturnTxOut.outputType, utils.OUTPUT_TYPES.OP_RETURN);
      assert.isTrue(utils.typedArraysAreEqual(opReturnTxOut.payload, payload));
    });

    it('returns the tx output value, output type, and payload for an WPKH output', () => {
      const output = parseOutput[1].input;
      const value = BigInt(parseOutput[1].output.value);
      // const type = parseOutput[1].output.type;
      const payload = parseOutput[1].output.payload;

      const wpkhOutput = ValidateSPV.parseOutput(output);

      assert.equal(wpkhOutput.value, value);
      assert.equal(wpkhOutput.outputType, utils.OUTPUT_TYPES.WPKH);
      assert.isTrue(utils.typedArraysAreEqual(wpkhOutput.payload, payload));
    });

    it('returns the tx output value, output type, and payload for an WSH output', () => {
      const output = parseOutput[2].input;
      const value = BigInt(parseOutput[2].output.value);
      // const type = parseOutput[2].output.type;
      const payload = parseOutput[2].output.payload;

      const wshOutput = ValidateSPV.parseOutput(output);

      assert.equal(wshOutput.value, value);
      assert.equal(wshOutput.outputType, utils.OUTPUT_TYPES.WSH);
      assert.isTrue(utils.typedArraysAreEqual(wshOutput.payload, payload));
    });

    it('shows non-standard if the tx output type is not identifiable', () => {
      const output = parseOutput[3].input;
      const value = BigInt(parseOutput[3].output.value);
      // const type = parseOutput[3].output.type;
      const payload = parseOutput[3].output.payload;

      // Changes 0x6a (OP_RETURN) to 0x7a to create error
      const nonstandardOutput = ValidateSPV.parseOutput(output);

      assert.equal(nonstandardOutput.value, value);
      assert.equal(nonstandardOutput.outputType, utils.OUTPUT_TYPES.NONSTANDARD);
      assert.isTrue(utils.typedArraysAreEqual(nonstandardOutput.payload, payload)); // new Uint8Array([])
    });

    it('returns the tx output value, output type, and payload for an SH output', () => {
      const output = parseOutput[4].input;
      const value = BigInt(parseOutput[4].output.value);
      // const type = parseOutput[4].output.type;
      const payload = parseOutput[4].output.payload;

      const shOutput = ValidateSPV.parseOutput(output);

      assert.equal(shOutput.value, value);
      assert.equal(shOutput.outputType, utils.OUTPUT_TYPES.SH);
      assert.isTrue(utils.typedArraysAreEqual(shOutput.payload, payload));
    });

    it('returns the tx output value, output type, and payload for an PKH output', () => {
      const output = parseOutput[5].input;
      const value = BigInt(parseOutput[5].output.value);
      // const type = parseOutput[5].output.type;
      const payload = parseOutput[5].output.payload;

      const pkhOutput = ValidateSPV.parseOutput(output);

      assert.equal(pkhOutput.value, value);
      assert.equal(pkhOutput.outputType, utils.OUTPUT_TYPES.PKH);
      assert.isTrue(utils.typedArraysAreEqual(pkhOutput.payload, payload));
    });
  });

  describe('#parseHeader', () => {
    it('returns the header digest, version, prevHash, merkleRoot, timestamp, target, and nonce',
      () => {
        const validHeader = ValidateSPV.parseHeader(parseHeader[0].input);

        assert.isTrue(
          utils.typedArraysAreEqual(validHeader.digest, parseHeader[0].output.digest)
        );
        assert.equal(validHeader.version, parseHeader[0].output.version);
        assert.isTrue(
          utils.typedArraysAreEqual(validHeader.prevHash, parseHeader[0].output.prevHash)
        );
        assert.isTrue(
          utils.typedArraysAreEqual(validHeader.merkleRoot, parseHeader[0].output.merkleRoot)
        );
        assert.equal(validHeader.timestamp, parseHeader[0].output.timestamp);
        assert.equal(validHeader.target, utils.bytesToUint(parseHeader[0].output.target));
        assert.equal(validHeader.nonce, parseHeader[0].output.nonce);
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
