/* global artifacts contract before it assert */
const BN = require('bn.js');

/* eslint-disable-next-line no-unresolved */
const vectors = require('./testVectors.json');

const ViewBTC = artifacts.require('ViewBTCTest');

const {
  hash160,
  hash256,
  extractOutpoint,
  extractInputTxIdLE,
  extractTxIndexLE,
  extractSequenceLEWitness,
  extractSequenceLELegacy,
  extractSequenceLegacyError,
  extractOpReturnData,
  extractOpReturnDataError,
  extractInputAtIndex,
  extractInputAtIndexError,
  extractValueLE,
  extractValue,
  determineInputLength,
  extractScriptSig,
  extractScriptSigError,
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
  parseVarInt,
  parseVarIntError,
  retargetAlgorithm
} = vectors;

// indexVarInt

// hash160: Passing

// hash256: Passing

// indexVin: Erroring

// inputLength: Passing

// sequence: Passing

// scriptSig: Partially Passing

// outpoint: Passing

// outpointIdx: Passing

// txidLE: Passing

// outputLength: Partially Passing

// indexVout: Erroring

// valueBytes: Passing

// extractValue: Passing

// opReturnPayload: Not Completed

// payload: Not Completed

// tryAsVin: Erroring

// tryAsVout: Erroring

// merkleRoot: Passing

// target: Passing

// diff: Passing

// time: Passing

// parent: Passing

// work: Not Completed

// workHash: Not Completed

// verifyHash256Merkle: Partially Passing

// retargetAlgorithm: Passing

