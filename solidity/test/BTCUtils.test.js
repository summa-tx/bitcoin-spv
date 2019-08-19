/* global artifacts contract before it assert */
const BN = require('bn.js');
const constants = require('./constants');
let vectors = require('../../testVectors.json');

const {
  HEADER_170,
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
  LAST_BYTES,
  REVERSE_ENDIANNESS,
  LARGE_BYTES,
  OP_RETURN,
  TWO_IN,
  RETARGET_TUPLES
} = JSON.parse(JSON.stringify(vectors));

const BTCUtilsDelegate = artifacts.require('BTCUtilsTest');

contract('BTCUtils', () => {
  let instance;

  before(async () => {
    instance = await BTCUtilsDelegate.new();
  });

  it('gets the last bytes correctly', async () => {
    const res = await instance.lastBytes(LAST_BYTES.INPUT, 2);
    assert.equal(res, LAST_BYTES.OUTPUT);
  });

  it('errors if slice is larger than the bytearray', async () => {
    try {
      await instance.lastBytes('0x00', 2);
      assert(false, 'expected an errror');
    } catch (e) {
      assert.include(e.message, 'Underflow during subtraction.');
    }
  });

  it('reverses endianness', async () => {
    let res = await instance.reverseEndianness(REVERSE_ENDIANNESS[0].BE);
    assert.equal(res, REVERSE_ENDIANNESS[0].LE);
    res = await instance.reverseEndianness(REVERSE_ENDIANNESS[1].BE);
    assert.equal(res, REVERSE_ENDIANNESS[1].LE);
  });

  it('converts big-endian bytes to integers', async () => {
    let res = await instance.bytesToUint('0x00');
    assert(res, new BN('0', 10));

    res = await instance.bytesToUint('0xff');
    assert(res, new BN('255', 10));

    res = await instance.bytesToUint('0x00ff');
    assert(res, new BN('255', 10));

    res = await instance.bytesToUint('0xff00');
    assert(res, new BN('65280', 10));

    res = await instance.bytesToUint('0x01');
    assert(res, new BN('1', 10));

    res = await instance.bytesToUint('0x0001');
    assert(res, new BN('1', 10));

    res = await instance.bytesToUint('0x0100');
    assert(res, new BN('256', 10));

    // max uint256: (2^256)-1
    res = await instance.bytesToUint(LARGE_BYTES);
    assert(
      res, new BN('115792089237316195423570985008687907853269984665640564039457584007913129639935', 10)
    );
  });

  it('implements bitcoin\'s hash160', async () => {
    let res;
    res = await instance.hash160(HASH_160[1].INPUT);
    assert.equal(res, HASH_160[1].OUTPUT);
    res = await instance.hash160(HASH_160[0].INPUT);
    assert.equal(res, HASH_160[0].OUTPUT);
  });

  it('implements bitcoin\'s hash256', async () => {
    let res;
    res = await instance.hash256(HASH_256[0].INPUT);
    assert.equal(res, HASH_256[0].OUTPUT);
    res = await instance.hash256(HASH_256[1].INPUT); // 'abc' in utf-8
    assert.equal(res, HASH_256[1].OUTPUT);
  });

  it('extracts a sequence from a witness input as LE and int', async () => {
    const input = OP_RETURN.INPUTS;
    let res;
    res = await instance.extractSequenceLEWitness(input);
    assert.equal(res, SEQUENCE_WITNESS.LE);
    res = await instance.extractSequenceWitness(input);
    assert(res.eq(new BN(SEQUENCE_WITNESS.WITNESS, 16)));
  });

  it('extracts a sequence from a legacy input as LE and int', async () => {
    const input = LEGACY_INPUT[0]
    let res;
    res = await instance.extractSequenceLELegacy(input);
    assert.equal(res, SEQUENCE_LEGACY.LE);
    res = await instance.extractSequenceLegacy(input);
    assert(res.eq(new BN(SEQUENCE_LEGACY.LEGACY, 16)));
  });

  it('extracts an outpoint as bytes', async () => {
    const input = OP_RETURN.INPUTS;
    const res = await instance.extractOutpoint(input);
    assert.equal(res, OUTPOINT);
  });

  /* Witness Output */
  it('extracts the length of the output script', async () => {
    let res;
    const output = OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT;
    const opReturnOutput = OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT;
    res = await instance.extractOutputScriptLen(output);
    assert.equal(res, '0x22');
    res = await instance.extractOutputScriptLen(opReturnOutput);
    assert.equal(res, '0x16');
  });

  it('extracts the hash from an output', async () => {
    const output = OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT;
    const opReturnOutput = OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT;
    let res = await instance.extractHash(output);
    assert.equal(res, OP_RETURN.INDEXED_OUTPUTS[0].PAYLOAD);

    res = await instance.extractHash(opReturnOutput);
    assert.isNull(res);

    // malformatted witness
    res = await instance.extractHash(OUTPUT.MALFORMATTED.WITNESS);
    assert.isNull(res);

    // malformatted p2pkh
    res = await instance.extractHash(OUTPUT.MALFORMATTED.P2PKH[0]);
    assert.isNull(res);

    // malformatted p2pkh
    res = await instance.extractHash(OUTPUT.MALFORMATTED.P2PKH[1]);
    assert.isNull(res);

    // good p2pkh
    res = await instance.extractHash(OUTPUT.GOOD.P2PKH);
    assert.equal(res, `0x${'00'.repeat(20)}`);

    // malformatted p2sh
    res = await instance.extractHash(OUTPUT.MALFORMATTED.P2SH);
    assert.isNull(res);

    // good p2sh
    res = await instance.extractHash(OUTPUT.GOOD.P2SH);
    assert.equal(res, `0x${'00'.repeat(20)}`);
  });

  it('extracts the value as LE and int', async () => {
    let res;

    const output = OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT;
    res = await instance.extractValueLE(output);
    assert.equal(res, OP_RETURN.INDEXED_OUTPUTS[0].VALUE_LE);
    res = await instance.extractValue(output);
    assert(res.eq(new BN('079748', 16)));

    const opReturnOutput = OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT;
    res = await instance.extractValueLE(opReturnOutput);
    assert.equal(res, OP_RETURN.INDEXED_OUTPUTS[1].VALUE_LE);
    res = await instance.extractValue(opReturnOutput);
    assert(res.eq(new BN('00', 16)));
  });

  it('extracts op_return data blobs', async () => {
    const output = OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT;
    const opReturnOutput = OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT;
    let res = await instance.extractOpReturnData(opReturnOutput);
    assert.equal(res, OP_RETURN.INDEXED_OUTPUTS[1].PAYLOAD);

    res = await instance.extractOpReturnData(output);
    assert.isNull(res);
  });

  it('extracts inputs at specified indices', async () => {
    let res;
    res = await instance.extractInputAtIndex(OP_RETURN.VIN, 0);
    assert.equal(res, OP_RETURN.INPUTS);
    res = await instance.extractInputAtIndex(TWO_IN.TX_VIN, 0);
    assert.equal(res, INDEXED_INPUT[0]);
    res = await instance.extractInputAtIndex(TWO_IN.TX_VIN, 1);
    assert.equal(res, INDEXED_INPUT[1]);
  });

  it('sorts legacy from witness inputs', async () => {
    let res;
    res = await instance.isLegacyInput(OP_RETURN.INPUTS);
    assert.isFalse(res);

    res = await instance.isLegacyInput(LEGACY_INPUT[1]);
    assert.isTrue(res);
  });

  it('extracts the scriptSig from inputs', async () => {
    let res;
    res = await instance.extractScriptSig(OP_RETURN.INPUTS);
    assert.equal(res, SCRIPT_SIGS[0].SCRIPT_SIG);

    res = await instance.extractScriptSig(SCRIPT_SIGS[1].INPUT);
    assert.equal(res, SCRIPT_SIGS[1].SCRIPT_SIG);

    res = await instance.extractScriptSig(SCRIPT_SIGS[2].INPUT);
    assert.equal(res, SCRIPT_SIGS[2].SCRIPT_SIG);

    res = await instance.extractScriptSig(SCRIPT_SIGS[3].INPUT);
    assert.equal(res, SCRIPT_SIGS[3].SCRIPT_SIG);
  });

  it('extracts the length of the VarInt and scriptSig from inputs', async () => {
    let res;
    res = await instance.extractScriptSigLen(OP_RETURN.INPUTS);
    assert(res[0].eq(new BN('0', 10)));
    assert(res[1].eq(new BN('0', 10)));

    res = await instance.extractScriptSigLen(SCRIPT_SIG_LEN.INPUT[0]);
    assert(res[0].eq(new BN('0', 10)));
    assert(res[1].eq(new BN('1', 10)));

    res = await instance.extractScriptSigLen(SCRIPT_SIG_LEN.INPUT[1]);
    assert(res[0].eq(new BN('8', 10)));
    assert(res[1].eq(new BN('0', 10)));
  });

  it('validates vin length based on stated size', async () => {
    let res;

    // valid
    res = await instance.validateVin(OP_RETURN.VIN);
    assert.isTrue(res);

    // too many inputs stated
    res = await instance.validateVin(INVALID_VIN_LEN[0]);
    assert.isFalse(res);

    // no inputs stated
    res = await instance.validateVin(INVALID_VIN_LEN[1]);
    assert.isFalse(res);

    // fewer bytes in vin than stated
    res = await instance.validateVin(INVALID_VIN_LEN[2]);
    assert.isFalse(res);

    // more bytes in vin than stated
    res = await instance.validateVin(INVALID_VIN_LEN[3]);
    assert.isFalse(res);
  });

  it('validates vout length based on stated size', async () => {
    let res;

    // valid
    res = await instance.validateVout(OP_RETURN.VOUT);
    assert.isTrue(res);

    // too many outputs stated
    res = await instance.validateVout(INVALID_VOUT_LEN[0]);
    assert.isFalse(res);

    // no outputs stated
    res = await instance.validateVout(INVALID_VOUT_LEN[0]);
    assert.isFalse(res);

    // fewer bytes in vout than stated
    res = await instance.validateVout(INVALID_VOUT_LEN[0]);
    assert.isFalse(res);

    // more bytes in vout than stated
    res = await instance.validateVout(INVALID_VOUT_LEN[0]);
    assert.isFalse(res);
  });

  it('determines output length properly', async () => {
    let res;
    res = await instance.determineOutputLength(OUTPUT_LEN.INPUT[0]);
    assert(res.eq(new BN('43', 10)));
    res = await instance.determineOutputLength(OUTPUT_LEN.INPUT[1]);
    assert(res.eq(new BN('31', 10)));
    res = await instance.determineOutputLength(OUTPUT_LEN.INPUT[2]);
    assert(res.eq(new BN('41', 10)));
    res = await instance.determineOutputLength(OUTPUT_LEN.INPUT[3]);
    assert(res.eq(new BN('11', 10)));
    res = await instance.determineOutputLength(OUTPUT_LEN.INPUT[4]);
    assert(res.eq(new BN('9', 10)));
    res = await instance.determineOutputLength(OUTPUT_LEN.INPUT[5]);
    assert(res.eq(new BN('145', 10)));
    try {
      res = await instance.determineOutputLength(OUTPUT_LEN.INPUT[6]);
      assert(false, 'Expected an error');
    } catch (e) {
      assert.include(e.message, 'Multi-byte VarInts not supported');
    }
  });

  it('extracts outputs at specified indices', async () => {
    let res;
    res = await instance.extractOutputAtIndex(OP_RETURN.VOUT, 0);
    assert.equal(res, OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT);
    res = await instance.extractOutputAtIndex(OP_RETURN.VOUT, 1);
    assert.equal(res, OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT);
    res = await instance.extractOutputAtIndex(TWO_IN_.X_VOUT, 0);
    assert.equal(res, INDEXED_OUTPUT[0]);
    res = await instance.extractOutputAtIndex(TWO_IN.TX_VOUT, 1);
    assert.equal(res, INDEXED_OUTPUT[1]);
  });

  it('extracts a root from a header', async () => {
    const res = await instance.extractMerkleRootBE(HEADER_170);
    assert.equal(res, HEADER.ROOT);
  });

  it('extracts the target from a header', async () => {
    const res = await instance.extractTarget(HEADER_170);
    assert(res.eq(new BN('26959535291011309493156476344723991336010898738574164086137773096960', 10)));
  });

  it('extracts the prev block hash', async () => {
    const res = await instance.extractPrevBlockBE(HEADER_170);
    assert.equal(res, HEADER.PREV_BLOCK_HASH);
  });

  it('extracts a timestamp from a header', async () => {
    const res = await instance.extractTimestamp(HEADER_170);
    assert(res.eq(new BN(HEADER.TIMESTAMP, 10)));
  });

  it('verifies a bitcoin merkle root', async () => {
    let res;
    res = await instance.verifyHash256Merkle(MERKLE_ROOT.TRUE[0], 0); // 0-indexed
    assert.isTrue(res);

    res = await instance.verifyHash256Merkle(MERKLE_ROOT.TRUE[1], 1); // 0-indexed
    assert.isTrue(res);

    res = await instance.verifyHash256Merkle(MERKLE_ROOT.TRUE[2], 4); // 0-indexed
    assert.isTrue(res);

    res = await instance.verifyHash256Merkle(OP_RETURN_PROOF, OP_RETURN_INDEX);
    assert.isTrue(res);

    res = await instance.verifyHash256Merkle(TWO_IN.PROOF, TWO_IN.INDEX);
    assert.isTrue(res);

    // not evenly divisible by 32
    res = await instance.verifyHash256Merkle(MERKLE_ROOT.FALSE[0], 0);
    assert.isFalse(res);

    // 1-hash special case
    res = await instance.verifyHash256Merkle(MERKLE_ROOT.FALSE[1], 0);
    assert.isTrue(res);

    // 2-hash special case
    res = await instance.verifyHash256Merkle(MERKLE_ROOT.FALSE[2], 0);
    assert.isFalse(res);
  });

  it('determines VarInt data lengths correctly', async () => {
    let res;

    res = await instance.determineVarIntDataLength('0x01');
    assert(res.eq(new BN(0, 10)));
    res = await instance.determineVarIntDataLength('0xfd');
    assert(res.eq(new BN(2, 10)));
    res = await instance.determineVarIntDataLength('0xfe');
    assert(res.eq(new BN(4, 10)));
    res = await instance.determineVarIntDataLength('0xff');
    assert(res.eq(new BN(8, 10)));
  });

  it('calculates consensus-correct retargets', async () => {
    /* eslint-disable no-await-in-loop */
    let firstTimestamp;
    let secondTimestamp;
    let previousTarget;
    let expectedNewTarget;
    let res;
    for (let i = 0; i < RETARGET_TUPLES.length; i += 1) {
      firstTimestamp = RETARGET_TUPLES[i][0].timestamp;
      secondTimestamp = RETARGET_TUPLES[i][1].timestamp;
      previousTarget = await instance.extractTarget.call(`0x${RETARGET_TUPLES[i][1].hex}`);
      expectedNewTarget = await instance.extractTarget.call(`0x${RETARGET_TUPLES[i][2].hex}`);
      res = await instance.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
      // (response & expected) == expected
      // this converts our full-length target into truncated block target
      assert(res.uand(expectedNewTarget).eq(expectedNewTarget));

      secondTimestamp = firstTimestamp + 5 * 2016 * 10 * 60; // longer than 4x
      res = await instance.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
      assert(res.divn(4).uand(previousTarget).eq(previousTarget));

      secondTimestamp = firstTimestamp + 2016 * 10 * 14; // shorter than 1/4x
      res = await instance.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
      assert(res.muln(4).uand(previousTarget).eq(previousTarget));
    }
    /* eslint-enable no-await-in-loop */
  });

  it('extracts difficulty from a header', async () => {
    let actual;
    let expected;
    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < RETARGET_TUPLES.length; i += 1) {
      actual = await instance.extractDifficulty(`0x${RETARGET_TUPLES[i][0].hex}`);
      expected = RETARGET_TUPLES[i][0].difficulty;
      assert(actual.eq(expected));

      actual = await instance.extractDifficulty(`0x${RETARGET_TUPLES[i][1].hex}`);
      expected = RETARGET_TUPLES[i][1].difficulty;
      assert(actual.eq(expected));

      actual = await instance.extractDifficulty(`0x${RETARGET_TUPLES[i][2].hex}`);
      expected = RETARGET_TUPLES[i][2].difficulty;
      assert(actual.eq(expected));
    }
    /* eslint-enable no-await-in-loop */
  });
});
