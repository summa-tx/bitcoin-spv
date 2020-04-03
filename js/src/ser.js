import * as utils from './utils';

/**
 *
 * Takes a Header deserialized from JSON and returns a new object representing the Header
 *   with deserialized Uint8Array in place of serialzed hex strings
 *
 * @param {Object}    o The Header as an unprcessed object, immediately after derserialization
 * @returns {Object}    The Header with deserialized byte arrays
 */
export function objectToHeader(o) {
  /* eslint-disable camelcase */
  const raw = utils.deserializeHex(o.raw);
  const hash = utils.deserializeHex(o.hash);
  const prevhash = utils.deserializeHex(o.prevhash);
  const merkle_root = utils.deserializeHex(o.merkle_root);
  if (raw.length !== 80) {
    throw new TypeError(`Expected 80 bytes, got ${raw.length} bytes`);
  }
  [hash, prevhash, merkle_root].forEach((e) => {
    if (e.length !== 32) {
      throw new TypeError(`Expected 32 bytes, got ${e.length} bytes`);
    }
  });
  /* eslint-enable camelcase */

  return {
    raw,
    hash,
    height: o.height,
    prevhash,
    merkle_root,
  };
}

/**
 *
 * Deserializes a Header object from a JSON string
 *
 * @param {string}    s The Header serialized as a JSON string
 * @returns {Object}    The Header with deserialized byte arrays
 */
export function deserializeHeader(s) {
  return objectToHeader(JSON.parse(s));
}


/**
 *
 * Takes a Header and serialized each byte array. The result is suitable for JSON serialization
 *
 * @param {Object}    o The Header with deserialized byte arrays
 * @returns {Object}    The Header with byte arrays serialized as hex, suitable for serialization
 */
export function objectFromHeader(h) {
  return {
    raw: utils.serializeHex(h.raw),
    hash: utils.serializeHex(h.hash),
    height: h.height,
    prevhash: utils.serializeHex(h.prevhash),
    merkle_root: utils.serializeHex(h.merkle_root),
  };
}

/**
 *
 * Serializes a Header object to a JSON string
 *
 * @param {Object}    s The Header with deserialized byte arrays
 * @returns {string}    The Header serialized as a JSON string
 */
export function serializeHeader(h) {
  return JSON.stringify(objectFromHeader(h));
}

/**
 *
 * Takes a proof deserialized from JSON and returns a new object representing the proof
 *   with deserialized Uint8Array in place of serialzed hex strings
 *
 * @param {Object}    o The proof as an unprcessed object, immediately after derserialization
 * @returns {Object}    The proof with deserialized byte arrays
 */
export function objectToSPVProof(o) {
  /* eslint-disable camelcase */
  const version = utils.deserializeHex(o.version);
  const vin = utils.deserializeHex(o.vin);
  const vout = utils.deserializeHex(o.vout);
  const locktime = utils.deserializeHex(o.locktime);
  const tx_id = utils.deserializeHex(o.tx_id);
  const intermediate_nodes = utils.deserializeHex(o.intermediate_nodes);

  if (tx_id.length !== 32) {
    throw new TypeError(`Expected 32 bytes, got ${tx_id.length} bytes`);
  }

  return {
    version,
    vin,
    vout,
    locktime,
    tx_id,
    index: o.index,
    intermediate_nodes,
    confirming_header: objectToHeader(o.confirming_header)
  };
  /* eslint-enable camelcase */
}

/**
 *
 * Deserializes a SPVProof object from a JSON string
 *
 * @param {string}    s The SPVProof serialized as a JSON string
 * @returns {Object}    The SPVProof with deserialized byte arrays
 */
export function deserializeSPVProof(s) {
  return objectToSPVProof(JSON.parse(s));
}

/**
 *
 * Takes a SPVProof and serialized each byte array. The result is suitable for JSON serialization
 *
 * @param {Object}    o The SPVProof with deserialized byte arrays
 * @returns {Object}    Object byte arrays serialized as hex, suitable for serialization as JSON
 */
export function objectFromSPVProof(s) {
  return {
    version: utils.serializeHex(s.version),
    vin: utils.serializeHex(s.vin),
    vout: utils.serializeHex(s.vout),
    locktime: utils.serializeHex(s.locktime),
    tx_id: utils.serializeHex(s.tx_id),
    index: s.index,
    intermediate_nodes: utils.serializeHex(s.intermediate_nodes),
    confirming_header: objectFromHeader(s.confirming_header)
  };
}

/**
 *
 * Serializes a SPVProof object to a JSON string
 *
 * @param {Object}    s The SPVProof with deserialized byte arrays
 * @returns {string}    The SPVProof serialized as a JSON string
 */
export function serializeSPVProof(s) {
  return JSON.stringify(objectFromSPVProof(s));
}
