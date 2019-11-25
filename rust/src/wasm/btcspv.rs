extern crate wasm_bindgen;
extern crate num_bigint as bigint;

use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

use bigint::BigUint;

use crate::btcspv;

use super::utils;


// Imitate behavior of JS implementation
/// Script Sig length, object returned from `extract_script_sig_len`
#[allow(dead_code)]
#[allow(non_snake_case)]
#[wasm_bindgen]
pub struct ScriptSigLenResult {
    dataLen: u64,
    scriptSigLen: u64
}

/// Determines the length of a VarInt in bytes.
/// A VarInt of > 1 byte is prefixed with a flag indicating its length.
///
/// # Arguments
///
/// * `flag` - The first byte of a var_int
#[wasm_bindgen]
pub fn determine_var_int_data_length(flag: u8) -> u8 {
    btcspv::determine_var_int_data_length(flag)
}

/// Implements bitcoin's hash160 (rmd160(sha2())).
/// Returns the digest.
///
/// # Arguments
///
/// * `input` - The pre-image
#[wasm_bindgen]
pub fn hash160(input: &Uint8Array) -> Uint8Array {
    let slice = utils::u8a_to_vec(input);
    utils::output_u8a(&btcspv::hash160(&slice).to_vec())
}

/// Implements bitcoin's hash256 (double sha2).
/// Returns the digest.
///
/// # Arguments
///
/// * `input` - The pre-image
#[wasm_bindgen]
pub fn hash256(input: &Uint8Array) -> Uint8Array {
    let slice = utils::u8a_to_vec(input);
    utils::output_u8a(&btcspv::hash256(&slice).to_vec())
}

//
// Inputs
//

/// Extracts the nth input from the vin (0-indexed).
///
/// Iterates over the vin. If you need to extract several,
/// write a custom function.
///
/// # Arguments
///
/// * `vin` - The vin as a tightly-packed u8 array
/// * `index` - The 0-indexed location of the input to extract
#[wasm_bindgen]
pub fn extract_input_at_index(vin: &Uint8Array, index: u8) -> Uint8Array {
    let vec = utils::u8a_to_vec(vin);
    utils::output_u8a(&btcspv::extract_input_at_index(&vec, index))
}

/// Determines whether an input is legacy.
/// True for LEGACY, False for WITNESS,
/// False if no scriptSig.
///
/// * `tx_in` - The input
#[wasm_bindgen]
pub fn is_legacy_input(tx_in: &Uint8Array) -> bool {
    utils::input_vec(&btcspv::is_legacy_input)(tx_in)
}

/// Determines the length of an input from its scriptsig:
/// 36 for outpoint, 1 for scriptsig length, 4 for sequence.
///
/// # Arguments
///
/// * `tx_in` - The input as a u8 array
#[wasm_bindgen]
pub fn determine_input_length(tx_in: &Uint8Array) -> u64 {
    utils::input_vec(&btcspv::determine_input_length)(tx_in)
}

/// Extracts the LE sequence bytes from an input.
/// Sequence is used for relative time locks.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
#[wasm_bindgen]
pub fn extract_sequence_le_legacy(tx_in: &Uint8Array) -> Uint8Array {
    utils::output_u8a(&utils::input_vec(&btcspv::extract_sequence_le_legacy)(tx_in))
}

/// Extracts the sequence from the input.
/// Sequence is a 4-byte little-endian number.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
#[wasm_bindgen]
pub fn extract_sequence_legacy(tx_in: &Uint8Array) -> u32 {
    utils::input_vec(&btcspv::extract_sequence_legacy)(tx_in)
}

/// Extracts the VarInt-prepended scriptSig from the input in a tx.
/// Will return `vec![0]` if passed a witness input.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
#[wasm_bindgen]
pub fn extract_script_sig(tx_in: &Uint8Array) -> Uint8Array {
    utils::output_u8a(&utils::input_vec(&btcspv::extract_script_sig)(tx_in))
}

/// Determines the length of a scriptSig in an input.
/// Will return 0 if passed a witness input.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
#[wasm_bindgen]
pub fn extract_script_sig_len(tx_in: &Uint8Array) -> ScriptSigLenResult {
    let (l, r) = utils::input_vec(&btcspv::extract_script_sig_len)(tx_in);
    ScriptSigLenResult{ dataLen: l, scriptSigLen: r }
}