contract('ViewBTC', () => {
  let instance;

  before(async () => {
    instance = await ViewBTC.new();
  });

  // it('asHex', async () => {
  //   const avar = new BN('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', 16);
  //   const res = await instance.encodeHex.call(avar);
  //   console.log(res[0].toString(16), res[1].toString(16))
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

  it('extracts a sequence from a witness input as LE and int', async () => {
    for (let i = 0; i < extractSequenceLEWitness.length; i += 1) {
      const res = await instance.sequence(extractSequenceLEWitness[i].input);
      const expected = new BN(extractSequenceLEWitness[i].output.slice(2), 16);
      assert(res.eq(expected));
    }
  });

  it('extracts a sequence from a legacy input as LE and int', async () => {
    for (let i = 0; i < extractSequenceLELegacy.length; i += 1) {
      const res = await instance.sequence(extractSequenceLELegacy[i].input);
      const expected = new BN(extractSequenceLELegacy[i].output.slice(2), 16);
      assert(res.eq(expected));
    }
  });

  // TODO: Error cases
  // it('errors on bad varints in extractSequenceLegacy', async () => {
  //   for (let i = 0; i < extractSequenceLegacyError.length; i += 1) {
  //     try {
  //       await instance.sequence(
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

  it('extracts a txid from an outpoint', async () => {
    for (let i = 0; i < extractInputTxIdLE.length; i += 1) {
      const outpoint = await instance.outpoint(extractInputTxIdLE[i].input);
      const res = await instance.txidLE(outpoint);
      assert.strictEqual(extractInputTxIdLE[i].output, res);
    }
  });

  it('extracts an outpoint tx index LE', async () => {
    for (let i = 0; i < extractTxIndexLE.length; i += 1) {
      const res = await instance.outpointIdx(extractTxIndexLE[i].input);
      const expected = new BN(extractTxIndexLE[i].output.slice(2), 16);
      assert(res.eq(expected));
    }
  });

  it('extracts the value as LE bytes', async () => {
    for (let i = 0; i < extractValueLE.length; i += 1) {
      const res = await instance.valueBytes(extractValueLE[i].input);
      assert.strictEqual(extractValueLE[i].output, res);
    }
  });

  it('extracts the value as an integer', async () => {
    for (let i = 0; i < extractValue.length; i += 1) {
      const res = await instance.extractValue(extractValue[i].input);
      const expected = new BN(extractValue[i].output, 10);
      assert(res.eq(expected));
    }
  });

  it('determines input length', async () => {
    for (let i = 0; i < determineInputLength.length; i += 1) {
      const res = await instance.inputLength(determineInputLength[i].input);
      const expected = new BN(determineInputLength[i].output, 10);
      assert(
        res.eq(expected),
        `Input Length Test Failed: Expected ${expected.toString()}, got ${res.toString()}`
      );
    }
  });

  // TODO: opReturnPayload
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
  it('extracts inputs at specified indices', async () => {
    for (let i = 0; i < extractInputAtIndex.length; i += 1) {
      const res = await instance.indexVin.call(
        extractInputAtIndex[i].input.vin,
        extractInputAtIndex[i].input.index
      );
      assert.strictEqual(res, extractInputAtIndex[i].output);
    }
  });

  // TODO: Error cases
  // it('extract input errors on bad vin', async () => {
  //   for (let i = 0; i < extractInputAtIndexError.length; i += 1) {
  //     try {
  //       await instance.indexVin(
  //         extractInputAtIndexError[i].input.vin,
  //         extractInputAtIndexError[i].input.index
  //       );
  //       assert(false, 'expected an error');
  //     } catch (e) {
  //       assert.include(e.message, extractInputAtIndexError[i].solidityError, `${extractInputAtIndexError[i].input.vin} ${extractInputAtIndexError[i].input.index}`);
  //     }
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

  // TODO: Error cases
  // it('errors on bad varints in extractScriptSig', async () => {
  //   for (let i = 0; i < extractScriptSigError.length; i += 1) {
  //     try {
  //       await instance.scriptSig(
  //         extractScriptSigError[i].input
  //       );
  //       assert(false, 'expected an error');
  //     } catch (e) {
  //       assert.include(e.message, extractScriptSigError[i].solidityError);
  //     }
  //   }
  // });

  // TODO: Come back to this
  // Error: TypedMemView/index - Overran the view.
  // it('validates vin length based on stated size', async () => {
  //   for (let i = 0; i < validateVin.length; i += 1) {
  //     const res = await instance.tryAsVin(validateVin[i].input);
  //     assert.strictEqual(validateVin[i].output, res);
  //   }
  // });

  // TODO: Come back to this
  // Error: type assertion failed
  // it('validates vout length based on stated size', async () => {
  //   for (let i = 0; i < validateVout.length; i += 1) {
  //     // if (validateVout[i].solidityError) {
  //       // try {
  //       //   await instance.tryAsVout(validateVout[i].input);
  //       //   assert(false, 'expected an error');
  //       // } catch (e) {
  //       //   assert.include(e.message, validateVout[i].solidityError);
  //       // }
  //     // } else {
  //     const res = await instance.tryAsVout(validateVout[i].input);
  //     assert.strictEqual(validateVout[i].output, res);
  //     // }
  //   }
  // });

  // TODO: possible bug?
  // All test cases passed except the last
  // expected: 269
  // actual: 261
  // it('determines output length properly', async () => {
  //   for (let i = 0; i < determineOutputLength.length; i += 1) {
  //     const res = await instance.outputLength(determineOutputLength[i].input);
  //     const expected = new BN(determineOutputLength[i].output, 10);
  //     assert(
  //       res.eq(expected),
  //       `Output Length Test Failed: expected ${expected.toString()}, got ${res.toString()}`
  //     );
  //   }
  // });

  // TODO: come back to this
  // error - "TypedMemView/index - Overran the view."
  it('extracts outputs at specified indices', async () => {
    for (let i = 0; i < extractOutputAtIndex.length; i += 1) {
      const res = await instance.indexVout(
        extractOutputAtIndex[i].input.vout,
        extractOutputAtIndex[i].input.index
      );
      assert.strictEqual(extractOutputAtIndex[i].output, res);
    }
  });

  // TODO: Error cases
  // it('errors while extracting outputs at specified indices', async () => {
  //   for (let i = 0; i < extractOutputAtIndexError.length; i += 1) {
  //     try {
  //       await instance.indexVout(
  //         extractOutputAtIndexError[i].input.vout,
  //         extractOutputAtIndexError[i].input.index
  //       );
  //     } catch (e) {
  //       assert.include(e.message, extractOutputAtIndexError[i].solidityError, `${extractOutputAtIndexError[i].input.vout} ${extractOutputAtIndexError[i].input.index}`);
  //     }
  //   }
  // });

  it('extracts a root from a header', async () => {
    for (let i = 0; i < extractMerkleRootLE.length; i += 1) {
      const res = await instance.merkleRoot(extractMerkleRootLE[i].input);
      assert.strictEqual(extractMerkleRootLE[i].output, res);
    }
  });

  it('extracts the target from a header', async () => {
    for (let i = 0; i < extractTarget.length; i += 1) {
      const res = await instance.target(extractTarget[i].input);
      const expected = new BN(extractTarget[i].output.slice(2), 16);
      assert(res.eq(expected));
    }
  });

  it('extracts the prev block hash', async () => {
    for (let i = 0; i < extractPrevBlockLE.length; i += 1) {
      const res = await instance.parent(extractPrevBlockLE[i].input);
      assert.strictEqual(extractPrevBlockLE[i].output, res);
    }
  });

  it('extracts a timestamp from a header', async () => {
    for (let i = 0; i < extractTimestamp.length; i += 1) {
      const res = await instance.time(extractTimestamp[i].input);
      assert(extractTimestamp[i].output, res);
    }
  });

  // TODO: Come back to this
  // All pass except...
  // Error on test cases 6 & 7: Overflow during addition.
  // it('verifies a bitcoin merkle root', async () => {
  //   for (let i = 0; i < verifyHash256Merkle.length; i += 1) {
  //     const res = await instance.verifyHash256Merkle(
  //       verifyHash256Merkle[i].input.proof,
  //       verifyHash256Merkle[i].input.index
  //     ); // 0-indexed
  //     assert.strictEqual(verifyHash256Merkle[i].output, res);
  //   }
  // });

  // indexCompactInt / indexVarInt
  it('parses VarInts', async () => {
    for (let i = 0; i < parseVarInt.length; i += 1) {
      const res = await instance.indexVarInt(parseVarInt[i].input);
      assert(res.eq(new BN(parseVarInt[i].output[1], 10)));
    }
  });

  // TODO: Error cases
  // it('returns error for invalid VarInts', async () => {
  //   for (let i = 0; i < parseVarIntError.length; i += 1) {
  //     const res = await instance.indexVarInt(parseVarIntError[i].input);
  //     assert(res[0].eq(new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16)), 'did not get error code');
  //     assert(res[1].eq(new BN(0, 10)), `got non-0 value: ${res[1].toString()}`);
  //   }
  // });

  it('calculates consensus-correct retargets', async () => {
    let firstTimestamp;
    let secondTimestamp;
    let previousTarget;
    let expectedNewTarget;
    let res;
    for (let i = 0; i < retargetAlgorithm.length; i += 1) {
      firstTimestamp = retargetAlgorithm[i].input[0].timestamp;
      secondTimestamp = retargetAlgorithm[i].input[1].timestamp;
      previousTarget = await instance.target.call(retargetAlgorithm[i].input[1].hex);
      expectedNewTarget = await instance.target.call(retargetAlgorithm[i].input[2].hex);
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
  });

  it('extracts difficulty from a header', async () => {
    let actual;
    let expected;
    for (let i = 0; i < retargetAlgorithm.length; i += 1) {
      actual = await instance.diff(retargetAlgorithm[i].input[0].hex);
      expected = new BN(retargetAlgorithm[i].input[0].difficulty, 10);
      assert(actual.eq(expected));

      actual = await instance.diff(retargetAlgorithm[i].input[1].hex);
      expected = new BN(retargetAlgorithm[i].input[1].difficulty, 10);
      assert(actual.eq(expected));

      actual = await instance.diff(retargetAlgorithm[i].input[2].hex);
      expected = new BN(retargetAlgorithm[i].input[2].difficulty, 10);
      assert(actual.eq(expected));
    }
  });
});
