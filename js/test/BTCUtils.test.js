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
    const res = BTCUtils.hash160(hash160[0].input);
    const arraysAreEqual = utils.typedArraysAreEqual(res, hash160[0].output);
    assert.isTrue(arraysAreEqual);
  });

  it('implements bitcoin\'s hash256', () => {
    let res = BTCUtils.hash256(hash256[0].input);
    let arraysAreEqual = utils.typedArraysAreEqual(res, hash256[0].output);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.hash256(hash256[1].input); // 'abc' in utf - 8
    arraysAreEqual = utils.typedArraysAreEqual(res, hash256[1].output);
    assert.isTrue(arraysAreEqual);
  });

  it('extracts a sequence from a witness input as LE and int', () => {
    let res = BTCUtils.extractSequenceLEWitness(extractSequenceLEWitness[0].input);
    const arraysAreEqual = utils.typedArraysAreEqual(res, extractSequenceLEWitness[0].output);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractSequenceWitness(extractSequenceWitness[0].input);
    assert.equal(res, BigInt(extractSequenceWitness[0].output));
  });

  it('extracts a sequence from a legacy input as LE and int', () => {
    let res = BTCUtils.extractSequenceLELegacy(extractSequenceLELegacy[0].input);
    const arraysAreEqual = utils.typedArraysAreEqual(res, extractSequenceLELegacy[0].output);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractSequenceLegacy(extractSequenceLegacy[0].input);
    assert.equal(res, BigInt(extractSequenceLegacy[0].output));
  });

  it('extracts an outpoint as bytes', () => {
    const res = BTCUtils.extractOutpoint(extractOutpoint[0].input);
    const arraysAreEqual = utils.typedArraysAreEqual(res, extractOutpoint[0].output);
    assert.isTrue(arraysAreEqual);
  });

  /* Witness Output */
  it('extracts the length of the output script', () => {
    let res = BTCUtils.extractOutputScriptLen(extractOutputScriptLen[0].input);
    assert.equal(res, extractOutputScriptLen[0].output);

    res = BTCUtils.extractOutputScriptLen(extractOutputScriptLen[1].input);
    assert.equal(res, extractOutputScriptLen[1].output);
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
    let res;
    let arraysAreEqual;

    res = BTCUtils.extractValueLE(extractValueLE[0].input);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractValueLE[0].output);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractValue(extractValue[0].input);
    assert.equal(res, BigInt(extractValue[0].output));

    res = BTCUtils.extractValueLE(extractValueLE[1].input);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractValueLE[1].output);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractValue(extractValue[1].input);
    assert.equal(res, BigInt(extractValue[1].output));
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
    let res = BTCUtils.extractInputAtIndex(
      extractInputAtIndex[0].input.proof,
      extractInputAtIndex[0].input.index
    );
    let arraysAreEqual = utils.typedArraysAreEqual(
      res,
      extractInputAtIndex[0].output
    );
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractInputAtIndex(
      extractInputAtIndex[1].input.proof,
      extractInputAtIndex[1].input.index
    );
    arraysAreEqual = utils.typedArraysAreEqual(
      res,
      extractInputAtIndex[1].output
    );
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractInputAtIndex(
      extractInputAtIndex[2].input.proof,
      extractInputAtIndex[2].input.index
    );
    arraysAreEqual = utils.typedArraysAreEqual(
      res,
      extractInputAtIndex[2].output
    );
    assert.isTrue(arraysAreEqual);
  });

  it('sorts legacy from witness inputs', () => {
    let res;
    res = BTCUtils.isLegacyInput(isLegacyInput[0].input);
    assert.isFalse(res);

    res = BTCUtils.isLegacyInput(isLegacyInput[1].input);
    assert.isTrue(res);
  });

  it('determines input length', () => {
    let res;
    res = BTCUtils.determineInputLength(determineInputLength[0].input);
    assert.equal(res, BigInt(determineInputLength[0].output));

    res = BTCUtils.determineInputLength(determineInputLength[1].input);
    assert.equal(res, BigInt(determineInputLength[1].output));

    res = BTCUtils.determineInputLength(determineInputLength[2].input);
    assert.equal(res, BigInt(determineInputLength[2].output));

    res = BTCUtils.determineInputLength(determineInputLength[3].input);
    assert.equal(res, BigInt(determineInputLength[3].output));

    res = BTCUtils.determineInputLength(determineInputLength[4].input);
    assert.equal(res, BigInt(determineInputLength[4].output));
  });

  it('extracts the scriptSig from inputs', () => {
    let res;
    let arraysAreEqual;
    res = BTCUtils.extractScriptSig(extractScriptSig[0].input);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractScriptSig[0].output);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractScriptSig(extractScriptSig[1].input);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractScriptSig[1].output);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractScriptSig(extractScriptSig[2].input);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractScriptSig[2].output);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractScriptSig(extractScriptSig[3].input);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractScriptSig[3].output);
    assert.isTrue(arraysAreEqual);
  });

  it('extracts the length of the VarInt and scriptSig from inputs', () => {
    let res;
    res = BTCUtils.extractScriptSigLen(extractScriptSigLen[0].input);
    assert.equal(res.dataLen, BigInt(extractScriptSigLen[0].output[0]));
    assert.equal(res.scriptSigLen, BigInt(extractScriptSigLen[0].output[1]));

    res = BTCUtils.extractScriptSigLen(extractScriptSigLen[1].input);
    assert.equal(res.dataLen, BigInt(extractScriptSigLen[1].output[0]));
    assert.equal(res.scriptSigLen, BigInt(extractScriptSigLen[1].output[1]));

    res = BTCUtils.extractScriptSigLen(extractScriptSigLen[2].input);
    assert.equal(res.dataLen, BigInt(extractScriptSigLen[2].output[0]));
    assert.equal(res.scriptSigLen, BigInt(extractScriptSigLen[2].output[1]));
  });

  it('validates vin length based on stated size', () => {
    let res;

    // valid
    res = BTCUtils.validateVin(validateVin[0].input);
    assert.isTrue(res);

    // too many inputs stated
    res = BTCUtils.validateVin(validateVin[1].input);
    assert.isFalse(res);

    // no inputs stated
    res = BTCUtils.validateVin(validateVin[2].input);
    assert.isFalse(res);

    // fewer bytes in vin than stated
    res = BTCUtils.validateVin(validateVin[3].input);
    assert.isFalse(res);

    // more bytes in vin than stated
    res = BTCUtils.validateVin(validateVin[4].input);
    assert.isFalse(res);
  });

  it('validates vout length based on stated size', () => {
    let res;

    // valid
    res = BTCUtils.validateVout(validateVout[0].input);
    assert.isTrue(res);

    // too many outputs stated
    res = BTCUtils.validateVout(validateVout[1].input);
    assert.isFalse(res);

    // no outputs stated
    res = BTCUtils.validateVout(validateVout[2].input);
    assert.isFalse(res);

    // fewer bytes in vout than stated
    res = BTCUtils.validateVout(validateVout[3].input);
    assert.isFalse(res);

    // more bytes in vout than stated
    res = BTCUtils.validateVout(validateVout[4].input);
    assert.isFalse(res);
  });

  it('determines output length properly', () => {
    let res;

    res = BTCUtils.determineOutputLength(determineOutputLength[0].input);
    assert.equal(res, BigInt(determineOutputLength[0].output));

    res = BTCUtils.determineOutputLength(determineOutputLength[1].input);
    assert.equal(res, BigInt(determineOutputLength[1].output));

    res = BTCUtils.determineOutputLength(determineOutputLength[2].input);
    assert.equal(res, BigInt(determineOutputLength[2].output));

    res = BTCUtils.determineOutputLength(determineOutputLength[3].input);
    assert.equal(res, BigInt(determineOutputLength[3].output));

    res = BTCUtils.determineOutputLength(determineOutputLength[4].input);
    assert.equal(res, BigInt(determineOutputLength[4].output));

    res = BTCUtils.determineOutputLength(determineOutputLength[5].input);
    assert.equal(res, BigInt(determineOutputLength[5].output));

    try {
      res = BTCUtils.determineOutputLength(determineOutputLength[6].input);
      assert(false, 'Expected an error');
    } catch (e) {
      assert.include(e.message, determineOutputLength[6].errorMessage);
    }
  });

  it('extracts outputs at specified indices', () => {
    let res;
    let arraysAreEqual;
    res = BTCUtils.extractOutputAtIndex(extractOutputAtIndex[0].input, 0);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractOutputAtIndex[0].output);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractOutputAtIndex(extractOutputAtIndex[1].input, 1);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractOutputAtIndex[1].output);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractOutputAtIndex(extractOutputAtIndex[2].input, 0);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractOutputAtIndex[2].output);

    res = BTCUtils.extractOutputAtIndex(extractOutputAtIndex[3].input, 1);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractOutputAtIndex[3].output);
  });

  it('extracts a root from a header', () => {
    const res = BTCUtils.extractMerkleRootBE(extractMerkleRootBE[0].input);
    const arraysAreEqual = utils.typedArraysAreEqual(res, extractMerkleRootBE[0].output);
    assert.isTrue(arraysAreEqual);
  });

  it('extracts the target from a header', () => {
    const res = BTCUtils.extractTarget(extractTarget[0].input);
    assert.equal(res, BigInt(26959535291011309493156476344723991336010898738574164086137773096960));
    // assert.equal(res, utils.bytesToUint(extractTarget[0].output));
  });

  it('extracts the prev block hash', () => {
    const res = BTCUtils.extractPrevBlockBE(extractPrevBlockBE[0].input);
    const arraysAreEqual = utils.typedArraysAreEqual(res, extractPrevBlockBE[0].output);
    assert.isTrue(arraysAreEqual);
  });

  it('extracts a timestamp from a header', () => {
    const res = BTCUtils.extractTimestamp(extractTimestamp[0].input);
    assert.equal(res, BigInt(extractTimestamp[0].output));
  });

  it('verifies a bitcoin merkle root', () => {
    let res;
    res = BTCUtils.verifyHash256Merkle(
      verifyHash256Merkle[0].input.proof,
      verifyHash256Merkle[0].input.index // 0-indexed
    );
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(
      verifyHash256Merkle[1].input.proof,
      verifyHash256Merkle[1].input.index // 0-indexed
    );
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(
      verifyHash256Merkle[2].input.proof,
      verifyHash256Merkle[2].input.index // 0-indexed
    );
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(
      verifyHash256Merkle[3].input.proof,
      verifyHash256Merkle[3].input.index
    );
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(
      verifyHash256Merkle[4].input.proof,
      verifyHash256Merkle[4].input.index
    );
    assert.isTrue(res);

    // not evenly divisible by 32
    res = BTCUtils.verifyHash256Merkle(
      verifyHash256Merkle[5].input.proof,
      verifyHash256Merkle[5].input.index
    );
    assert.isFalse(res);

    // 1-hash special case
    res = BTCUtils.verifyHash256Merkle(
      verifyHash256Merkle[6].input.proof,
      verifyHash256Merkle[6].input.index
    );
    assert.isTrue(res);

    // 2-hash special case
    res = BTCUtils.verifyHash256Merkle(
      verifyHash256Merkle[7].input.proof,
      verifyHash256Merkle[7].input.index
    );
    assert.isFalse(res);
  });

  it('determines VarInt data lengths correctly', () => {
    let res;

    res = BTCUtils.determineVarIntDataLength(determineVarIntDataLength[0].input);
    assert.equal(res, determineVarIntDataLength[0].output);
    res = BTCUtils.determineVarIntDataLength(determineVarIntDataLength[0].input);
    assert.equal(res, determineVarIntDataLength[0].output);
    res = BTCUtils.determineVarIntDataLength(determineVarIntDataLength[0].input);
    assert.equal(res, determineVarIntDataLength[0].output);
    res = BTCUtils.determineVarIntDataLength(determineVarIntDataLength[0].input);
    assert.equal(res, determineVarIntDataLength[0].output);
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
      actual = BTCUtils.extractDifficulty(
        retargetAlgorithm[i][0].hex
      );
      expected = retargetAlgorithm[i][0].difficulty;
      assert.equal(actual, expected);

      actual = BTCUtils.extractDifficulty(
        retargetAlgorithm[i][1].hex
      );
      expected = retargetAlgorithm[i][1].difficulty;
      assert.equal(actual, expected);

      actual = BTCUtils.extractDifficulty(
        retargetAlgorithm[i][2].hex
      );
      expected = retargetAlgorithm[i][2].difficulty;
      assert.equal(actual, expected);
    }
  });

  describe('#calculateDifficulty', () => {
    it('throws if passed the wrong type', () => {
      try {
        BTCUtils.calculateDifficulty(calculateDifficulty[0].input);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, calculateDifficulty[0].errorMessage);
      }
      try {
        BTCUtils.calculateDifficulty(calculateDifficulty[1].input);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, calculateDifficulty[1].errorMessage);
      }
      try {
        BTCUtils.calculateDifficulty(calculateDifficulty[2].input);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, calculateDifficulty[2].errorMessage);
      }
      try {
        BTCUtils.calculateDifficulty({});
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Argument must be a BigInt');
      }
    });
  });
});