//
// Witness Output
//

/// Extracts the LE sequence bytes from an input.
/// Sequence is used for relative time locks.
///
/// # Arguments
///
/// * `tx_in` - The WITNESS input
#[wasm_bindgen]
pub fn extract_sequence_le_witness(tx_in: &Uint8Array) -> Uint8Array {
    utils::output_u8a(&utils::input_vec(&btcspv::extract_sequence_le_witness)(tx_in))
}

/// Extracts the sequence from the input in a tx.
/// Sequence is a 4-byte little-endian number.
///
/// # Arguments
///
/// * `tx_in` - The WITNESS input
#[wasm_bindgen]
pub fn extract_sequence_witness(tx_in: &Uint8Array) -> u32 {
    utils::input_vec(&btcspv::extract_sequence_witness)(tx_in)
}

/// Extracts the outpoint from the input in a tx,
/// 32 byte tx id with 4 byte index.
///
/// # Arguments
///
/// * `tx_in` - The input
#[wasm_bindgen]
pub fn extract_outpoint(tx_in: &Uint8Array) -> Uint8Array {
    utils::output_u8a(&utils::input_vec(&btcspv::extract_outpoint)(tx_in))
}

/// Extracts the outpoint tx id from an input,
/// 32 byte tx id.
///
/// # Arguments
///
/// * `tx_in` - The input
#[wasm_bindgen]
pub fn extract_input_tx_id_le(tx_in: &Uint8Array) -> Uint8Array {
    utils::output_u8a(&utils::input_vec(&btcspv::extract_input_tx_id_le)(tx_in))
}

/// Extracts the outpoint index from an input,
/// 32 byte tx id.
///
/// # Arguments
///
/// * `tx_in` - The input
#[wasm_bindgen]
pub fn extract_input_tx_id(tx_in: &Uint8Array) -> Uint8Array {
    utils::output_u8a(&utils::input_vec(&btcspv::extract_input_tx_id)(tx_in))
}

/// Extracts the LE tx input index from the input in a tx,
/// 4 byte tx index.
///
/// # Arguments
///
/// * `tx_in` - The input
#[wasm_bindgen]
pub fn extract_tx_index_le(tx_in: &Uint8Array) -> Uint8Array {
    utils::output_u8a(&utils::input_vec(&btcspv::extract_tx_index_le)(tx_in))
}

/// Extracts the LE tx input index from the input in a tx,
/// 4 byte tx index.
///
/// # Arguments
///
/// * `tx_in` - The input
#[wasm_bindgen]
pub fn extract_tx_index(tx_in: &Uint8Array) -> u32 {
    utils::input_vec(&btcspv::extract_tx_index)(tx_in)
}

//
// Outputs
//

/// Determines the length of an output.
/// 5 types: WPKH, WSH, PKH, SH, and OP_RETURN.
///
/// # Arguments
///
/// * `tx_out` - The output
///
/// # Errors
///
/// * Errors if VarInt represents a number larger than 253; large VarInts are not supported.
#[wasm_bindgen]
pub fn determine_output_length(tx_out: &Uint8Array) -> Result<u64, JsValue> {
    let res = utils::input_vec(&btcspv::determine_output_length)(tx_out);
    match res {
        Ok(v) => Ok(v),
        Err(e) => Err(JsValue::from_str(utils::match_err_to_string(e)))
    }
}

/// Extracts the output at a given index in the TxIns vector.
///
/// Iterates over the vout. If you need to extract multiple,
/// write a custom function.
///
/// # Arguments
///
/// * `vout` - The vout from which to extract
/// * `index` - The 0-indexed location of the output to extract
///
/// # Errors
///
/// * Errors if VarInt represents a number larger than 253.  Large VarInts are not supported.
#[wasm_bindgen]
pub fn extract_output_at_index(vout: &Uint8Array, index: u8) -> Result<Uint8Array, JsValue> {
    let vec = utils::u8a_to_vec(vout);
    let res = btcspv::extract_output_at_index(&vec, index);
    match res {
        Ok(v) => Ok(Uint8Array::from(&v[..])),
        Err(e) => Err(JsValue::from_str(utils::match_err_to_string(e)))
    }
}

