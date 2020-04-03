/* global describe it */

import * as chai from 'chai';
import * as ser from '../src/ser';
import * as utils from '../src/utils';
import * as vectors from '../../testProofs.json';

const vectorObj = JSON.parse(JSON.stringify(vectors));
const {
  valid,
  validHeader,
  errBadHexBytes,
  errBadHexHash256,
  errBadLenHash256,
  errBadHexRawHeader,
  errBadLenRawHeader,
  errBadLenHash
} = vectorObj;

const { assert } = chai;

describe('ser', () => {
  it('can round-trip serialize SPV Proof', () => {
    const emptyDigest = new Uint8Array(32);
    valid.forEach((e) => {
      const proof = ser.deserializeSPVProof(e);

      // TODO: make more assertions and clean up this section
      assert.equal(proof.tx_id.length, 32);
      assert.isFalse(utils.typedArraysAreEqual(proof.tx_id, emptyDigest));

      // re-serialize and re-deserialize
      const jsonProofString = ser.serializeSPVProof(proof);
      const secondProof = ser.deserializeSPVProof(jsonProofString);

      // TODO: make more assertions and clean up this section
      assert.isTrue(utils.typedArraysAreEqual(
        proof.intermediate_nodes,
        secondProof.intermediate_nodes
      ));
      assert.isTrue(utils.typedArraysAreEqual(
        proof.tx_id,
        secondProof.tx_id
      ));
    });
  });

  it('can round-trip serialize Bitcoin header', () => {
    validHeader.forEach((e) => {
      const header = ser.deserializeHeader(e);

      // length assertions
      assert.equal(header.raw.length, 80);
      assert.isFalse(utils.typedArraysAreEqual(header.hash, new Uint8Array(80)));

      const len32 = [header.hash, header.prevhash, header.merkle_root];
      len32.forEach((f) => {
        assert.equal(f.length, 32);
        assert.isFalse(utils.typedArraysAreEqual(f, new Uint8Array(32)));
      });

      // re-serialize and re-deserialize
      const jsonHeaderString = ser.serializeHeader(header);
      const secondHeader = ser.deserializeHeader(jsonHeaderString);

      // round-trip equality assertions
      Object.keys(header).forEach((key) => {
        if (header[key] instanceof Uint8Array) {
          assert.isTrue(utils.typedArraysAreEqual(
            header[key],
            secondHeader[key]
          ));
        } else {
          assert.equal(
            header[key],
            secondHeader[key]
          );
        }
      });
    });
  });

  it('errBadHexBytes', () => {
    try {
      ser.deserializeSPVProof(errBadHexBytes);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Error deserializing hex, got non-hex byte:');
    }
  });

  it('errBadHexHash256', () => {
    try {
      ser.deserializeSPVProof(errBadHexHash256);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Error deserializing hex, got non-hex byte:');
    }
  });

  it('errBadLenHash256', () => {
    try {
      ser.deserializeSPVProof(errBadLenHash256);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Expected 32 bytes, got 31 bytes');
    }
  });

  it('errBadHexRawHeader', () => {
    try {
      ser.deserializeSPVProof(errBadHexRawHeader);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Error deserializing hex, got non-hex byte:');
    }
  });

  it('errBadLenRawHeader', () => {
    try {
      ser.deserializeSPVProof(errBadLenRawHeader);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Expected 80 bytes, got 79 bytes');
    }
  });

  it('errBadLenHash', () => {
    try {
      ser.deserializeSPVProof(errBadLenHash);
      assert(false, 'expected an error');
    } catch (e) {
      assert.include(e.message, 'Expected 32 bytes, got 31 bytes');
    }
  });
});
