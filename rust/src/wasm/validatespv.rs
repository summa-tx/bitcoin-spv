extern crate wasm_bindgen;
extern crate num_bigint as bigint;

use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

use bigint::BigUint;

use crate::validatespv;
use crate::types::{InputType, OutputType};

use super::utils;

// Imitate behavior of JS implementation
/// Parsed input
#[allow(dead_code)]
#[allow(non_snake_case)]
#[wasm_bindgen]
pub struct ParsedInput {
    sequence: u32,
    inputId: Uint8Array,
    inputIndex: u32,
    inputType: InputType
}

// Imitate behavior of JS implementation
/// Parsed output
#[allow(dead_code)]
#[allow(non_snake_case)]
#[wasm_bindgen]
pub struct ParsedOutput {
    value: u64,
    outputType: OutputType,
    payload: Uint8Array
}

// Imitate behavior of JS implementation
/// Parsed Bitcoin header
#[allow(dead_code)]
#[allow(non_snake_case)]
#[wasm_bindgen]
pub struct ParsedHeader {
    digest: Uint8Array,
    version: u32,
    prevHash: Uint8Array,
    merkleRoot: Uint8Array,
    timestamp: u32,
    target: Uint8Array,
    nonce: u32
}

/// Validates a tx inclusion in the block.
///
/// # Arguments
///
/// * `txid` - The txid (LE)
/// * `merkle_root` - The merkle root (as in the block header)
/// * `intermediate_nodes` - The proof's intermediate nodes (digests between leaf and root)
/// * `index` - The leaf's index in the tree (0-indexed)
#[wasm_bindgen]
pub fn prove(txid: &Uint8Array, merkle_root: &Uint8Array, intermediate_nodes: &Uint8Array, index: u64) -> bool {
    let t = utils::u8a_to_hash256_digest(txid);
    let m = utils::u8a_to_hash256_digest(merkle_root);
    let i = utils::u8a_to_vec(intermediate_nodes);
    validatespv::prove(t, m, &i, index)
}

/// Hashes transaction to get txid.
///
/// # Arguments
///
/// * `version` - 4-bytes version
/// * `vin` - Raw bytes length-prefixed input vector
/// * `vout` - Raw bytes length-prefixed output vector
/// * `locktime` - 4-byte tx locktime
#[wasm_bindgen]
pub fn calculate_txid(version: &Uint8Array, vin: &Uint8Array, vout: &Uint8Array, locktime: &Uint8Array) -> Uint8Array {
    let ver = utils::u8a_to_vec(version);
    let vi = utils::u8a_to_vec(vin);
    let vo = utils::u8a_to_vec(vout);
    let lock = utils::u8a_to_vec(locktime);
    utils::output_u8a(&validatespv::calculate_txid(&ver, &vi, &vo, &lock).to_vec())
}

/// Parses a tx input from raw input bytes.
/// Supports LEGACY and WITNESS inputs.
///
/// # Arguments
///
/// * `tx_in` - The tx input
#[wasm_bindgen]
pub fn parse_input(tx_in: &Uint8Array) -> ParsedInput {
    let t = utils::u8a_to_vec(tx_in);
    let (a, b, c, d) = validatespv::parse_input(&t);

    ParsedInput{
        sequence: a,
        inputId: Uint8Array::from(&b[..]),
        inputIndex: c,
        inputType: d }
}

/// Parses a tx output from raw output bytes.
///
/// # Arguments
///
/// * `tx_out` - The tx output
#[wasm_bindgen]
pub fn parse_output(tx_out: &Uint8Array) -> ParsedOutput {
    let t = utils::u8a_to_vec(tx_out);
    let (a, b, c) = validatespv::parse_output(&t);

    ParsedOutput{
        value: a,
        outputType: b,
        payload: Uint8Array::from(&c[..]) }
}

/// Parses a block header struct from a bytestring.
/// Note: Block headers are always 80 bytes, see Bitcoin docs.
///
/// # Arguments
///
/// * `header` - The header
#[wasm_bindgen]
pub fn parse_header(header: &Uint8Array) -> ParsedHeader {
    let h = utils::u8a_to_header(header);
    let (a, b, c, d, e, f, g) = validatespv::parse_header(h);
    ParsedHeader{
        digest: Uint8Array::from(&a[..]),
        version: b,
        prevHash: Uint8Array::from(&c[..]),
        merkleRoot: Uint8Array::from(&d[..]),
        timestamp: e,
        target: Uint8Array::from(&f.to_bytes_be()[..]),
        nonce: g
    }
}

/// Checks validity of header work.
///
/// # Arguments
///
/// * `digest` - The digest
/// * `target` - The target threshold
#[wasm_bindgen]
pub fn validate_header_work(digest: &Uint8Array, target: &Uint8Array) -> bool {
    let d = utils::u8a_to_hash256_digest(digest);
    let vec = utils::u8a_to_vec(target);
    let t = BigUint::from_bytes_be(&vec);
    validatespv::validate_header_work(d, &t)
}

/// Checks validity of header chain.
///
/// # Arguments
///
/// * `header` - The raw bytes header
/// * `prev_hash` - The previous header's digest
#[wasm_bindgen]
pub fn validate_header_prev_hash(header: &Uint8Array, prev_hash: &Uint8Array) -> bool {
    let h = utils::u8a_to_header(header);
    let p = utils::u8a_to_hash256_digest(prev_hash);
    validatespv::validate_header_prev_hash(h, p)
}

/// Checks validity of header chain.
/// Compares the hash of each header to the prevHash in the next header.
///
/// # Arguments
///
/// * `headers` - Raw byte array of header chain
///
/// # Errors
///
/// * Errors if header chain is the wrong length, chain is invalid or insufficient work
#[wasm_bindgen]
pub fn validate_header_chain(headers: &Uint8Array) -> Result<Uint8Array, JsValue> {
    let h = utils::u8a_to_vec(headers);
    let res = validatespv::validate_header_chain(&h);
    match res {
        Ok(v) => Ok(Uint8Array::from(&v.to_bytes_be()[..])),
        Err(e) => Err(JsValue::from_str(utils::match_err_to_string(e)))
    }
}
