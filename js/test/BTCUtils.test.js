/* global it describe BigInt */
import * as chai from 'chai';
import * as utils from '../src/utils';
import * as BTCUtils from '../src/BTCUtils';
import * as vectors from '../../testVectors.json';

const vectorObj = JSON.parse(JSON.stringify(vectors));
utils.parseJson(vectorObj);

const {
  extractOutpoint,
  hash160,
  hash256,
  extractSequenceLEWitness,
  extractSequenceWitness,
  extractSequenceLELegacy,
  extractSequenceLegacy,
  extractOutputScriptLen,
  extractHash,
  extractOpReturnData,
  extractInputAtIndex,
  isLegacyInput,
  extractValueLE,
  extractValue,
  determineInputLength,
  extractScriptSig,
  extractScriptSigLen,
  validateVin,
  validateVout,
  determineOutputLength,
  extractOutputAtIndex,
  extractMerkleRootBE,
  extractTarget,
  extractPrevBlockBE,
  extractTimestamp,
  verifyHash256Merkle,
  determineVarIntDataLength,
  retargetAlgorithm,
  calculateDifficulty
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

  it('extracts a sequence from a witness input as LE and int', () => {
    for (let i = 0; i < extractSequenceLEWitness.length; i += 1) {
      const res = BTCUtils.extractSequenceLEWitness(extractSequenceLEWitness[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractSequenceLEWitness[i].output);
      assert.isTrue(arraysAreEqual);
    }

    for (let i = 0; i < extractSequenceWitness.length; i += 1) {
      const res = BTCUtils.extractSequenceWitness(extractSequenceWitness[i].input);
      assert.equal(res, BigInt(extractSequenceWitness[i].output));
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
      assert.equal(res, BigInt(extractSequenceLegacy[i].output));
    }
  });

  it('extracts an outpoint as bytes', () => {
    for (let i = 0; i < extractOutpoint.length; i += 1) {
      const res = BTCUtils.extractOutpoint(extractOutpoint[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractOutpoint[i].output);
      assert.isTrue(arraysAreEqual);
    }
  });

  /* Witness Output */
  it('extracts the length of the output script', () => {
    for (let i = 0; i < extractOutputScriptLen.length; i += 1) {
      const res = BTCUtils.extractOutputScriptLen(extractOutputScriptLen[i].input);
      assert.equal(res, extractOutputScriptLen[i].output);
    }
  });

  it('extracts the hash from an output', () => {
    let res = BTCUtils.extractHash(extractHash[0].input);
    let arraysAreEqual = utils.typedArraysAreEqual(res, extractHash[0].output);
    assert.isTrue(arraysAreEqual);

    try {
      BTCUtils.extractHash(extractHash[1].input);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, extractHash[1].errorMessage);
    }

    // malformatted witness
    try {
      BTCUtils.extractHash(extractHash[2].input);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, extractHash[2].errorMessage);
    }

    // malformatted p2pkh
    try {
      BTCUtils.extractHash(extractHash[3].input);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, extractHash[3].errorMessage);
    }

    // malformatted p2pkh
    try {
      BTCUtils.extractHash(extractHash[4].input);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, extractHash[4].errorMessage);
    }

    // good p2pkh
    res = BTCUtils.extractHash(extractHash[5].input);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractHash[5].output);
    assert.isTrue(arraysAreEqual);

    // malformatted p2sh
    try {
      BTCUtils.extractHash(extractHash[6].input);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, extractHash[6].errorMessage);
    }

    // good p2sh
    res = BTCUtils.extractHash(extractHash[7].input);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractHash[7].output);
    assert.isTrue(arraysAreEqual);
  });

  it('extracts the value as LE and int', () => {
    for (let i = 0; i < extractValueLE.length; i += 1) {
      const res = BTCUtils.extractValueLE(extractValueLE[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractValueLE[i].output);
      assert.isTrue(arraysAreEqual);
    }

    for (let i = 0; i < extractValue.length; i += 1) {
      const res = BTCUtils.extractValue(extractValue[i].input);
      assert.equal(res, BigInt(extractValue[i].output));
    }
  });

  it('extracts op_return data blobs', () => {
    const res = BTCUtils.extractOpReturnData(extractOpReturnData[0].input);
    const arraysAreEqual = utils.typedArraysAreEqual(res, extractOpReturnData[0].output);
    assert.isTrue(arraysAreEqual);

    try {
      BTCUtils.extractOpReturnData(extractOpReturnData[1].input);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, extractOpReturnData[1].errorMessage);
    }
  });

  it('extracts inputs at specified indices', () => {
    for (let i = 0; i < extractInputAtIndex.length; i += 1) {
      const res = BTCUtils.extractInputAtIndex(
        extractInputAtIndex[i].input.proof,
        extractInputAtIndex[i].input.index
      );
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractInputAtIndex[i].output);
      assert.isTrue(arraysAreEqual);
    }
  });

  it('sorts legacy from witness inputs', () => {
    for (let i = 0; i < isLegacyInput.length; i += 1) {
      const res = BTCUtils.isLegacyInput(isLegacyInput[i].input);
      if (isLegacyInput[i].output) {
        assert.isTrue(res);
      } else {
        assert.isFalse(res);
      }
    }
  });

  it('determines input length', () => {
    for (let i = 0; i < determineInputLength.length; i += 1) {
      const res = BTCUtils.determineInputLength(determineInputLength[i].input);
      assert.equal(res, BigInt(determineInputLength[i].output));
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
      assert.equal(res.dataLen, BigInt(extractScriptSigLen[i].output[0]));
      assert.equal(res.scriptSigLen, BigInt(extractScriptSigLen[i].output[1]));
    }
  });

  it('validates vin length based on stated size', () => {
    for (let i = 0; i < validateVin.length; i += 1) {
      const res = BTCUtils.validateVin(validateVin[i].input);
      if (validateVin[i].output) {
        assert.isTrue(res);
      } else {
        assert.isFalse(res);
      }
    }
  });

  it('validates vout length based on stated size', () => {
    for (let i = 0; i < validateVout.length; i += 1) {
      const res = BTCUtils.validateVout(validateVout[i].input);
      if (validateVout[i].output) {
        assert.isTrue(res);
      } else {
        assert.isFalse(res);
      }
    }
  });

  it('determines output length properly', () => {
    for (let i = 0; i < determineOutputLength.length - 1; i += 1) {
      const res = BTCUtils.determineOutputLength(determineOutputLength[i].input);
      assert.equal(res, BigInt(determineOutputLength[i].output));
    }

    try {
      BTCUtils.determineOutputLength(determineOutputLength[6].input);
      assert(false, 'Expected an error');
    } catch (e) {
      assert.include(e.message, determineOutputLength[6].errorMessage);
    }
  });

  it('extracts outputs at specified indices', () => {
    for (let i = 0; i < extractOutputAtIndex.length; i += 1) {
      const res = BTCUtils.extractOutputAtIndex(
        extractOutputAtIndex[i].input.proof,
        extractOutputAtIndex[i].input.index
      );
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractOutputAtIndex[i].output);
      assert.isTrue(arraysAreEqual);
    }
  });

  it('extracts a root from a header', () => {
    for (let i = 0; i < extractMerkleRootBE.length; i += 1) {
      const res = BTCUtils.extractMerkleRootBE(extractMerkleRootBE[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractMerkleRootBE[i].output);
      assert.isTrue(arraysAreEqual);
    }
  });

  it('extracts the target from a header', () => {
    const res = BTCUtils.extractTarget(extractTarget[0].input);
    assert.equal(res, BigInt(26959535291011309493156476344723991336010898738574164086137773096960));
    // this isn't working
    // assert.equal(res, utils.bytesToUint(extractTarget[0].output));
  });

  it('extracts the prev block hash', () => {
    for (let i = 0; i < BTCUtils.extractPrevBlockBE.length; i += 1) {
      const res = BTCUtils.extractPrevBlockBE(extractPrevBlockBE[i].input);
      const arraysAreEqual = utils.typedArraysAreEqual(res, extractPrevBlockBE[i].output);
      assert.isTrue(arraysAreEqual);
    }
  });

  it('extracts a timestamp from a header', () => {
    for (let i = 0; i < extractTimestamp.length; i += 1) {
      const res = BTCUtils.extractTimestamp(extractTimestamp[i].input);
      assert.equal(res, BigInt(extractTimestamp[i].output));
    }
  });

  it('verifies a bitcoin merkle root', () => {
    for (let i = 0; i < verifyHash256Merkle.length; i += 1) {
      const res = BTCUtils.verifyHash256Merkle(
        verifyHash256Merkle[i].input.proof,
        verifyHash256Merkle[i].input.index // 0-indexed
      );
      if (verifyHash256Merkle[i].output) {
        assert.isTrue(res);
      } else {
        assert.isFalse(res);
      }
    }
  });

  it('determines VarInt data lengths correctly', () => {
    let res;

    // How can I store 0x01 in json?
    res = BTCUtils.determineVarIntDataLength(0x01);
    assert.equal(res, determineVarIntDataLength[0].output);
    res = BTCUtils.determineVarIntDataLength(0xfd);
    assert.equal(res, determineVarIntDataLength[1].output);
    res = BTCUtils.determineVarIntDataLength(0xfe);
    assert.equal(res, determineVarIntDataLength[2].output);
    res = BTCUtils.determineVarIntDataLength(0xff);
    assert.equal(res, determineVarIntDataLength[3].output);
  });

  it('calculates consensus-correct retargets', () => {
    let firstTimestamp;
    let secondTimestamp;
    let previousTarget;
    let expectedNewTarget;
    let res;
    for (let i = 0; i < retargetAlgorithm.length; i += 1) {
      firstTimestamp = retargetAlgorithm[i][0].timestamp;
      secondTimestamp = retargetAlgorithm[i][1].timestamp;
      previousTarget = BTCUtils.extractTarget(
        retargetAlgorithm[i][1].hex
      );
      expectedNewTarget = BTCUtils.extractTarget(
        retargetAlgorithm[i][2].hex
      );
      res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
      // (response & expected) == expected
      // this converts our full-length target into truncated block target
      assert.equal(res & expectedNewTarget, expectedNewTarget);

      secondTimestamp = firstTimestamp + 5 * 2016 * 10 * 60; // longer than 4x
      res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
      assert.equal(res / BigInt(4) & previousTarget, previousTarget);

      secondTimestamp = firstTimestamp + 2016 * 10 * 14; // shorter than 1/4x
      res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
      assert.equal(res * BigInt(4) & previousTarget, previousTarget);
    }
  });

  it('extracts difficulty from a header', () => {
    let actual;
    let expected;
    for (let i = 0; i < retargetAlgorithm.length; i += 1) {
      actual = BTCUtils.extractDifficulty(retargetAlgorithm[i][0].hex);
      expected = retargetAlgorithm[i][0].difficulty;
      assert.equal(actual, expected);

      actual = BTCUtils.extractDifficulty(retargetAlgorithm[i][1].hex);
      expected = retargetAlgorithm[i][1].difficulty;
      assert.equal(actual, expected);

      actual = BTCUtils.extractDifficulty(retargetAlgorithm[i][2].hex);
      expected = retargetAlgorithm[i][2].difficulty;
      assert.equal(actual, expected);
    }
  });

  describe('#calculateDifficulty', () => {
    it('throws if passed the wrong type', () => {
      for (let i = 0; i < calculateDifficulty.length; i += 1) {
        try {
          BTCUtils.calculateDifficulty(calculateDifficulty[i].input);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, calculateDifficulty[i].errorMessage);
        }
      }
    });
  });
});
