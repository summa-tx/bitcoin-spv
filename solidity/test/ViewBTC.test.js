/* global artifacts contract before it assert */
const BN = require('bn.js');

/* eslint-disable-next-line no-unresolved */
const vectors = require('./testVectors.json');

const BTCUtilsDelegate = artifacts.require('ViewBTCTest');

const {
  reverseEndianness,
  bytesToUint,
  hash160,
  hash256,
  hash256MerkleStep,
  extractOutpoint,
  extractInputTxIdLE,
  extractTxIndexLE,
  extractSequenceLEWitness,
  extractSequenceWitness,
  extractSequenceLELegacy,
  extractSequenceLegacy,
  extractSequenceLegacyError,
  extractOutputScriptLen,
  extractHash,
  extractHashError,
  extractOpReturnData,
  extractOpReturnDataError,
  extractInputAtIndex,
  extractInputAtIndexError,
  isLegacyInput,
  extractValueLE,
  extractValue,
  determineInputLength,
  extractScriptSig,
  extractScriptSigError,
  extractScriptSigLen,
  validateVin,
  validateVout,
  determineOutputLength,
  extractOutputAtIndex,
  extractOutputAtIndexError,
  extractMerkleRootLE,
  extractTarget,
  extractPrevBlockLE,
  extractTimestamp,
  verifyHash256Merkle,
  determineVarIntDataLength,
  parseVarInt,
  parseVarIntError,
  retargetAlgorithm
} = vectors;

