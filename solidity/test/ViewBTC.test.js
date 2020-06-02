/* global artifacts contract describe before it assert */
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
  extractOpReturnDataError,
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
  tryAsVinError,
  tryAsVout,
  tryAsVoutError,
  determineOutputLength,
  extractOutputAtIndex,
  indexVoutError,
  extractMerkleRootLE,
  extractTarget,
  extractPrevBlockLE,
  extractTimestamp,
  work,
  workHash,
  verifyHash256Merkle,
  parseVarInt,
  parseVarIntError,
  retargetAlgorithm
} = vectors;

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

  describe('#hash160', async () => {
    it('implements bitcoin\'s hash160', async () => {
      for (let i = 0; i < hash160.length; i += 1) {
        const res = await instance.hash160(hash160[i].input);
        assert.strictEqual(res, hash160[i].output);
      }
    });
  });

  describe('#hash256', async () => {
    it('implements bitcoin\'s hash256', async () => {
      for (let i = 0; i < hash256.length; i += 1) {
        const res = await instance.hash256(hash256[i].input);
        assert.strictEqual(res, hash256[i].output);
      }
    });
  });

  describe('#sequence', async () => {
    it('extracts a sequence from a witness input', async () => {
      for (let i = 0; i < extractSequenceLEWitness.length; i += 1) {
        const res = await instance.sequence(extractSequenceLEWitness[i].input);
        const expected = new BN(extractSequenceLEWitness[i].output.slice(2), 16);
        assert(res.eq(expected));
      }
    });

    it('extracts a sequence from a legacy input', async () => {
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
  });

  describe('#outpoint', async () => {
    it('extracts an outpoint as bytes', async () => {
      for (let i = 0; i < extractOutpoint.length; i += 1) {
        const res = await instance.outpoint(extractOutpoint[i].input);
        assert.strictEqual(res, extractOutpoint[i].output);
      }
    });
  });

  describe('#txidLE', async () => {
    it('extracts a txid from an outpoint', async () => {
      for (let i = 0; i < extractInputTxIdLE.length; i += 1) {
        const outpoint = await instance.outpoint(extractInputTxIdLE[i].input);
        const res = await instance.txidLE(outpoint);
        assert.strictEqual(res, extractInputTxIdLE[i].output);
      }
    });
  });

  describe('#outpointIdx', async () => {
    it('extracts the index as an integer from the outpoint', async () => {
      for (let i = 0; i < extractTxIndexLE.length; i += 1) {
        const res = await instance.outpointIdx(extractTxIndexLE[i].input);
        const expected = new BN(extractTxIndexLE[i].output.slice(2), 16);
        assert(res.eq(expected));
      }
    });
  });

  describe('#valueBytes', async () => {
    it('extracts the value as LE bytes', async () => {
      for (let i = 0; i < extractValueLE.length; i += 1) {
        const res = await instance.valueBytes(extractValueLE[i].input);
        assert.strictEqual(res, extractValueLE[i].output);
      }
    });
  });

  describe('#extractValue', async () => {
    it('extracts the value as an integer', async () => {
      for (let i = 0; i < extractValue.length; i += 1) {
        const res = await instance.extractValue(extractValue[i].input);
        const expected = new BN(extractValue[i].output, 10);
        assert(res.eq(expected));
      }
    });
  });

  describe('#inputLength', async () => {
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
  });

  describe('#opReturnPayload', async () => {
    it('extracts Op Return Payload', async () => {
      for (let i = 0; i < extractOpReturnData.length; i += 1) {
        const res = await instance.opReturnPayload(extractOpReturnData[i].input);
        assert.strictEqual(res, extractOpReturnData[i].output);
      }
    });

    it('errors appropriately when extracting Op Return Payload', async () => {
      for (let i = 0; i < extractOpReturnDataError.length; i += 1) {
        const res = await instance.opReturnPayload(extractOpReturnDataError[i].input);
        assert.isNull(res);
      }
    });
  });

  describe('#payload', async () => {
    // 3: Expected null to equal '0x0000000000000000000000000000000000000000'
    it('extracts the payload from a scriptPubkey', async () => {
      for (let i = 0; i < extractHash.length; i += 1) {
        const res = await instance.payload(extractHash[i].input);
        assert.strictEqual(res, extractHash[i].output);
      }
    });

    it('errors appropriately when extracting the payload from a scriptPubkey', async () => {
      for (let i = 0; i < extractHashError.length; i += 1) {
        const res = await instance.payload(extractHashError[i].input);
        assert.isNull(res);
      }
    });
  });

  describe('#indexVin', async () => {
    it('extracts inputs at specified indices', async () => {
      for (let i = 0; i < extractInputAtIndex.length; i += 1) {
        const res = await instance.indexVin.call(
          extractInputAtIndex[i].input.vin,
          extractInputAtIndex[i].input.index
        );
        assert.strictEqual(res, extractInputAtIndex[i].output);
      }
    });

    it('errors on bad vin', async () => {
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
  });

  describe('#scriptSig', async () => {
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
  });

  describe('#scriptPubkey', async () => {
    it('extracts the scriptPubkey from an output', async () => {
      for (let i = 0; i < scriptPubkey.length; i += 1) {
        const res = await instance.scriptPubkey(scriptPubkey[i].input);
        assert.strictEqual(res, scriptPubkey[i].output);
      }
    });
  });

  describe('#tryAsVin', async () => {
    it('validates vin and converts to typed memory', async () => {
      for (let i = 0; i < tryAsVin.length; i += 1) {
        const res = await instance.tryAsVin(tryAsVin[i].input);
        assert.strictEqual(res, tryAsVin[i].output);
      }
    });

    it('errors appropriately when validating a vin', async () => {
      for (let i = 0; i < tryAsVinError.length; i += 1) {
        try {
          await instance.tryAsVin(tryAsVinError[i].input);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, tryAsVinError[i].solidityError);
        }
      }
    });
  });

  describe('#tryAsVout', async () => {
    it('validates vout and converts to typed memory', async () => {
      for (let i = 0; i < tryAsVout.length; i += 1) {
        const res = await instance.tryAsVout(tryAsVout[i].input);
        assert.strictEqual(res, tryAsVout[i].output);
      }
    });

    it('errors appropriately when validating vout', async () => {
      for (let i = 0; i < tryAsVoutError.length; i += 1) {
        try {
          await instance.tryAsVout(tryAsVoutError[i].input);
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, tryAsVoutError[i].solidityError);
        }
      }
    });
  });

  describe('#outputLength', async () => {
    it('determines output length properly', async () => {
      for (let i = 0; i < determineOutputLength.length; i += 1) {
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
  });

  describe('#indexVout', async () => {
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
  });

  describe('#merkleRoot', async () => {
    it('extracts a root from a header', async () => {
      for (let i = 0; i < extractMerkleRootLE.length; i += 1) {
        const res = await instance.merkleRoot(extractMerkleRootLE[i].input);
        assert.strictEqual(res, extractMerkleRootLE[i].output);
      }
    });
  });

  describe('#target', async () => {
    it('extracts the target from a header', async () => {
      for (let i = 0; i < extractTarget.length; i += 1) {
        const res = await instance.target(extractTarget[i].input);
        const expected = new BN(extractTarget[i].output.slice(2), 16);
        assert(res.eq(expected));
      }
    });
  });

  describe('#parent', async () => {
    it('extracts the prev block hash', async () => {
      for (let i = 0; i < extractPrevBlockLE.length; i += 1) {
        const res = await instance.parent(extractPrevBlockLE[i].input);
        assert.strictEqual(res, extractPrevBlockLE[i].output);
      }
    });
  });

  describe('#time', async () => {
    it('extracts a timestamp from a header', async () => {
      for (let i = 0; i < extractTimestamp.length; i += 1) {
        const res = await instance.time(extractTimestamp[0].input);
        const expected = new BN(extractTimestamp[0].output, 10);
        assert(res.eq(expected));
      }
    });
  });

  describe('#work', async () => {
    it('calculates the Proof of Work hash of the header, and converts to an integer', async () => {
      for (let i = 0; i < work.length; i += 1) {
        const res = await instance.work(work[i].input);
        const expected = new BN(work[i].output, 10);
        assert(res.eq(expected));
      }
    });
  });

  describe('#workHash', async () => {
    it('calculates the Proof of Work hash of the header', async () => {
      for (let i = 0; i < workHash.length; i += 1) {
        const res = await instance.workHash(workHash[i].input);
        assert.strictEqual(res, workHash[i].output);
      }
    });
  });

  describe('#verifyHash256Merkle', async () => {
    it('verifies a bitcoin merkle root', async () => {
      for (let i = 0; i < verifyHash256Merkle.length; i += 1) {
        const res = await instance.verifyHash256Merkle(
          verifyHash256Merkle[i].input.proof,
          verifyHash256Merkle[i].input.index
        ); // 0-indexed
        assert.strictEqual(res, verifyHash256Merkle[i].output);
      }
    });
  });

  describe('#indexVarInt', async () => {
    it('parses VarInts', async () => {
      for (let i = 0; i < parseVarInt.length; i += 1) {
        if (parseVarInt[i].solidityError) {
          try {
            await instance.indexVarInt(parseVarInt[i].input);
            assert(false, 'expected an error');
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
          assert(false, 'expected an error');
        } catch (e) {
          assert.include(e.message, parseVarIntError[i].solidityError);
        }
      }
    });
  });

  describe('#retargetAlgorithm', async () => {
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
  });

  describe('#diff', async () => {
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
});
