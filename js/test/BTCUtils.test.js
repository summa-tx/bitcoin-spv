/* global it describe BigInt */
import * as chai from 'chai';
import * as utils from '../utils/utils';
import * as constants from './constants';
import * as BTCUtils from '../src/BTCUtils';
import {
  // EMPTY,
  HEADER_170,
  // OP_RETURN_TX,
  OP_RETURN_PROOF,
  OP_RETURN_INDEX,
  OUTPOINT,
  HASH_160,
  HASH_256,
  SEQUENCE_WITNESS,
  SEQUENCE_LEGACY,
  OUTPUT,
  INDEXED_INPUT,
  INDEXED_OUTPUT,
  LEGACY_INPUT,
  INPUT_LENGTH,
  SCRIPT_SIGS,
  SCRIPT_SIG_LEN,
  INVALID_VIN_LEN,
  INVALID_VOUT_LEN,
  OUTPUT_LEN,
  HEADER,
  MERKLE_ROOT,
  // HEADER_ERR,
  OP_RETURN,
  TWO_IN,
  // RETARGET_TUPLES
} from '../../testVectors.json';

const { assert } = chai;

/* eslint-disable-next-line */
const TWO_IN_TX = utils.deserializeHex(TWO_IN.TX);
const TWO_IN_TX_VIN = utils.deserializeHex(TWO_IN.TX_VIN);
const TWO_IN_TX_VOUT = utils.deserializeHex(TWO_IN.TX_VOUT);
const TWO_IN_PROOF = utils.deserializeHex(TWO_IN.PROOF);
const TWO_IN_INDEX = BigInt(TWO_IN.INDEX);


