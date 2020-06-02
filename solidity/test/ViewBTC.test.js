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
  extractSequenceLELegacyError,
  extractOpReturnData,
  extractInputAtIndex,
  extractHash,
  extractHashError,
  indexVinError,
  extractValueLE,
  extractValue,
  determineInputLength,
  scriptSig,
  scriptSigError,
  scriptPubkey,
  tryAsVin,
  tryAsVout,
  determineOutputLength,
  extractOutputAtIndex,
  indexVoutError,
  extractMerkleRootLE,
  extractTarget,
  extractPrevBlockLE,
  extractTimestamp,
  verifyHash256Merkle,
  parseVarInt,
  parseVarIntError,
  retargetAlgorithm
} = vectors;

// payload: Not Completed
// work: Not Completed
// workHash: Not Completed

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
      assert.strictEqual(res, hash160[i].output);
    }
  });

  it('implements bitcoin\'s hash256', async () => {
    for (let i = 0; i < hash256.length; i += 1) {
      const res = await instance.hash256(hash256[i].input);
      assert.strictEqual(res, hash256[i].output);
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

  it('errors on bad varints in sequence', async () => {
    for (let i = 0; i < extractSequenceLELegacyError.length; i += 1) {
      try {
        await instance.sequence(extractSequenceLELegacyError[i].input);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, extractSequenceLELegacyError[i].solidityError);
      }
    }
  });

  it('extracts an outpoint as bytes', async () => {
    for (let i = 0; i < extractOutpoint.length; i += 1) {
      const res = await instance.outpoint(extractOutpoint[i].input);
      assert.strictEqual(res, extractOutpoint[i].output);
    }
  });

  it('extracts a txid from an outpoint', async () => {
    for (let i = 0; i < extractInputTxIdLE.length; i += 1) {
      const outpoint = await instance.outpoint(extractInputTxIdLE[i].input);
      const res = await instance.txidLE(outpoint);
      assert.strictEqual(res, extractInputTxIdLE[i].output);
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
      assert.strictEqual(res, extractValueLE[i].output);
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

  it('extracts op_return data blobs', async () => {
    for (let i = 0; i < extractOpReturnData.length; i += 1) {
      const res = await instance.opReturnPayload(extractOpReturnData[i].input);
      assert.strictEqual(res, extractOpReturnData[i].output);
    }
  });

  it('errors appropriately when extracting Op Return Payload', async () => {
    // Not an op return output
    const res = await instance.opReturnPayload("0x4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c18");
    assert.isNull(res)

    // One byte too short
    try {
      await instance.opReturnPayload("0x0000000000000000166a14edb1b5c2f39af0fec151732585b1049b078952");
      assert(false, 'expected an error message');
    } catch (e) {
      assert.include(e.message, "Type assertion failed");
    }
  });

  // 3: Expected null to equal '0x0000000000000000000000000000000000000000'
  it('extracts the payload from a scriptPubkey', async () => {
    for (let i = 0; i < extractHash.length; i += 1) {
      const res = await instance.payload(extractHash[3].input);
      assert.strictEqual(res, extractHash[3].output);
    }
  });

  // 1: Passing
  // 2: expected '0xedb1b5c2f39af0fec151732585b1049b07895211' to equal null
  // 3: Passing
  // 4: Passing
  // 5: Passing
  // 6: Passing
  // 7: Passing
  // 8: Passing
  // 9: Passing
  // 10: Passing
  // 11: 
  it.only('errors appropriately when extracting the payload from a scriptPubkey', async () => {
    for (let i = 0; i < extractHashError.length; i += 1) {
      if (extractHashError[i].solidityError) {
        try {
          await instance.payload(extractHashError[i].input);
          assert(false, "expected an error");
        } catch (e) {
          assert.include(e.message, extractHashError[i].solidityError)
        }
      } else {
        const res = await instance.payload(extractHashError[i].input);
        assert.isNull(res);
      }
    }
  });

  it('extracts inputs at specified indices', async () => {
    for (let i = 0; i < extractInputAtIndex.length; i += 1) {
      const res = await instance.indexVin.call(
        extractInputAtIndex[i].input.vin,
        extractInputAtIndex[i].input.index
      );
      assert.strictEqual(res, extractInputAtIndex[i].output);
    }
  });

  it('extract input errors on bad vin', async () => {
    for (let i = 0; i < indexVinError.length; i += 1) {
      try {
        await instance.indexVin.call(
          indexVinError[i].input.vin,
          indexVinError[i].input.index
        );
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, indexVinError[i].solidityError, `${indexVinError[i].input.vin}, ${indexVinError[i].input.index}`);
      }
    }
  });

  it('extracts the scriptSig from inputs', async () => {
    for (let i = 0; i < scriptSig.length; i += 1) {
      const res = await instance.scriptSig(scriptSig[i].input);
      assert.strictEqual(res, scriptSig[i].output);
    }
  });

  it('errors on bad (or non-minimal) varints in scriptSig', async () => {
    for (let i = 0; i < scriptSigError.length; i += 1) {
      try {
        await instance.scriptSig(scriptSigError[i].input);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, scriptSigError[i].solidityError);
      }
    }
  });

  it('extracts the scriptPubkey from an output', async () => {
    for (let i = 0; i < scriptPubkey.length; i += 1) {
      const res = await instance.scriptPubkey(scriptPubkey[i].input);
      assert.strictEqual(res, scriptPubkey[i].output)
    }
  });

  it('validates vin length based on stated size', async () => {
    for (let i = 0; i < tryAsVin.length; i += 1) {
      // TODO: Separate out error cases
      if (tryAsVin[i].solidityError) {
        try {
          await instance.tryAsVin(tryAsVin[i].input);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, tryAsVin[i].solidityError)
        }
      } else {
        const res = await instance.tryAsVin(tryAsVin[i].input);
        assert.strictEqual(res, tryAsVin[i].output);
      }
    }
  });

  it('validates vout length based on stated size', async () => {
    for (let i = 0; i < tryAsVout.length; i += 1) {
      // TODO: Separate out error cases
      if (tryAsVout[i].solidityError) {
        try {
          await instance.tryAsVout(tryAsVout[i].input);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, tryAsVout[i].solidityError)
        }
      } else {
        const res = await instance.tryAsVout(tryAsVout[i].input);
        assert.strictEqual(res, tryAsVout[i].output);
      }
    }
  });

  it('determines output length properly', async () => {
    for (let i = 0; i < determineOutputLength.length; i += 1) {
      // TODO: Separate out error cases
      if (determineOutputLength[i].solidityError) {
        try {
          await instance.outputLength(determineOutputLength[i].input);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, determineOutputLength[i].solidityError);
        }
      } else {
        const res = await instance.outputLength(determineOutputLength[i].input);
        const expected = new BN(determineOutputLength[i].output, 10);
        assert(
          res.eq(expected),
          `Output Length Test Failed: expected ${expected.toString()}, got ${res.toString()}`
        );
      }
    }
  });

  it('extracts outputs at specified indices', async () => {
    for (let i = 0; i < extractOutputAtIndex.length; i += 1) {
      const res = await instance.indexVout(
        extractOutputAtIndex[i].input.vout,
        extractOutputAtIndex[i].input.index
      );
      assert.strictEqual(res, extractOutputAtIndex[i].output);
    }
  });

  it('errors while extracting outputs at specified indices', async () => {
    for (let i = 0; i < indexVoutError.length; i += 1) {
      try {
        await instance.indexVout(
          indexVoutError[i].input.vout,
          indexVoutError[i].input.index
        );
      } catch (e) {
        assert.include(e.message, indexVoutError[i].solidityError, `${indexVoutError[i].input.vout} ${indexVoutError[i].input.index}`);
      }
    }
  });

  it('extracts a root from a header', async () => {
    for (let i = 0; i < extractMerkleRootLE.length; i += 1) {
      const res = await instance.merkleRoot(extractMerkleRootLE[i].input);
      assert.strictEqual(res, extractMerkleRootLE[i].output);
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
      assert.strictEqual(res, extractPrevBlockLE[i].output);
    }
  });

  it('extracts a timestamp from a header', async () => {
    for (let i = 0; i < extractTimestamp.length; i += 1) {
      const res = await instance.time(extractTimestamp[i].input);
      assert(res, extractTimestamp[i].output);
    }
  });

  it('verifies a bitcoin merkle root', async () => {
    for (let i = 0; i < verifyHash256Merkle.length; i += 1) {
      const res = await instance.verifyHash256Merkle(
        verifyHash256Merkle[i].input.proof,
        verifyHash256Merkle[i].input.index
      ); // 0-indexed
      assert.strictEqual(res, verifyHash256Merkle[i].output);
    }
  });

  // indexCompactInt / indexVarInt
  it('parses VarInts', async () => {
    for (let i = 0; i < parseVarInt.length; i += 1) {
      if (parseVarInt[i].solidityError) {
        try {
          await instance.indexVarInt(parseVarInt[i].input);
          assert(false, "expected an error");
        } catch (e) {
          assert.include(e.message, parseVarInt[i].solidityError);
        }
      } else {
        const res = await instance.indexVarInt(parseVarInt[i].input);
        assert(res.eq(new BN(parseVarInt[i].output[1], 10)));
      }
    }
  });

  it('returns error for invalid VarInts', async () => {
    for (let i = 0; i < parseVarIntError.length; i += 1) {
      try {
        await instance.indexVarInt(parseVarIntError[i].input);
        assert(false, "expected an error");
      } catch (e) {
        assert.include(e.message, parseVarIntError[i].solidityError)
      }
    }
  });

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