contract('BTCUtils', () => {
  let instance;

  before(async () => {
    instance = await BTCUtilsDelegate.new();
  });

  // TODO: test vectors/tests for inputLength and outputLength

  // it('reverses endianness', async () => {
  //   for (let i = 0; i < reverseEndianness.length; i += 1) {
  //     const res = await instance.reverseEndianness(reverseEndianness[i].input);
  //     assert.strictEqual(res, reverseEndianness[i].output);
  //   }
  // });

  // it('converts big-endian bytes to integers', async () => {
  //   for (let i = 0; i < bytesToUint.length; i += 1) {
  //     const res = await instance.bytesToUint(bytesToUint[i].input);
  //     assert(res, new BN(bytesToUint[i].output, 10));
  //   }

  //   // max uint256: (2^256)-1
  //   const res = await instance.bytesToUint(`0x${'ff'.repeat(32)}`);
  //   assert(
  //     res, new BN('115792089237316195423570985008687907853269984665640564039457584007913129639935', 10)
  //   );
  // });

  it('implements bitcoin\'s hash160', async () => {
    for (let i = 0; i < hash160.length; i += 1) {
      const res = await instance.hash160(hash160[i].input);
      assert.strictEqual(hash160[i].output, res);
    }
  });

  it('implements bitcoin\'s hash256', async () => {
    for (let i = 0; i < hash256.length; i += 1) {
      const res = await instance.hash256(hash256[i].input);
      assert.strictEqual(hash256[i].output, res);
    }
  });

  // it('implements hash256MerkleStep', async () => {
  //   for (let i = 0; i < hash256MerkleStep.length; i += 1) {
  //     /* eslint-disable-next-line */
  //     const res = await instance._hash256MerkleStep(
  //       hash256MerkleStep[i].input[0],
  //       hash256MerkleStep[i].input[1]
  //     );
  //     assert.strictEqual(res, hash256MerkleStep[i].output);
  //   }
  // });

  it('extracts a sequence from a witness input as LE and int', async () => {
    for (let i = 0; i < extractSequenceLEWitness.length; i += 1) {
      const res = await instance.sequence(extractSequenceLEWitness[i].input);
      const expected = new BN(extractSequenceLEWitness[i].output.slice(2), 16)
      assert(res.eq(expected));
    }

    // for (let i = 0; i < extractSequenceWitness.length; i += 1) {
    //   const res = await instance.extractSequenceWitness(extractSequenceWitness[i].input);
    //   assert(res.eq(new BN(extractSequenceWitness[i].output, 16)));
    // }
  });

  it('extracts a sequence from a legacy input as LE and int', async () => {
    for (let i = 0; i < extractSequenceLELegacy.length; i += 1) {
      const res = await instance.sequence(extractSequenceLELegacy[i].input);
      const expected = new BN(extractSequenceLELegacy[i].output.slice(2), 16)
      assert(res.eq(expected))
    }

    // for (let i = 0; i < extractSequenceLegacy.length; i += 1) {
    //   const res = await instance.extractSequenceLegacy(extractSequenceLegacy[i].input);
    //   assert(res.eq(new BN(extractSequenceLegacy[i].output, 16)));
    // }
  });

  // it('errors on bad varints in extractSequenceLegacy', async () => {
  //   for (let i = 0; i < extractSequenceLegacyError.length; i += 1) {
  //     try {
  //       await instance.extractSequenceLegacy(
  //         extractSequenceLegacyError[i].input
  //       );
  //       assert(false, 'expected an error');
  //     } catch (e) {
  //       assert.include(e.message, extractSequenceLegacyError[i].solidityError);
  //     }
  //   }
  // });

  it('extracts an outpoint as bytes', async () => {
    for (let i = 0; i < extractOutpoint.length; i += 1) {
      const res = await instance.outpoint(extractOutpoint[i].input);
      assert.strictEqual(extractOutpoint[i].output, res);
    }
  });

  // TODO: come back to this - needs json test vectors?
  // it('extracts an outpoint as an integer', async () => {
  //   for (let i = 0; i < extractOutpoint.length; i += 1) {
  //     const res = await instance.outpointIdx(extractOutpoint[i].input);
  //     const expected = // index as an integer
  //     assert.strictEqual(expected, res);
  //   }
  // });

  it('extracts a txid from an outpoint', async () => {
    for (let i = 0; i < extractInputTxIdLE.length; i += 1) {
      const outpoint = await instance.outpoint(extractInputTxIdLE[i].input)
      const res = await instance.txidLE(outpoint);
      assert.strictEqual(extractInputTxIdLE[i].output, res);
    }
  });

  // it('extracts an outpoint tx index LE', async () => {
  //   for (let i = 0; i < extractTxIndexLE.length; i += 1) {
  //     const res = await instance.extractTxIndexLE(extractTxIndexLE[i].input);
  //     assert.strictEqual(res, extractTxIndexLE[i].output);
  //   }
  // });

  // /* Witness Output */
  // it('extracts the length of the output script', async () => {
  //   for (let i = 0; i < extractOutputScriptLen.length; i += 1) {
  //     const res = await instance.extractOutputScriptLen(extractOutputScriptLen[i].input);
  //     if (Object.prototype.hasOwnProperty.call(extractOutputScriptLen[i], 'solOutput')) {
  //       assert.strictEqual(res, extractOutputScriptLen[i].solOutput);
  //     } else {
  //       assert.strictEqual(res, extractOutputScriptLen[i].output);
  //     }
  //   }
  // });

  // it('extracts the hash from a standard output', async () => {
  //   for (let i = 0; i < extractHash.length; i += 1) {
  //     const res = await instance.extractHash(extractHash[i].input);
  //     assert.strictEqual(res, extractHash[i].output);
  //   }

  //   for (let i = 0; i < extractHashError.length; i += 1) {
  //     const res = await instance.extractHash(extractHashError[i].input);
  //     assert.isNull(res);
  //   }
  // });

  // TODO: Come back to this - Probably just need to convert bytes to integer or visa versa...
  // #1
  // expected: 497480
  // actual: '0x4897070000000000'

  // #2
  // expected: 0
  // actual: '0x0000000000000000'
  // it('extracts the value as LE and int', async () => {
  //   for (let i = 0; i < extractValue.length; i += 1) {
  //     const res = await instance.valueBytes(extractValue[1].input);
  //     assert.strictEqual(extractValue[1].output, res);
  //   }
  // });

  // it('determines input length', async () => {
  //   for (let i = 0; i < determineInputLength.length; i += 1) {
  //     const res = await instance.determineInputLength(determineInputLength[i].input);
  //     assert(res.eq(new BN(determineInputLength[i].output, 10)));
  //   }
  // });

  // it('extracts op_return data blobs', async () => {
  //   for (let i = 0; i < extractOpReturnData.length; i += 1) {
  //     const res = await instance.opReturnPayload(extractOpReturnData[i].input);
  //     assert.strictEqual(extractOpReturnData[i].output, res);
  //   }

  //   // for (let i = 0; i < extractOpReturnDataError.length; i += 1) {
  //   //   try {
  //   //     const res = await instance.extractOpReturnData(extractOpReturnDataError[i].input);
  //   //     assert(!(extractOpReturnDataError[i].solidityError), 'expected an error message');
  //   //     assert.isNull(res);
  //   //   } catch (e) {
  //   //     assert.include(e.message, extractOpReturnDataError[i].solidityError);
  //   //   }
  //   // }
  // });

  // TODO: come back to this
  // error - "TypedMemView/index - Overran the view."
  // it('extracts inputs at specified indices', async () => {
  //   for (let i = 0; i < extractInputAtIndex.length; i += 1) {
  //     const res = await instance.indexVin(
  //       extractInputAtIndex[i].input.vin,
  //       extractInputAtIndex[i].input.index
  //     );
  //     assert.strictEqual(res, extractInputAtIndex[i].output);
  //   }
  // });

  // it('extract input errors on bad vin', async () => {
  //   for (let i = 0; i < extractInputAtIndexError.length; i += 1) {
  //     try {
  //       await instance.extractInputAtIndex(
  //         extractInputAtIndexError[i].input.vin,
  //         extractInputAtIndexError[i].input.index
  //       );
  //       assert(false, 'expected an error');
  //     } catch (e) {
  //       assert.include(e.message, extractInputAtIndexError[i].solidityError, `${extractInputAtIndexError[i].input.vin} ${extractInputAtIndexError[i].input.index}`);
  //     }
  //   }
  // });

  // it('sorts legacy from witness inputs', async () => {
  //   for (let i = 0; i < isLegacyInput.length; i += 1) {
  //     const res = await instance.isLegacyInput(isLegacyInput[i].input);
  //     assert.strictEqual(isLegacyInput[i].output, res);
  //   }
  // });

  // TODO: come back to this
  // #1
  // expected: "0x00"
  // actual: "0x00"

  // #2
  // expected: "0x01ee"
  // actual: "0x01ee"

  // #3
  // expected: "0xfd0100ee"
  // actual: "0xfd01"

  // #4
  // expected: "0xfe01000000ee"
  // actual: "0xfe01"
  // it('extracts the scriptSig from inputs', async () => {
  //   for (let i = 0; i < extractScriptSig.length; i += 1) {
  //     const res = await instance.scriptSig(extractScriptSig[3].input);
  //     assert.strictEqual(extractScriptSig[3].output, res);
  //   }
  // });

  // it('errors on bad varints in extractScriptSig', async () => {
  //   for (let i = 0; i < extractScriptSigError.length; i += 1) {
  //     try {
  //       await instance.extractScriptSig(
  //         extractScriptSigError[i].input
  //       );
  //       assert(false, 'expected an error');
  //     } catch (e) {
  //       assert.include(e.message, extractScriptSigError[i].solidityError);
  //     }
  //   }
  // });

  // it('extracts the length of the VarInt and scriptSig from inputs', async () => {
  //   for (let i = 0; i < extractScriptSigLen.length; i += 1) {
  //     const res = await instance.extractScriptSigLen(extractScriptSigLen[i].input);
  //     assert(res[0].eq(new BN(extractScriptSigLen[i].output[0], 10)));
  //     assert(res[1].eq(new BN(extractScriptSigLen[i].output[1], 10)));
  //   }
  // });

  // it('validates vin length based on stated size', async () => {
  //   for (let i = 0; i < validateVin.length; i += 1) {
  //     const res = await instance.validateVin(validateVin[i].input);
  //     assert.strictEqual(res, validateVin[i].output);
  //   }
  // });

  // it('validates vout length based on stated size', async () => {
  //   for (let i = 0; i < validateVout.length; i += 1) {
  //     if (validateVout[i].solidityError) {
  //       try {
  //         await instance.validateVout(validateVout[i].input);
  //         assert(false, 'expected an error');
  //       } catch (e) {
  //         assert.include(e.message, validateVout[i].solidityError);
  //       }
  //     } else {
  //       const res = await instance.validateVout(validateVout[i].input);
  //       assert.strictEqual(res, validateVout[i].output);
  //     }
  //   }
  // });

  // it('determines output length properly', async () => {
  //   for (let i = 0; i < determineOutputLength.length; i += 1) {
  //     const res = await instance.determineOutputLength(determineOutputLength[i].input);
  //     const expected = new BN(determineOutputLength[i].output, 10);
  //     assert(
  //       res.eq(expected),
  //       `Output Length Test Failed: expected ${expected.toString()}, got ${res.toString()}`
  //     );
  //   }
  // });

  // it('extracts outputs at specified indices', async () => {
  //   for (let i = 0; i < extractOutputAtIndex.length; i += 1) {
  //     const res = await instance.extractOutputAtIndex(
  //       extractOutputAtIndex[i].input.vout,
  //       extractOutputAtIndex[i].input.index
  //     );
  //     assert.strictEqual(res, extractOutputAtIndex[i].output);
  //   }
  // });

  // TODO: come back to this
  // error - "TypedMemView/index - Overran the view."
  // it('extracts outputs at specified indices', async () => {
  //   for (let i = 0; i < extractInputAtIndex.length; i += 1) {
  //     const res = await instance.indexVout(
  //       extractOutputAtIndex[i].input.vout,
  //       extractOutputAtIndex[i].input.index
  //     );
  //     assert.strictEqual(res, extractOutputAtIndex[i].output);
  //   }
  // });

  // it('errors while extracting outputs at specified indices', async () => {
  //   for (let i = 0; i < extractOutputAtIndexError.length; i += 1) {
  //     try {
  //       await instance.extractOutputAtIndex(
  //         extractOutputAtIndexError[i].input.vout,
  //         extractOutputAtIndexError[i].input.index
  //       );
  //     } catch (e) {
  //       assert.include(e.message, extractOutputAtIndexError[i].solidityError, `${extractOutputAtIndexError[i].input.vout} ${extractOutputAtIndexError[i].input.index}`);
  //     }
  //   }
  // });

  // it('extracts a root from a header', async () => {
  //   for (let i = 0; i < extractMerkleRootLE.length; i += 1) {
  //     const res = await instance.extractMerkleRootLE(extractMerkleRootLE[i].input);
  //     assert.strictEqual(res, extractMerkleRootLE[i].output);
  //   }
  // });

  // it('extracts the target from a header', async () => {
  //   for (let i = 0; i < extractTarget.length; i += 1) {
  //     const res = await instance.extractTarget(extractTarget[i].input);
  //     assert(res.eq(new BN(extractTarget[i].output.slice(2), 16)));
  //   }
  // });

  // it('extracts the prev block hash', async () => {
  //   for (let i = 0; i < extractPrevBlockLE.length; i += 1) {
  //     const res = await instance.extractPrevBlockLE(extractPrevBlockLE[i].input);
  //     assert.strictEqual(res, extractPrevBlockLE[i].output);
  //   }
  // });

  // it('extracts a timestamp from a header', async () => {
  //   for (let i = 0; i < extractTimestamp.length; i += 1) {
  //     const res = await instance.extractTimestamp(extractTimestamp[i].input);
  //     assert(res.eq(new BN(extractTimestamp[i].output, 10)));
  //   }
  // });

  // it('verifies a bitcoin merkle root', async () => {
  //   for (let i = 0; i < verifyHash256Merkle.length; i += 1) {
  //     const res = await instance.verifyHash256Merkle(
  //       verifyHash256Merkle[i].input.proof,
  //       verifyHash256Merkle[i].input.index
  //     ); // 0-indexed
  //     assert.strictEqual(res, verifyHash256Merkle[i].output);
  //   }
  // });

  // it('determines VarInt data lengths correctly', async () => {
  //   for (let i = 0; i < determineVarIntDataLength.length; i += 1) {
  //     const res = await instance.determineVarIntDataLength(`0x${(determineVarIntDataLength[i].input).toString(16)}`);
  //     assert(res.eq(new BN(determineVarIntDataLength[i].output, 10)));
  //   }
  // });

  // indexCompactInt / indexVarInt
  it('parses VarInts', async () => {
    for (let i = 0; i < parseVarInt.length; i += 1) {
      const res = await instance.indexVarInt(parseVarInt[i].input);
      assert(res.eq(new BN(parseVarInt[i].output[1], 10)));
    }
  });

  // it('returns error for invalid VarInts', async () => {
  //   for (let i = 0; i < parseVarIntError.length; i += 1) {
  //     const res = await instance.parseVarInt(parseVarIntError[i].input);
  //     assert(res[0].eq(new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16)), 'did not get error code');
  //     assert(res[1].eq(new BN(0, 10)), `got non-0 value: ${res[1].toString()}`);
  //   }
  // });

  // it('calculates consensus-correct retargets', async () => {
  //   let firstTimestamp;
  //   let secondTimestamp;
  //   let previousTarget;
  //   let expectedNewTarget;
  //   let res;
  //   for (let i = 0; i < retargetAlgorithm.length; i += 1) {
  //     firstTimestamp = retargetAlgorithm[i].input[0].timestamp;
  //     secondTimestamp = retargetAlgorithm[i].input[1].timestamp;
  //     previousTarget = await instance.extractTarget.call(retargetAlgorithm[i].input[1].hex);
  //     expectedNewTarget = await instance.extractTarget.call(retargetAlgorithm[i].input[2].hex);
  //     res = await instance.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
  //     // (response & expected) == expected
  //     // this converts our full-length target into truncated block target
  //     assert(res.uand(expectedNewTarget).eq(expectedNewTarget));

  //     secondTimestamp = firstTimestamp + 5 * 2016 * 10 * 60; // longer than 4x
  //     res = await instance.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
  //     assert(res.divn(4).uand(previousTarget).eq(previousTarget));

  //     secondTimestamp = firstTimestamp + 2016 * 10 * 14; // shorter than 1/4x
  //     res = await instance.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
  //     assert(res.muln(4).uand(previousTarget).eq(previousTarget));
  //   }
  // });

  // it('extracts difficulty from a header', async () => {
  //   let actual;
  //   let expected;
  //   for (let i = 0; i < retargetAlgorithm.length; i += 1) {
  //     actual = await instance.extractDifficulty(retargetAlgorithm[i].input[0].hex);
  //     expected = new BN(retargetAlgorithm[i].input[0].difficulty, 10);
  //     assert(actual.eq(expected));

  //     actual = await instance.extractDifficulty(retargetAlgorithm[i].input[1].hex);
  //     expected = new BN(retargetAlgorithm[i].input[1].difficulty, 10);
  //     assert(actual.eq(expected));

  //     actual = await instance.extractDifficulty(retargetAlgorithm[i].input[2].hex);
  //     expected = new BN(retargetAlgorithm[i].input[2].difficulty, 10);
  //     assert(actual.eq(expected));
  //   }
  // });
});
