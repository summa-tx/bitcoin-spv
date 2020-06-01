/* global it describe BigInt */
import * as chai from 'chai';
import * as utils from '../src/utils';
import * as BTCUtils from '../src/BTCUtils';
import * as vectors from '../../testVectors.json';

const vectorObj = JSON.parse(JSON.stringify(vectors));
utils.updateJSON(vectorObj);

const {
  extractOutpoint,
  hash160,
  hash256,
  hash256MerkleStep,
  extractSequenceLEWitness,
  extractSequenceWitness,
  extractSequenceLELegacy,
  extractSequenceLegacy,
  extractHash,
  extractHashError,
  extractOpReturnData,
  extractOpReturnDataError,
  extractInputAtIndex,
  extractInputAtIndexError,
  isLegacyInput,
  extractValueLE,
  extractValue,
  extractInputTxIdLE,
  extractTxIndexLE,
  extractTxIndex,
  determineInputLength,
  extractScriptSig,
  extractScriptSigLen,
  validateVin,
  validateVout,
  determineOutputLength,
  determineOutputLengthError,
  extractOutputAtIndex,
  extractOutputAtIndexError,
  extractTarget,
  extractTimestamp,
  verifyHash256Merkle,
  determineVarIntDataLength,
  parseVarInt,
  retargetAlgorithm,
  calculateDifficultyError
} = vectorObj;

const { assert } = chai;

