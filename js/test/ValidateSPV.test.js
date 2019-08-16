/* global describe it BigInt */
import * as chai from 'chai';
import * as utils from '../utils/utils';
import * as ValidateSPV from '../src/ValidateSPV';
import * as vectors from '../../testVectors.json';

const { assert } = chai;

const vectorObj = JSON.parse(JSON.stringify(vectors));
utils.updateJson(vectorObj);

const {
  EMPTY,
  HEADER,
  HEADER_ERR,
  OUTPUT_TYPE,
  PARSE_INPUT,
  OP_RETURN
} = vectorObj;

const INPUT_TYPES = {
  NONE: 0,
  LEGACY: 1,
  COMPATIBILITY: 2,
  WITNESS: 3
};

describe('ValidateSPV', () => {
  describe('#prove', () => {
    it('returns true if proof is valid', () => {
      const res = ValidateSPV.prove(
        OP_RETURN.TXID_LE,
        OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE,
        OP_RETURN.PROOF,
        OP_RETURN.PROOF_INDEX
      );
      assert.isTrue(res);
    });

    it('shortcuts the coinbase special case', () => {
      const res = ValidateSPV.prove(
        OP_RETURN.TXID_LE,
        OP_RETURN.TXID_LE,
        new Uint8Array(),
        0
      );
      assert.isTrue(res);
    });

    it('returns false if Merkle root is invalid', () => {
      const res = ValidateSPV.prove(
        OP_RETURN.TXID_LE,
        OP_RETURN.TXID_LE,
        OP_RETURN.PROOF,
        OP_RETURN.PROOF_INDEX
      );
      assert.isFalse(res);
    });
  });

  describe('#calculateTxId', () => {
    it('returns the transaction hash', () => {
      const res = ValidateSPV.calculateTxId(
        OP_RETURN.VERSION,
        OP_RETURN.VIN,
        OP_RETURN.VOUT,
        OP_RETURN.LOCKTIME_LE
      );
      const arraysAreEqual = utils.typedArraysAreEqual(
        res,
        OP_RETURN.TXID_LE
      );
      assert.isTrue(arraysAreEqual);
    });
  });

  describe('#parseInput', () => {
    const sequence = BigInt(PARSE_INPUT.SEQUENCE);
    const index = BigInt(PARSE_INPUT.INDEX);
    const outpointTxId = PARSE_INPUT.OUTPOINT_TX_ID;

    it('returns the tx input sequence and outpoint', () => {
      const txIn = ValidateSPV.parseInput(PARSE_INPUT.INPUT);

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, outpointTxId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, INPUT_TYPES.WITNESS);
    });

    it('handles Legacy inputs', () => {
      const txIn = ValidateSPV.parseInput(PARSE_INPUT.LEGACY_INPUT);

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, outpointTxId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, INPUT_TYPES.LEGACY);
    });

    it('handles p2wpkh-via-p2sh compatibility inputs', () => {
      const txIn = ValidateSPV.parseInput(PARSE_INPUT.COMPATIBILITY_WPKH_INPUT);

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, outpointTxId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, INPUT_TYPES.COMPATIBILITY);
    });

    it('handles p2wsh-via-p2sh compatibility inputs', () => {
      const txIn = ValidateSPV.parseInput(PARSE_INPUT.COMPATIBILITY_WSH_INPUT);

      assert.equal(txIn.sequence, sequence);
      assert.isTrue(utils.typedArraysAreEqual(txIn.inputId, outpointTxId));
      assert.equal(txIn.inputIndex, index);
      assert.equal(txIn.inputType, INPUT_TYPES.COMPATIBILITY);
    });
  });

  describe('#parseOutput', () => {
    it('returns the tx output value, output type, and payload for an OP_RETURN output', () => {
      const opReturnTxOut = ValidateSPV.parseOutput(OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT);

      assert.equal(opReturnTxOut.value, OP_RETURN.INDEXED_OUTPUTS[1].VALUE);
      assert.equal(opReturnTxOut.outputType, utils.OUTPUT_TYPES.OP_RETURN);
      assert.isTrue(
        utils.typedArraysAreEqual(
          opReturnTxOut.payload,
          OP_RETURN.INDEXED_OUTPUTS[1].PAYLOAD
        )
      );
    });

    it('returns the tx output value, output type, and payload for an WPKH output', () => {
      const wpkhOutput = ValidateSPV.parseOutput(OUTPUT_TYPE.WPKH.OUTPUT);

      assert.equal(wpkhOutput.value, BigInt(OUTPUT_TYPE.WPKH.VALUE));
      assert.equal(wpkhOutput.outputType, utils.OUTPUT_TYPES.WPKH);
      assert.isTrue(utils.typedArraysAreEqual(wpkhOutput.payload, OUTPUT_TYPE.WPKH.PAYLOAD));
    });

    it('returns the tx output value, output type, and payload for an WSH output', () => {
      const wshOutput = ValidateSPV.parseOutput(OUTPUT_TYPE.WSH.OUTPUT);

      assert.equal(wshOutput.value, BigInt(OUTPUT_TYPE.WSH.VALUE));
      assert.equal(wshOutput.outputType, utils.OUTPUT_TYPES.WSH);
      assert.isTrue(utils.typedArraysAreEqual(wshOutput.payload, OUTPUT_TYPE.WSH.PAYLOAD));
    });

    it('shows non-standard if the tx output type is not identifiable', () => {
      // Changes 0x6a (OP_RETURN) to 0x7a to create error
      const nonstandardOutput = ValidateSPV.parseOutput(OUTPUT_TYPE.NONSTANDARD);

      assert.equal(BigInt(0), nonstandardOutput.value);
      assert.equal(nonstandardOutput.outputType, utils.OUTPUT_TYPES.NONSTANDARD);
      assert.isTrue(utils.typedArraysAreEqual(nonstandardOutput.payload, new Uint8Array([])));
    });

    it('returns the tx output value, output type, and payload for an SH output', () => {
      const shOutput = ValidateSPV.parseOutput(OUTPUT_TYPE.SH.OUTPUT);

      assert.equal(shOutput.value, BigInt(OUTPUT_TYPE.SH.VALUE));
      assert.equal(shOutput.outputType, utils.OUTPUT_TYPES.SH);
      assert.isTrue(utils.typedArraysAreEqual(shOutput.payload, OUTPUT_TYPE.SH.PAYLOAD));
    });

    it('returns the tx output value, output type, and payload for an PKH output', () => {
      const pkhOutput = ValidateSPV.parseOutput(OUTPUT_TYPE.PKH.OUTPUT);

      assert.equal(pkhOutput.value, BigInt(OUTPUT_TYPE.PKH.VALUE));
      assert.equal(pkhOutput.outputType, utils.OUTPUT_TYPES.PKH);
      assert.isTrue(utils.typedArraysAreEqual(pkhOutput.payload, OUTPUT_TYPE.PKH.PAYLOAD));
    });
  });

  describe('#parseHeader', () => {
    it('returns the header digest, version, prevHash, merkleRoot, timestamp, target, and nonce',
      () => {
        const validHeader = ValidateSPV.parseHeader(
          OP_RETURN.INDEXED_HEADERS[0].HEADER
        );

        assert.isTrue(
          utils.typedArraysAreEqual(validHeader.digest, OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE)
        );
        assert.equal(validHeader.version, OP_RETURN.INDEXED_HEADERS[0].VERSION);
        assert.isTrue(
          utils.typedArraysAreEqual(validHeader.prevHash, OP_RETURN.INDEXED_HEADERS[0].PREV_HASH_LE)
        );
        assert.isTrue(
          utils.typedArraysAreEqual(
            validHeader.merkleRoot,
            OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE
          )
        );
        assert.equal(validHeader.timestamp, OP_RETURN.INDEXED_HEADERS[0].TIMESTAMP);
        assert.equal(validHeader.target, OP_RETURN.INDEXED_HEADERS[0].TARGET);
        assert.equal(validHeader.nonce, OP_RETURN.INDEXED_HEADERS[0].NONCE);
      });

    it('throws errors if input header is not 80 bytes', () => {
      // Removed a byte from the header version to create error
      try {
        ValidateSPV.parseHeader(HEADER_ERR.HEADER_0_LEN);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Malformatted header. Must be exactly 80 bytes.');
      }
    });
  });

  describe('#validateHeaderChain', () => {
    it('returns true if header chain is valid', () => {
      const res = ValidateSPV.validateHeaderChain(OP_RETURN.HEADER_CHAIN);
      assert.equal(res, BigInt('49134394618239'));
    });

    it('throws Error("Header bytes not multiple of 80.") if header chain is not divisible by 80', () => {
      try {
        ValidateSPV.validateHeaderChain(HEADER_ERR.HEADER_CHAIN_INVALID_LEN);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Header bytes not multiple of 80.');
      }
    });

    it('throws Error("Header bytes not a valid chain.") if header chain prevHash is invalid', () => {
      try {
        ValidateSPV.validateHeaderChain(HEADER_ERR.HEADER_CHAIN_INVALID_PREVHASH);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Header bytes not a valid chain.');
      }
    });

    it('throws Error("Header does not meet its own difficulty target.) if a header does not meet its target', () => {
      try {
        ValidateSPV.validateHeaderChain(HEADER_ERR.HEADER_CHAIN_LOW_WORK);
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Header does not meet its own difficulty target.');
      }
    });
  });

  describe('#validateHeaderWork', () => {
    it('returns false on an empty digest', () => {
      const res = ValidateSPV.validateHeaderWork(EMPTY, 1);
      assert.isFalse(res);
    });

    it('returns false if the digest has insufficient work', () => {
      const res = ValidateSPV.validateHeaderWork(HEADER.VALIDATE_WORK[0], 1);
      assert.isFalse(res);
    });

    it('returns true if the digest has sufficient work', () => {
      const res = ValidateSPV.validateHeaderWork(
        OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE,
        BigInt(HEADER.VALIDATE_WORK[1])
      );
      assert.isTrue(res);
    });
  });

  describe('#validateHeaderPrevHash', () => {
    it('returns true if header prevHash is valid', () => {
      const res = ValidateSPV.validateHeaderPrevHash(
        OP_RETURN.INDEXED_HEADERS[1].HEADER,
        OP_RETURN.INDEXED_HEADERS[0].DIGEST_LE
      );
      assert.isTrue(res);
    });

    it('returns false if header prevHash is invalid', () => {
      const res = ValidateSPV.validateHeaderPrevHash(
        OP_RETURN.INDEXED_HEADERS[1].HEADER,
        OP_RETURN.INDEXED_HEADERS[1].DIGEST_LE
      );
      assert.isFalse(res);
    });
  });
});