/// Extracts the output script length.
/// Indexes the length prefix on the pk_script.
///
/// # Arguments
///
/// * `tx_out` - The output
#[wasm_bindgen]
pub fn extract_output_script_len(tx_out: &Uint8Array) -> u64 {
    utils::input_vec(&btcspv::extract_output_script_len)(tx_out)
}

/// Extracts the value bytes from the output in a tx.
/// Value is an 8-byte little-endian number.
///
/// # Arguments
///
/// * `tx_out` - The output
#[wasm_bindgen]
pub fn extract_value_le(tx_out: &Uint8Array) -> Uint8Array {
    utils::output_u8a(&utils::input_vec(&btcspv::extract_value_le)(tx_out)[..].to_vec())
}

/// Extracts the value from the output in a tx.
/// Value is an 8-byte little-endian number.
///
/// # Arguments
///
/// * `tx_out` - The output
#[wasm_bindgen]
pub fn extract_value(tx_out: &Uint8Array) -> u64 {
    utils::input_vec(&btcspv::extract_value)(tx_out)
}

/// Extracts the data from an op return output.
/// Errors if no data or not an op return.
///
/// # Arguments
///
/// * `tx_out` - The output
///
/// # Errors
///
/// * Errors if the op return output is malformatted
#[wasm_bindgen]
pub fn extract_op_return_data(tx_out: &Uint8Array) -> Result<Uint8Array, JsValue> {
    let vec = utils::u8a_to_vec(tx_out);
    let res = btcspv::extract_op_return_data(&vec);
    match res {
        Ok(v) => Ok(Uint8Array::from(&v[..])),
        Err(e) => Err(JsValue::from_str(utils::match_err_to_string(e)))
    }
}

/// Extracts the hash from the output script.
/// Determines type by the length prefix and validates format.
///
/// # Arguments
///
/// * `tx_out` - The output
///
/// # Errors
///
/// * Errors if the WITNESS, P2PKH or P2SH outputs are malformatted
#[wasm_bindgen]
pub fn extract_hash(tx_out: &Uint8Array) -> Result<Uint8Array, JsValue> {
    let vec = utils::u8a_to_vec(tx_out);
    let res = btcspv::extract_hash(&vec);
    match res {
        Ok(v) => Ok(Uint8Array::from(&v[..])),
        Err(e) => Err(JsValue::from_str(utils::match_err_to_string(e)))
    }
}

//
// Transaction
//

/// Checks that the vin passed up is properly formatted;
/// Consider a vin with a valid vout in its scriptsig.
///
/// # Arguments
///
/// * `vin` - Raw bytes length-prefixed input vector
#[wasm_bindgen]
pub fn validate_vin(vin: &Uint8Array) -> bool {
    utils::input_vec(&btcspv::validate_vin)(vin)
}

/// Checks that the vout passed up is properly formatted;
/// Consider a vin with a valid vout in its scriptsig.
///
/// # Arguments
///
/// * `vout` - Raw bytes length-prefixed output vector
#[wasm_bindgen]
pub fn validate_vout(vout: &Uint8Array) -> bool {
    utils::input_vec(&btcspv::validate_vout)(vout)
}

//
// Block Header
//

/// Extracts the transaction merkle root from a block header.
///
/// # Arguments
///
/// * `header` - An 80-byte Bitcoin header
#[wasm_bindgen]
pub fn extract_merkle_root_le(header: &Uint8Array) -> Uint8Array {
    let root = utils::input_header(&btcspv::extract_merkle_root_le)(header);
    utils::output_u8a(&root[..].to_vec())
}

/// Extracts the transaction merkle root from a block header.
/// Use `verify_hash256_merkle` to verify proofs with this root.
///
/// # Arguments
///
/// * `header` - An 80-byte Bitcoin header
#[wasm_bindgen]
pub fn extract_merkle_root_be(header: &Uint8Array) -> Uint8Array {
    let root = utils::input_header(&btcspv::extract_merkle_root_be)(header);
    utils::output_u8a(&root[..].to_vec())
}

/// Extracts the target from a block header.
///
/// Target is a 256 bit number encoded as a 3-byte mantissa
/// and 1 byte exponent.
///
/// # Arguments
///
/// * `header` - An 80-byte Bitcoin header
#[wasm_bindgen]
pub fn extract_target(header: &Uint8Array) -> Uint8Array {
    let target = utils::input_header(&btcspv::extract_target)(header);
    utils::output_u8a(&target.to_bytes_be())
}