describe('BTCUtils', () => {
  it('implements bitcoin\'s hash160', () => {
    const res = BTCUtils.hash160(utils.deserializeHex(HASH_160.INPUT));
    const u8aValue = utils.deserializeHex(HASH_160.OUTPUT);
    const arraysAreEqual = utils.typedArraysAreEqual(res, u8aValue);
    assert.isTrue(arraysAreEqual);
  });

  it('implements bitcoin\'s hash256', () => {
    let res = BTCUtils.hash256(utils.deserializeHex(HASH_256[0].INPUT));
    let arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex(HASH_256[0].OUTPUT));
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.hash256(utils.deserializeHex(HASH_256[1].INPUT)); // 'abc' in utf - 8
    arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex(HASH_256[1].OUTPUT));
    assert.isTrue(arraysAreEqual);
  });

  it('extracts a sequence from a witness input as LE and int', () => {
    const input = utils.deserializeHex(constants.OP_RETURN.INPUTS);

    let res = BTCUtils.extractSequenceLEWitness(input);
    const arraysAreEqual = utils.typedArraysAreEqual(
      res,
      utils.deserializeHex(SEQUENCE_WITNESS.LE)
    );
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractSequenceWitness(input);
    assert.equal(res, BigInt(SEQUENCE_WITNESS.WITNESS));
  });

  it('extracts a sequence from a legacy input as LE and int', () => {
    const input = utils.deserializeHex(LEGACY_INPUT[0]);

    let res = BTCUtils.extractSequenceLELegacy(input);
    const arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex(SEQUENCE_LEGACY.LE));
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractSequenceLegacy(input);
    assert.equal(res, BigInt(SEQUENCE_LEGACY.LEGACY));
  });

  it('extracts an outpoint as bytes', () => {
    const input = constants.OP_RETURN.INPUTS;
    const res = BTCUtils.extractOutpoint(utils.deserializeHex(input));
    const u8aValue = utils.deserializeHex(OUTPOINT);
    const arraysAreEqual = utils.typedArraysAreEqual(res, u8aValue);
    assert.isTrue(arraysAreEqual);
  });

  /* Witness Output */
  it('extracts the length of the output script', () => {
    const output = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT);
    const opReturnOutput = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT);

    let res = BTCUtils.extractOutputScriptLen(output);
    assert.equal(res, 0x22);

    res = BTCUtils.extractOutputScriptLen(opReturnOutput);
    assert.equal(res, 0x16);
  });

  it('extracts the hash from an output', () => {
    const output = constants.OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT;
    const opReturnOutput = constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT;

    let res = BTCUtils.extractHash(utils.deserializeHex(output));
    let arraysAreEqual = utils.typedArraysAreEqual(
      res,
      utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].PAYLOAD)
    );
    assert.isTrue(arraysAreEqual);

    try {
      BTCUtils.extractHash(utils.deserializeHex(opReturnOutput));
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Nonstandard, OP_RETURN, or malformatted output');
    }

    // malformatted witness
    try {
      BTCUtils.extractHash(utils.deserializeHex(OUTPUT.MALFORMATTED.WITNESS));
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Maliciously formatted witness output.');
    }

    // malformatted p2pkh
    try {
      BTCUtils.extractHash(utils.deserializeHex(OUTPUT.MALFORMATTED.P2PKH[0]));
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Maliciously formatted p2pkh output.');
    }

    // malformatted p2pkh
    try {
      BTCUtils.extractHash(utils.deserializeHex(OUTPUT.MALFORMATTED.P2PKH[1]));
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Maliciously formatted p2pkh output.');
    }

    // good p2pkh
    res = BTCUtils.extractHash(utils.deserializeHex(OUTPUT.GOOD.P2PKH));
    arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex(`0x${'00'.repeat(20)}`));
    assert.isTrue(arraysAreEqual);

    // malformatted p2sh
    try {
      BTCUtils.extractHash(utils.deserializeHex(OUTPUT.MALFORMATTED.P2SH));
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Maliciously formatted p2sh output.');
    }

    // good p2sh
    res = BTCUtils.extractHash(utils.deserializeHex(OUTPUT.GOOD.P2SH));
    arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex(`0x${'00'.repeat(20)}`));
    assert.isTrue(arraysAreEqual);
  });

  it('extracts the value as LE and int', () => {
    let res;
    let arraysAreEqual;

    const output = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT);
    const outputLERes = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].VALUE_LE);

    res = BTCUtils.extractValueLE(output);
    arraysAreEqual = utils.typedArraysAreEqual(res, outputLERes);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractValue(output);
    assert.equal(res, BigInt(497480));

    const opReturnOutput = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT);
    const opReturnLERes = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].VALUE_LE);

    res = BTCUtils.extractValueLE(opReturnOutput);
    arraysAreEqual = utils.typedArraysAreEqual(res, opReturnLERes);
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractValue(opReturnOutput);
    assert.equal(res, BigInt(0));
  });

  it('extracts op_return data blobs', () => {
    const output = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT);
    const opReturnOutput = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT);

    const res = BTCUtils.extractOpReturnData(opReturnOutput);
    const arraysAreEqual = utils.typedArraysAreEqual(
      res,
      utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].PAYLOAD)
    );
    assert.isTrue(arraysAreEqual);

    try {
      BTCUtils.extractOpReturnData(output);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Malformatted data. Must be an op return.');
    }
  });

  it('extracts inputs at specified indices', () => {
    let res = BTCUtils.extractInputAtIndex(utils.deserializeHex(constants.OP_RETURN.VIN), 0);
    let arraysAreEqual = utils.typedArraysAreEqual(
      res,
      utils.deserializeHex(constants.OP_RETURN.INPUTS)
    );
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractInputAtIndex(TWO_IN_TX_VIN, 0);
    arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex(INDEXED_INPUT[0]));
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractInputAtIndex(TWO_IN_TX_VIN, 1);
    arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex(INDEXED_INPUT[1]));
    assert.isTrue(arraysAreEqual);
  });

  it('sorts legacy from witness inputs', () => {
    const input = constants.OP_RETURN.INPUTS;
    let res;
    res = BTCUtils.isLegacyInput(utils.deserializeHex(input));
    assert.isFalse(res);

    res = BTCUtils.isLegacyInput(utils.deserializeHex(LEGACY_INPUT[1]));
    assert.isTrue(res);
  });

  it('determines input length', () => {
    let res;
    res = BTCUtils.determineInputLength(utils.deserializeHex(INPUT_LENGTH[0]));
    assert.equal(res, BigInt(41));

    res = BTCUtils.determineInputLength(utils.deserializeHex(INPUT_LENGTH[1]));
    assert.equal(res, BigInt(41));

    res = BTCUtils.determineInputLength(utils.deserializeHex(INPUT_LENGTH[2]));
    assert.equal(res, BigInt(43));

    res = BTCUtils.determineInputLength(utils.deserializeHex(INPUT_LENGTH[3]));
    assert.equal(res, BigInt(50));

    res = BTCUtils.determineInputLength(utils.deserializeHex(INPUT_LENGTH[4]));
    assert.equal(res, BigInt(298));
  });

  it('extracts the scriptSig from inputs', () => {
    let res;
    let arraysAreEqual;
    res = BTCUtils.extractScriptSig(utils.deserializeHex(constants.OP_RETURN.INPUTS));
    arraysAreEqual = utils.typedArraysAreEqual(
      res,
      utils.deserializeHex(SCRIPT_SIGS[0].SCRIPT_SIG)
    );
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractScriptSig(utils.deserializeHex(SCRIPT_SIGS[1].INPUT));
    arraysAreEqual = utils.typedArraysAreEqual(
      res,
      utils.deserializeHex(SCRIPT_SIGS[1].SCRIPT_SIG)
    );
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractScriptSig(utils.deserializeHex(SCRIPT_SIGS[2].INPUT));
    arraysAreEqual = utils.typedArraysAreEqual(
      res,
      utils.deserializeHex(SCRIPT_SIGS[2].SCRIPT_SIG)
    );
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractScriptSig(utils.deserializeHex(SCRIPT_SIGS[3].INPUT));
    arraysAreEqual = utils.typedArraysAreEqual(
      res,
      utils.deserializeHex(SCRIPT_SIGS[3].SCRIPT_SIG)
    );
    assert.isTrue(arraysAreEqual);
  });

  it('extracts the length of the VarInt and scriptSig from inputs', () => {
    let res;
    res = BTCUtils.extractScriptSigLen(utils.deserializeHex(OP_RETURN.INPUTS));
    assert.equal(res.dataLen, BigInt(0));
    assert.equal(res.scriptSigLen, BigInt(0));

    res = BTCUtils.extractScriptSigLen(utils.deserializeHex(SCRIPT_SIG_LEN.INPUT[0]));
    assert.equal(res.dataLen, BigInt(0));
    assert.equal(res.scriptSigLen, BigInt(1));

    res = BTCUtils.extractScriptSigLen(utils.deserializeHex(SCRIPT_SIG_LEN.INPUT[1]));
    assert.equal(res.dataLen, BigInt(8));
    assert.equal(res.scriptSigLen, BigInt(0));
  });

  it('validates vin length based on stated size', () => {
    let res;

    // valid
    res = BTCUtils.validateVin(utils.deserializeHex(OP_RETURN.VIN));
    assert.isTrue(res);

    // too many inputs stated
    res = BTCUtils.validateVin(utils.deserializeHex(INVALID_VIN_LEN[0]));
    assert.isFalse(res);

    // no inputs stated
    res = BTCUtils.validateVin(utils.deserializeHex(INVALID_VIN_LEN[1]));
    assert.isFalse(res);

    // fewer bytes in vin than stated
    res = BTCUtils.validateVin(utils.deserializeHex(INVALID_VIN_LEN[2]));
    assert.isFalse(res);

    // more bytes in vin than stated
    res = BTCUtils.validateVin(utils.deserializeHex(INVALID_VIN_LEN[3]));
    assert.isFalse(res);
  });

  it('validates vout length based on stated size', () => {
    let res;

    // valid
    res = BTCUtils.validateVout(utils.deserializeHex(constants.OP_RETURN.VOUT));
    assert.isTrue(res);

    // too many outputs stated
    res = BTCUtils.validateVout(utils.deserializeHex(INVALID_VOUT_LEN[0]));
    assert.isFalse(res);

    // no outputs stated
    res = BTCUtils.validateVout(utils.deserializeHex(INVALID_VOUT_LEN[1]));
    assert.isFalse(res);

    // fewer bytes in vout than stated
    res = BTCUtils.validateVout(utils.deserializeHex(INVALID_VOUT_LEN[2]));
    assert.isFalse(res);

    // more bytes in vout than stated
    res = BTCUtils.validateVout(utils.deserializeHex(INVALID_VOUT_LEN[3]));
    assert.isFalse(res);
  });

  it('determines output length properly', () => {
    let res;

    res = BTCUtils.determineOutputLength(utils.deserializeHex(OUTPUT_LEN.INPUT[0]));
    assert.equal(res, BigInt(43));

    res = BTCUtils.determineOutputLength(utils.deserializeHex(OUTPUT_LEN.INPUT[1]));
    assert.equal(res, BigInt(31));

    res = BTCUtils.determineOutputLength(utils.deserializeHex(OUTPUT_LEN.INPUT[2]));
    assert.equal(res, BigInt(41));

    res = BTCUtils.determineOutputLength(utils.deserializeHex(OUTPUT_LEN.INPUT[3]));
    assert.equal(res, BigInt(11));

    res = BTCUtils.determineOutputLength(utils.deserializeHex(OUTPUT_LEN.INPUT[4]));
    assert.equal(res, BigInt(9));

    res = BTCUtils.determineOutputLength(utils.deserializeHex(OUTPUT_LEN.INPUT[5]));
    assert.equal(res, BigInt(145));

    try {
      res = BTCUtils.determineOutputLength(utils.deserializeHex(OUTPUT_LEN.INPUT[6]));
      assert(false, 'Expected an error');
    } catch (e) {
      assert.include(e.message, 'Multi-byte VarInts not supported');
    }
  });

  it('extracts outputs at specified indices', () => {
    let res;
    let arraysAreEqual;
    res = BTCUtils.extractOutputAtIndex(utils.deserializeHex(constants.OP_RETURN.VOUT), 0);
    arraysAreEqual = utils.typedArraysAreEqual(
      res,
      utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT)
    );
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractOutputAtIndex(utils.deserializeHex(constants.OP_RETURN.VOUT), 1);
    arraysAreEqual = utils.typedArraysAreEqual(
      res,
      utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT)
    );
    assert.isTrue(arraysAreEqual);

    res = BTCUtils.extractOutputAtIndex(TWO_IN_TX_VOUT, 0);
    arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex(INDEXED_OUTPUT[0]));

    res = BTCUtils.extractOutputAtIndex(TWO_IN_TX_VOUT, 1);
    arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex(INDEXED_OUTPUT[1]));
  });

  it('extracts a root from a header', () => {
    const res = BTCUtils.extractMerkleRootBE(utils.deserializeHex(HEADER_170));
    const u8aValue = utils.deserializeHex(HEADER.ROOT);
    const arraysAreEqual = utils.typedArraysAreEqual(res, u8aValue);
    assert.isTrue(arraysAreEqual);
  });

  it('extracts the target from a header', () => {
    const res = BTCUtils.extractTarget(utils.deserializeHex(HEADER_170));
    assert.equal(res, BigInt('26959535291011309493156476344723991336010898738574164086137773096960'));
  });

  it('extracts the prev block hash', () => {
    const res = BTCUtils.extractPrevBlockBE(utils.deserializeHex(HEADER_170));
    const u8aValue = utils.deserializeHex(HEADER.PREV_BLOCK_HASH);
    const arraysAreEqual = utils.typedArraysAreEqual(res, u8aValue);
    assert.isTrue(arraysAreEqual);
  });

  it('extracts a timestamp from a header', () => {
    const res = BTCUtils.extractTimestamp(utils.deserializeHex(HEADER_170));
    assert.equal(res, BigInt(HEADER.TIMESTAMP));
  });

  it('verifies a bitcoin merkle root', () => {
    let res;
    res = BTCUtils.verifyHash256Merkle(utils.deserializeHex(MERKLE_ROOT.TRUE[0]), 0); // 0-indexed
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(utils.deserializeHex(MERKLE_ROOT.TRUE[1]), 1); // 0-indexed
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(utils.deserializeHex(MERKLE_ROOT.TRUE[2]), 4); // 0-indexed
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(utils.deserializeHex(OP_RETURN_PROOF), OP_RETURN_INDEX);
    assert.isTrue(res);

    res = BTCUtils.verifyHash256Merkle(TWO_IN_PROOF, Number(TWO_IN_INDEX));
    assert.isTrue(res);

    // not evenly divisible by 32
    res = BTCUtils.verifyHash256Merkle(utils.deserializeHex(MERKLE_ROOT.FALSE[0]), 0);
    assert.isFalse(res);

    // 1-hash special case
    res = BTCUtils.verifyHash256Merkle(utils.deserializeHex(MERKLE_ROOT.FALSE[1]), 0);
    assert.isTrue(res);

    // 2-hash special case
    res = BTCUtils.verifyHash256Merkle(utils.deserializeHex(MERKLE_ROOT.FALSE[2]), 0);
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
    for (let i = 0; i < constants.RETARGET_TUPLES.length; i += 1) {
      firstTimestamp = constants.RETARGET_TUPLES[i][0].timestamp;
      secondTimestamp = constants.RETARGET_TUPLES[i][1].timestamp;
      previousTarget = BTCUtils.extractTarget(
        utils.deserializeHex(constants.RETARGET_TUPLES[i][1].hex)
      );
      expectedNewTarget = BTCUtils.extractTarget(
        utils.deserializeHex(constants.RETARGET_TUPLES[i][2].hex)
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
    for (let i = 0; i < constants.RETARGET_TUPLES.length; i += 1) {
      actual = BTCUtils.extractDifficulty(
        utils.deserializeHex(constants.RETARGET_TUPLES[i][0].hex)
      );
      expected = constants.RETARGET_TUPLES[i][0].difficulty;
      assert.equal(actual, expected);

      actual = BTCUtils.extractDifficulty(
        utils.deserializeHex(constants.RETARGET_TUPLES[i][1].hex)
      );
      expected = constants.RETARGET_TUPLES[i][1].difficulty;
      assert.equal(actual, expected);

      actual = BTCUtils.extractDifficulty(
        utils.deserializeHex(constants.RETARGET_TUPLES[i][2].hex)
      );
      expected = constants.RETARGET_TUPLES[i][2].difficulty;
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
