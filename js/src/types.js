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
  return {
    raw: utils.deserializeHex(o.raw),
    hash: utils.deserializeHex(o.hash),
    hash_le: utils.deserializeHex(o.hash_le),
    height: o.height,
    prevhash: utils.deserializeHex(o.prevhash),
    merkle_root: utils.deserializeHex(o.merkle_root),
    merkle_root_le: utils.deserializeHex(o.merkle_root_le)
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
    hash_le: utils.serializeHex(h.hash_le),
    height: h.height,
    prevhash: utils.serializeHex(h.prevhash),
    merkle_root: utils.serializeHex(h.merkle_root),
    merkle_root_le: utils.serializeHex(h.merkle_root_le)
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
  JSON.stringify(objectFromHeader(h));
}

/**
 *
 * Takes a proof deserialized from JSON and returns a new object representing the proof
 *   with deserialized Uint8Array in place of serialzed hex strings
 *
 * @param {Object}    o The proof as an unprcessed object, immediately after derserialization
 * @returns {Object}      The proof with deserialized byte arrays
 */
export function objectToSPVProof(o) {
  return {
    version: utils.deserializeHex(o.version),
    vin: utils.deserializeHex(o.vin),
    vout: utils.deserializeHex(o.vout),
    locktime: utils.deserializeHex(o.locktime),
    tx_id: utils.deserializeHex(o.tx_id),
    tx_id_le: utils.deserializeHex(o.tx_id_le),
    index: o.index,
    intermediate_nodes: utils.deserializeHex(o.intermediate_nodes),
    confirming_header: objectToHeader(o.confirming_header)
  };
}

/**
 *
 * Deserializes a SPVProof object from a JSON string
 *
 * @param {string}    s The SPVProof serialized as a JSON string
 * @returns {Object}      The SPVProof with deserialized byte arrays
 */
export function deserializeSPVProof(s) {
  return objectToSPVProof(JSON.parse(s));
}

/**
 *
 * Takes a SPVProof and serialized each byte array. The result is suitable for JSON serialization
 *
 * @param {Object}    o The SPVProof with deserialized byte arrays
 * @returns {Object}    The SPVProof with byte arrays serialized as hex, suitable for serialization
 */
export function objectFromSPVProof(s) {
  return {
    version: utils.deserializeHex(s.version),
    vin: utils.deserializeHex(s.vin),
    vout: utils.deserializeHex(s.vout),
    locktime: utils.deserializeHex(s.locktime),
    tx_id: utils.deserializeHex(s.tx_id),
    tx_id_le: utils.deserializeHex(s.tx_id_le),
    index: s.index,
    intermediate_nodes: utils.deserializeHex(s.intermediate_nodes),
    confirming_header: objectFromHeader(s.confirming_header)
  };
}

/**
 *
 * Serializes a SPVProof object to a JSON string
 *
 * @param {Object}  s The SPVProof with deserialized byte arrays
 * @returns {string}    The SPVProof serialized as a JSON string
 */
export function serializeSPVProof(s) {
  JSON.stringify(objectFromSPVProof(s));
}
