/* global it describe BigInt */
import * as chai from 'chai';
import * as utils from '../utils/utils';
import * as BTCUtils from '../src/BTCUtils';
import * as vectors from '../../testVectors.json';

const vectorObj = JSON.parse(JSON.stringify(vectors));

utils.parseJson(vectorObj);

const {
  HEADER_170,
  OP_RETURN_PROOF,
  OP_RETURN_INDEX,
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
  INDEXED_OUTPUT,
  isLegacyInput,
  extractValueLE,
  extractValue,
  determineInputLength,
  SCRIPT_SIGS,
  SCRIPT_SIG_LEN,
  INVALID_VIN_LEN,
  INVALID_VOUT_LEN,
  OUTPUT_LEN,
  HEADER,
  MERKLE_ROOT,
  OP_RETURN,
  TWO_IN,
  RETARGET_TUPLES
} = vectorObj;

const { assert } = chai;

describe('BTCUtils', () => {
  it('implements bitcoin\'s hash160', () => {
    const res = BTCUtils.hash160(hash160[0].input);
    const u8aValue = hash160[0].output;
    const arraysAreEqual = utils.typedArraysAreEqual(res, u8aValue);
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
    // const output = OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT;
    // const opReturnOutput = OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT;

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
    const arraysAreEqual = utils.typedArraysAreEqual(
      res,
      extractOpReturnData[0].output
    );
    assert.isTrue(arraysAreEqual);

    try {
      BTCUtils.extractOpReturnData(extractOpReturnData[1].input);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, extractOpReturnData[1].errorMessage);
    }
  });

  it('extracts inputs at specified indices', () => {
    let res = BTCUtils.extractInputAtIndex(extractInputAtIndex[0].input, 0);
    let arraysAreEqual = utils.typedArraysAreEqual(
      res,
      extractInputAtIndex[0].output
    );
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractInputAtIndex(extractInputAtIndex[1].input, 0);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractInputAtIndex[1].output);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractInputAtIndex(extractInputAtIndex[2].input, 1);
    arraysAreEqual = utils.typedArraysAreEqual(res, extractInputAtIndex[2].output);
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
    res = BTCUtils.extractScriptSig(OP_RETURN.INPUTS);
    arraysAreEqual = utils.typedArraysAreEqual(res, SCRIPT_SIGS[0].SCRIPT_SIG);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractScriptSig(SCRIPT_SIGS[1].INPUT);
    arraysAreEqual = utils.typedArraysAreEqual(res, SCRIPT_SIGS[1].SCRIPT_SIG);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractScriptSig(SCRIPT_SIGS[2].INPUT);
    arraysAreEqual = utils.typedArraysAreEqual(res, SCRIPT_SIGS[2].SCRIPT_SIG);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractScriptSig(SCRIPT_SIGS[3].INPUT);
    arraysAreEqual = utils.typedArraysAreEqual(res, SCRIPT_SIGS[3].SCRIPT_SIG);
    assert.isTrue(arraysAreEqual);
  });

  it('extracts the length of the VarInt and scriptSig from inputs', () => {
    let res;
    res = BTCUtils.extractScriptSigLen(OP_RETURN.INPUTS);
    assert.equal(res.dataLen, BigInt(0));
    assert.equal(res.scriptSigLen, BigInt(0));

    res = BTCUtils.extractScriptSigLen(SCRIPT_SIG_LEN.INPUT[0]);
    assert.equal(res.dataLen, BigInt(0));
    assert.equal(res.scriptSigLen, BigInt(1));

    res = BTCUtils.extractScriptSigLen(SCRIPT_SIG_LEN.INPUT[1]);
    assert.equal(res.dataLen, BigInt(8));
    assert.equal(res.scriptSigLen, BigInt(0));
  });

  it('validates vin length based on stated size', () => {
    let res;

    // valid
    res = BTCUtils.validateVin(OP_RETURN.VIN);
    assert.isTrue(res);

    // too many inputs stated
    res = BTCUtils.validateVin(INVALID_VIN_LEN[0]);
    assert.isFalse(res);

    // no inputs stated
    res = BTCUtils.validateVin(INVALID_VIN_LEN[1]);
    assert.isFalse(res);

    // fewer bytes in vin than stated
    res = BTCUtils.validateVin(INVALID_VIN_LEN[2]);
    assert.isFalse(res);

    // more bytes in vin than stated
    res = BTCUtils.validateVin(INVALID_VIN_LEN[3]);
    assert.isFalse(res);
  });

  it('validates vout length based on stated size', () => {
    let res;

    // valid
    res = BTCUtils.validateVout(OP_RETURN.VOUT);
    assert.isTrue(res);

    // too many outputs stated
    res = BTCUtils.validateVout(INVALID_VOUT_LEN[0]);
    assert.isFalse(res);

    // no outputs stated
    res = BTCUtils.validateVout(INVALID_VOUT_LEN[1]);
    assert.isFalse(res);

    // fewer bytes in vout than stated
    res = BTCUtils.validateVout(INVALID_VOUT_LEN[2]);
    assert.isFalse(res);

    // more bytes in vout than stated
    res = BTCUtils.validateVout(INVALID_VOUT_LEN[3]);
    assert.isFalse(res);
  });

  it('determines output length properly', () => {
    let res;

    res = BTCUtils.determineOutputLength(OUTPUT_LEN.INPUT[0]);
    assert.equal(res, BigInt(43));

    res = BTCUtils.determineOutputLength(OUTPUT_LEN.INPUT[1]);
    assert.equal(res, BigInt(31));

    res = BTCUtils.determineOutputLength(OUTPUT_LEN.INPUT[2]);
    assert.equal(res, BigInt(41));

    res = BTCUtils.determineOutputLength(OUTPUT_LEN.INPUT[3]);
    assert.equal(res, BigInt(11));

    res = BTCUtils.determineOutputLength(OUTPUT_LEN.INPUT[4]);
    assert.equal(res, BigInt(9));

    res = BTCUtils.determineOutputLength(OUTPUT_LEN.INPUT[5]);
    assert.equal(res, BigInt(145));

    try {
      res = BTCUtils.determineOutputLength(OUTPUT_LEN.INPUT[6]);
      assert(false, 'Expected an error');
    } catch (e) {
      assert.include(e.message, 'Multi-byte VarInts not supported');
    }
  });

  it('extracts outputs at specified indices', () => {
    let res;
    let arraysAreEqual;
    res = BTCUtils.extractOutputAtIndex(OP_RETURN.VOUT, 0);
    arraysAreEqual = utils.typedArraysAreEqual(res, OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractOutputAtIndex(OP_RETURN.VOUT, 1);
    arraysAreEqual = utils.typedArraysAreEqual(res, OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractOutputAtIndex(TWO_IN.TX_VOUT, 0);
    arraysAreEqual = utils.typedArraysAreEqual(res, INDEXED_OUTPUT[0]);

    res = BTCUtils.extractOutputAtIndex(TWO_IN.TX_VOUT, 1);
    arraysAreEqual = utils.typedArraysAreEqual(res, INDEXED_OUTPUT[1]);
  });

  it('extracts a root from a header', () => {
    const res = BTCUtils.extractMerkleRootBE(HEADER_170);
    const arraysAreEqual = utils.typedArraysAreEqual(res, HEADER.ROOT);
    assert.isTrue(arraysAreEqual);
  });

  it('extracts the target from a header', () => {
    const res = BTCUtils.extractTarget(HEADER_170);
    assert.equal(res, BigInt('26959535291011309493156476344723991336010898738574164086137773096960'));
  });

  it('extracts the prev block hash', () => {
    const res = BTCUtils.extractPrevBlockBE(HEADER_170);
    const u8aValue = HEADER.PREV_BLOCK_HASH;
    const arraysAreEqual = utils.typedArraysAreEqual(res, u8aValue);
    assert.isTrue(arraysAreEqual);
  });

  it('extracts a timestamp from a header', () => {
    const res = BTCUtils.extractTimestamp(HEADER_170);
    assert.equal(res, BigInt(HEADER.TIMESTAMP));
  });

  it('verifies a bitcoin merkle root', () => {
    let res;
    res = BTCUtils.verifyHash256Merkle(MERKLE_ROOT.TRUE[0], 0); // 0-indexed
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(MERKLE_ROOT.TRUE[1], 1); // 0-indexed
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(MERKLE_ROOT.TRUE[2], 4); // 0-indexed
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(OP_RETURN_PROOF, OP_RETURN_INDEX);
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(TWO_IN.PROOF, Number(TWO_IN.INDEX));
    assert.isTrue(res);

    // not evenly divisible by 32
    res = BTCUtils.verifyHash256Merkle(MERKLE_ROOT.FALSE[0], 0);
    assert.isFalse(res);

    // 1-hash special case
    res = BTCUtils.verifyHash256Merkle(MERKLE_ROOT.FALSE[1], 0);
    assert.isTrue(res);

    // 2-hash special case
    res = BTCUtils.verifyHash256Merkle(MERKLE_ROOT.FALSE[2], 0);
    assert.isFalse(res);
  });

  it('determines VarInt data lengths correctly', () => {
    let res;

    res = BTCUtils.determineVarIntDataLength(0x01);
    assert.equal(res, 0);
    res = BTCUtils.determineVarIntDataLength(0xfd);
    assert.equal(res, 2);
    res = BTCUtils.determineVarIntDataLength(0xfe);
    assert.equal(res, 4);
    res = BTCUtils.determineVarIntDataLength(0xff);
    assert.equal(res, 8);
  });

  it('calculates consensus-correct retargets', () => {
    let firstTimestamp;
    let secondTimestamp;
    let previousTarget;
    let expectedNewTarget;
    let res;
    for (let i = 0; i < RETARGET_TUPLES.length; i += 1) {
      firstTimestamp = RETARGET_TUPLES[i][0].timestamp;
      secondTimestamp = RETARGET_TUPLES[i][1].timestamp;
      previousTarget = BTCUtils.extractTarget(
        RETARGET_TUPLES[i][1].hex
      );
      expectedNewTarget = BTCUtils.extractTarget(
        RETARGET_TUPLES[i][2].hex
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
    for (let i = 0; i < RETARGET_TUPLES.length; i += 1) {
      actual = BTCUtils.extractDifficulty(
        RETARGET_TUPLES[i][0].hex
      );
      expected = RETARGET_TUPLES[i][0].difficulty;
      assert.equal(actual, expected);

      actual = BTCUtils.extractDifficulty(
        RETARGET_TUPLES[i][1].hex
      );
      expected = RETARGET_TUPLES[i][1].difficulty;
      assert.equal(actual, expected);

      actual = BTCUtils.extractDifficulty(
        RETARGET_TUPLES[i][2].hex
      );
      expected = RETARGET_TUPLES[i][2].difficulty;
      assert.equal(actual, expected);
    }
  });

  describe('#calculateDifficulty', () => {
    it('throws if passed the wrong type', () => {
      try {
        BTCUtils.calculateDifficulty(7);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Argument must be a BigInt');
      }
      try {
        BTCUtils.calculateDifficulty('7');
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Argument must be a BigInt');
      }
      try {
        BTCUtils.calculateDifficulty([]);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Argument must be a BigInt');
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