/// Calculate difficulty from the difficulty 1 target and current target.
/// Difficulty 1 is 0x1d00ffff on mainnet and testnet.
///
/// # Arguments
///
/// * `target` - The current target
#[wasm_bindgen]
pub fn calculate_difficulty(target: &Uint8Array) -> Uint8Array {
    let vec = utils::u8a_to_vec(target);
    let t = BigUint::from_bytes_be(&vec);
    let res = btcspv::calculate_difficulty(&t);
    utils::output_u8a(&res.to_bytes_be())
}

/// Extracts the previous block's hash from a block header.
/// Block headers do NOT include block number :(
///
/// # Arguments
///
/// * `header` - An 80-byte Bitcoin header
#[wasm_bindgen]
pub fn extract_prev_block_hash_le(header: &Uint8Array) -> Uint8Array {
    let prev = utils::input_header(&btcspv::extract_prev_block_hash_le)(header);
    utils::output_u8a(&prev[..].to_vec())
}

/// Extracts the previous block's hash from a block header.
/// Block headers do NOT include block number :(
///
/// # Arguments
///
/// * `header` - The header
#[wasm_bindgen]
pub fn extract_prev_block_hash_be(header: &Uint8Array) -> Uint8Array {
    let prev = utils::input_header(&btcspv::extract_prev_block_hash_be)(header);
    utils::output_u8a(&prev[..].to_vec())
}

/// Extracts the LE timestamp from a block header.
/// Time is not 100% reliable.
///
/// # Arguments
///
/// * `header` - The header
#[wasm_bindgen]
pub fn extract_timestamp_le(header: &Uint8Array) -> Uint8Array {
    let time = utils::input_header(&btcspv::extract_timestamp_le)(header);
    utils::output_u8a(&time[..].to_vec())
}

/// Extracts the BE timestamp from a block header.
/// Time is not 100% reliable.
///
/// # Arguments
///
/// * `header` - The header
#[wasm_bindgen]
pub fn extract_timestamp(header: &Uint8Array) -> u32 {
    let time = utils::input_header(&btcspv::extract_timestamp_le)(header);
    u32::from_le_bytes(time)
}

/// Extracts the expected difficulty from a block header.
/// Does NOT verify the work.
///
/// # Arguments
///
/// * `header` - The header
#[wasm_bindgen]
pub fn extract_difficulty(header: &Uint8Array) -> Uint8Array {
    let diff = utils::input_header(&btcspv::extract_difficulty)(header);
    utils::output_u8a(&diff.to_bytes_be())
}

/// Concatenates and hashes two inputs for merkle proving.
///
/// # Arguments
///
/// * `a` - The first hash
/// * `b` - The second hash
#[wasm_bindgen]
pub fn hash256_merkle_step(a: &Uint8Array, b: &Uint8Array) -> Uint8Array {
    let left = utils::u8a_to_vec(a);
    let right = utils::u8a_to_vec(b);
    let digest = btcspv::hash256_merkle_step(&left, &right);
    utils::output_u8a(&digest.to_vec())
}

/// Verifies a Bitcoin-style merkle tree.
/// Leaves are 0-indexed.
///
/// # Arguments
///
/// * `proof` - The proof. Tightly packed LE sha256 hashes.  The last hash is the root
/// * `index` - The index of the leaf
#[wasm_bindgen]
pub fn verify_hash256_merkle(proof: &Uint8Array, index: u64) -> bool {
    let p = utils::u8a_to_vec(proof);
    btcspv::verify_hash256_merkle(&p, index)
}

/// Performs the bitcoin difficulty retarget.
/// Implements the Bitcoin algorithm precisely.
///
/// # Arguments
///
/// * `previous_target` - The target of the previous period
/// * `first_timestamp` - The timestamp of the first block in the difficulty period
/// * `second_timestamp` - The timestamp of the last block in the difficulty period
#[wasm_bindgen]
pub fn retarget_algorithm(previous_target: &Uint8Array, first_timestamp: u32, second_timestamp: u32) -> Uint8Array {
    let p = utils::u8a_to_vec(previous_target);
    let prev = BigUint::from_bytes_be(&p);
    let new_target = btcspv::retarget_algorithm(&prev, first_timestamp, second_timestamp);
    utils::output_u8a(&new_target.to_bytes_be())
}