describe('BTCUtils', () => {
  it('implements bitcoin\'s hash160', () => {
    for (let i = 0; i < hash160.length; i += 1) {
      const res = BTCUtils.hash160(hash160[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, hash160[i].output);
      assert.isTrue(arraysAreEqual);
    }
  });

  it('implements bitcoin\'s hash256', () => {
    for (let i = 0; i < hash256.length; i += 1) {
      const res = BTCUtils.hash256(hash256[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, hash256[i].output);
      assert.isTrue(arraysAreEqual);
    }
  });

  it('implements hash256MerkleStep', () => {
    for (let i = 0; i < hash256MerkleStep.length; i += 1) {
      const res = BTCUtils.hash256MerkleStep(
        hash256MerkleStep[i].input[0],
        hash256MerkleStep[i].input[1]
      );
      const arraysAreEqual = utils.typedArraysAreEqual(res, hash256MerkleStep[i].output);
      assert.isTrue(arraysAreEqual);
    }
  });

  it('extracts a sequence from a witness input as LE and int', () => {
    for (let i = 0; i < extractSequenceLEWitness.length; i += 1) {
      const res = BTCUtils.extractSequenceLEWitness(extractSequenceLEWitness[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractSequenceLEWitness[i].output);
      assert.isTrue(arraysAreEqual);
    }

    for (let i = 0; i < extractSequenceWitness.length; i += 1) {
      const res = BTCUtils.extractSequenceWitness(extractSequenceWitness[i].input);
      assert.strictEqual(res, BigInt(extractSequenceWitness[i].output));
    }
  });

  it('extracts a sequence from a legacy input as LE and int', () => {
    for (let i = 0; i < extractSequenceLELegacy.length; i += 1) {
      const res = BTCUtils.extractSequenceLELegacy(extractSequenceLELegacy[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractSequenceLELegacy[i].output);
      assert.isTrue(arraysAreEqual);
    }

    for (let i = 0; i < extractSequenceLegacy.length; i += 1) {
      const res = BTCUtils.extractSequenceLegacy(extractSequenceLegacy[i].input);
      assert.strictEqual(res, BigInt(extractSequenceLegacy[i].output));
    }
  });

  it('extracts an outpoint as bytes', () => {
    for (let i = 0; i < extractOutpoint.length; i += 1) {
      const res = BTCUtils.extractOutpoint(extractOutpoint[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractOutpoint[i].output);
      assert.isTrue(arraysAreEqual);
    }
  });

  it('extracts the hash from an output', () => {
    for (let i = 0; i < extractHash.length; i += 1) {
      const res = BTCUtils.extractHash(extractHash[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractHash[i].output);
      assert.isTrue(arraysAreEqual);
    }

    for (let i = 0; i < extractHashError.length; i += 1) {
      try {
        BTCUtils.extractHash(extractHashError[i].input);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, extractHashError[i].jsError);
      }
    }
  });

  it('extracts the value as LE and int', () => {
    for (let i = 0; i < extractValueLE.length; i += 1) {
      const res = BTCUtils.extractValueLE(extractValueLE[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractValueLE[i].output);
      assert.isTrue(arraysAreEqual);
    }

    for (let i = 0; i < extractValue.length; i += 1) {
      const res = BTCUtils.extractValue(extractValue[i].input);
      assert.strictEqual(res, BigInt(extractValue[i].output));
    }
  });

  it('extracts op_return data blobs', () => {
    for (let i = 0; i < extractOpReturnData.length; i += 1) {
      const res = BTCUtils.extractOpReturnData(extractOpReturnData[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractOpReturnData[i].output);
      assert.isTrue(arraysAreEqual);
    }

    for (let i = 0; i < extractOpReturnDataError.length; i += 1) {
      try {
        BTCUtils.extractOpReturnData(extractOpReturnDataError[i].input);
        assert(false, 'expected an error');
      } catch (e) {
        const errorMessage = extractOpReturnDataError[i].jsError
          ? extractOpReturnDataError[i].jsError : extractOpReturnDataError[i].jsError;
        assert.include(e.message, errorMessage);
      }
    }
  });

  it('extracts inputs at specified indices', () => {
    for (let i = 0; i < extractInputAtIndex.length; i += 1) {
      const res = BTCUtils.extractInputAtIndex(
        extractInputAtIndex[i].input.vin,
        extractInputAtIndex[i].input.index
      );
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractInputAtIndex[i].output);
      assert.isTrue(arraysAreEqual);
    }

    try {
      BTCUtils.extractInputAtIndex(
        extractInputAtIndexError[0].input.vin,
        extractInputAtIndexError[0].input.index
      );
      assert(false, 'expected an error');
    } catch (e) {
      const { jsError } = extractInputAtIndexError[0];
      assert.include(e.message, jsError);
    }
  });

  it('sorts legacy from witness inputs', () => {
    for (let i = 0; i < isLegacyInput.length; i += 1) {
      const res = BTCUtils.isLegacyInput(isLegacyInput[i].input);
      assert.strictEqual(res, isLegacyInput[i].output);
    }
  });

  it('determines input length', () => {
    for (let i = 0; i < determineInputLength.length; i += 1) {
      const res = BTCUtils.determineInputLength(determineInputLength[i].input);
      assert.strictEqual(res, BigInt(determineInputLength[i].output));
    }
  });

  it('extracts the scriptSig from inputs', () => {
    for (let i = 0; i < extractScriptSig.length; i += 1) {
      const res = BTCUtils.extractScriptSig(extractScriptSig[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractScriptSig[i].output);
      assert.isTrue(arraysAreEqual);
    }
  });

  it('extracts the length of the VarInt and scriptSig from inputs', () => {
    for (let i = 0; i < extractScriptSigLen.length; i += 1) {
      const res = BTCUtils.extractScriptSigLen(extractScriptSigLen[i].input);
      assert.strictEqual(res.dataLength, BigInt(extractScriptSigLen[i].output[0]));
      assert.strictEqual(res.scriptSigLen, BigInt(extractScriptSigLen[i].output[1]));
    }
  });

  it('validates vin length based on stated size', () => {
    for (let i = 0; i < validateVin.length; i += 1) {
      const res = BTCUtils.validateVin(validateVin[i].input);
      assert.strictEqual(res, validateVin[i].output);
    }
  });

  it('validates vout length based on stated size', () => {
    for (let i = 0; i < validateVout.length; i += 1) {
      const res = BTCUtils.validateVout(validateVout[i].input);
      assert.strictEqual(res, validateVout[i].output);
    }
  });

  it('determines output length properly', () => {
    for (let i = 0; i < determineOutputLength.length; i += 1) {
      const res = BTCUtils.determineOutputLength(determineOutputLength[i].input);
      assert.strictEqual(res, BigInt(determineOutputLength[i].output));
    }

    for (let i = 0; i < determineOutputLengthError.length; i += 1) {
      try {
        BTCUtils.determineOutputLength(determineOutputLengthError[i].input);
        assert(false, 'Expected an error');
      } catch (e) {
        assert.include(e.message, determineOutputLengthError[i].jsError);
      }
    }
  });

  it('extracts outputs at specified indices', () => {
    for (let i = 0; i < extractOutputAtIndex.length; i += 1) {
      const res = BTCUtils.extractOutputAtIndex(
        extractOutputAtIndex[i].input.vout,
        extractOutputAtIndex[i].input.index
      );
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractOutputAtIndex[i].output);
      assert.isTrue(arraysAreEqual);
    }

    for (let i = 0; i < extractOutputAtIndexError.length; i += 1) {
      try {
        BTCUtils.extractOutputAtIndex(
          extractOutputAtIndexError[i].input.vout,
          extractOutputAtIndexError[i].input.index
        );
        assert(false, 'Expected an error');
      } catch (e) {
        assert.include(e.message, extractOutputAtIndexError[i].jsError);
      }
    }
  });

  it('extracts the target from a header', () => {
    const res = BTCUtils.extractTarget(extractTarget[0].input);
    assert.strictEqual(res, utils.bytesToUint(extractTarget[0].output));
  });

  it('extracts a timestamp from a header', () => {
    for (let i = 0; i < extractTimestamp.length; i += 1) {
      const res = BTCUtils.extractTimestamp(extractTimestamp[i].input);
      assert.strictEqual(res, BigInt(extractTimestamp[i].output));
    }
  });

  it('verifies a bitcoin merkle root', () => {
    for (let i = 0; i < verifyHash256Merkle.length; i += 1) {
      const res = BTCUtils.verifyHash256Merkle(
        verifyHash256Merkle[i].input.proof,
        verifyHash256Merkle[i].input.index // 0-indexed
      );
      assert.strictEqual(res, verifyHash256Merkle[i].output);
    }
  });

  it('determines VarInt data lengths correctly', () => {
    for (let i = 0; i < determineVarIntDataLength.length; i += 1) {
      const res = BTCUtils.determineVarIntDataLength(determineVarIntDataLength[i].input);
      assert.strictEqual(res, determineVarIntDataLength[i].output);
    }
  });

  it('parses VarInts', () => {
    for (let i = 0; i < parseVarInt.length; i += 1) {
      const res = BTCUtils.parseVarInt(parseVarInt[i].input);
      assert.strictEqual(res.dataLength, BigInt(parseVarInt[i].output[0]));
      assert.strictEqual(res.number, BigInt(parseVarInt[i].output[1]));
    }

    // checks overrun
    try {
      BTCUtils.parseVarInt([0xff]);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Read overrun during VarInt parsing');
    }
  });

  it('calculates consensus-correct retargets', () => {
    let firstTimestamp;
    let secondTimestamp;
    let previousTarget;
    let expectedNewTarget;
    let res;
    for (let i = 0; i < retargetAlgorithm.length; i += 1) {
      firstTimestamp = retargetAlgorithm[i].input[0].timestamp;
      secondTimestamp = retargetAlgorithm[i].input[1].timestamp;
      previousTarget = BTCUtils.extractTarget(
        retargetAlgorithm[i].input[1].hex
      );
      expectedNewTarget = BTCUtils.extractTarget(
        retargetAlgorithm[i].input[2].hex
      );
      res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
      // this converts our full-length target into truncated block target
      assert.strictEqual(res & expectedNewTarget, expectedNewTarget);

      secondTimestamp = firstTimestamp + 5 * 2016 * 10 * 60; // longer than 4x
      res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
      assert.strictEqual(res / BigInt(4) & previousTarget, previousTarget);

      secondTimestamp = firstTimestamp + 2016 * 10 * 14; // shorter than 1/4x
      res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
      assert.strictEqual(res * BigInt(4) & previousTarget, previousTarget);
    }
  });

  it('extracts difficulty from a header', () => {
    let actual;
    let expected;
    for (let i = 0; i < retargetAlgorithm.length; i += 1) {
      actual = BTCUtils.extractDifficulty(retargetAlgorithm[i].input[0].hex);
      expected = BigInt(retargetAlgorithm[i].input[0].difficulty);
      assert.strictEqual(actual, expected);

      actual = BTCUtils.extractDifficulty(retargetAlgorithm[i].input[1].hex);
      expected = BigInt(retargetAlgorithm[i].input[1].difficulty);
      assert.strictEqual(actual, expected);

      actual = BTCUtils.extractDifficulty(retargetAlgorithm[i].input[2].hex);
      expected = BigInt(retargetAlgorithm[i].input[2].difficulty);
      assert.strictEqual(actual, expected);
    }
  });

  describe('#calculateDifficulty', () => {
    it('throws error if passed the wrong type', () => {
      for (let i = 0; i < calculateDifficultyError.length; i += 1) {
        try {
          BTCUtils.calculateDifficulty(calculateDifficultyError[i].input);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, calculateDifficultyError[i].jsError);
        }
      }
    });
  });

  describe('#extractInputTxIdLE', () => {
    it('extracts the oupoint index from an input', () => {
      let res;
      let equalArrays;
      for (let i = 0; i < extractInputTxIdLE.length; i += 1) {
        res = BTCUtils.extractInputTxIdLE(extractInputTxIdLE[i].input);
        equalArrays = utils.typedArraysAreEqual(res, extractInputTxIdLE[i].output);
        assert.isTrue(equalArrays);
      }
    });
  });

  describe('#extractTxIndexLE', () => {
    it('extracts the LE tx input index from the input in a tx', () => {
      let res;
      let equalArrays;
      for (let i = 0; i < extractTxIndexLE.length; i += 1) {
        res = BTCUtils.extractTxIndexLE(extractTxIndexLE[i].input);
        equalArrays = utils.typedArraysAreEqual(res, extractTxIndexLE[i].output);
        assert.isTrue(equalArrays);
      }
    });
  });

  describe('#extractTxIndex', () => {
    it('extracts the tx input index from the input in a tx', () => {
      let res;
      for (let i = 0; i < extractTxIndex.length; i += 1) {
        res = BTCUtils.extractTxIndex(extractTxIndex[i].input);
        assert.strictEqual(res, BigInt(extractTxIndex[i].output));
      }
    });
  });
});
