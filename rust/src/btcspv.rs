use num::bigint::BigUint;
use num::pow::Pow;
use ripemd160::{Digest, Ripemd160};
use sha2::Sha256;

use crate::types::{Hash160Digest, Hash256Digest, RawHeader, SPVError};

/// Determines the length of a VarInt in bytes.
/// A VarInt of > 1 byte is prefixed with a flag indicating its length.
///
/// # Arguments
///
/// * `flag` - The first byte of a var_int
pub fn determine_var_int_data_length(flag: u8) -> u8 {
    let length: u8 = match flag {
        0xfd => 2,
        0xfe => 4,
        0xff => 8,
        _ => 0,
    };
    length
}

/// Parse a VarInt into its data length and the number it represents
/// Useful for Parsing Vins and Vouts. Returns `BadVarInt` if insufficient bytes.
///
/// # Arguments
///
/// * `b` - A byte-string starting with a VarInt
///
/// # Returns
///
/// * (length, number) - the length of the data in bytes, and the number it represents
pub fn parse_var_int(b: &[u8]) -> Result<(usize, usize), SPVError> {
    let length = determine_var_int_data_length(b[0]) as usize;

    if length == 0 {
        return Ok((0, b[0] as usize));
    }
    if b.len() < 1 + length {
        return Err(SPVError::BadVarInt);
    }

    let mut num_bytes = [0u8; 8];
    num_bytes[..length].copy_from_slice(&b[1..=length]);

    Ok((length, u64::from_le_bytes(num_bytes) as usize))
}

/// Implements bitcoin's hash160 (rmd160(sha2())).
/// Returns the digest.
///
/// # Arguments
///
/// * `preimage` - The pre-image
pub fn hash160(preimage: &[u8]) -> Hash160Digest {
    let mut sha = Sha256::new();
    sha.input(preimage);
    let digest = sha.result();

    let mut rmd = Ripemd160::new();
    rmd.input(digest);

    rmd.result().into()
}

/// Implements bitcoin's hash256 (double sha2).
/// Returns the digest.
///
/// # Arguments
///
/// * `preimage` - The pre-image
pub fn hash256(preimages: &[&[u8]]) -> Hash256Digest {
    let mut sha = Sha256::new();
    for preimage in preimages.iter() {
        sha.input(preimage);
    }
    let digest = sha.result();

    let mut second_sha = Sha256::new();
    second_sha.input(digest);
    second_sha.result().into()
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
pub fn extract_input_at_index(vin: &[u8], index: usize) -> Result<&[u8], SPVError> {
    let (data_len, n_ins) = parse_var_int(vin)?;
    if index >= n_ins {
        return Err(SPVError::ReadOverrun);
    }

    let mut length = 0;
    let mut offset = 1 + data_len;

    for i in 0..=index {
        length = determine_input_length(&vin[offset..])?;
        if i != index {
            offset += length as usize;
        }
    }

    if offset + length as usize > vin.len() {
        return Err(SPVError::ReadOverrun);
    }

    Ok(&vin[offset..offset + length as usize])
}

/// Determines whether an input is legacy.
/// True for LEGACY, False for WITNESS,
/// False if no scriptSig.
///
/// # Arguments
///
/// * `tx_in` - The input
///
/// # Panics
///
/// If the tx_in is malformatted, i.e. <= 36 bytes long
pub fn is_legacy_input(tx_in: &[u8]) -> bool {
    tx_in[36] != 0
}

/// Determines the length of a scriptSig in an input.
/// Will return 0 if passed a witness input.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
pub fn extract_script_sig_len(tx_in: &[u8]) -> Result<(usize, usize), SPVError> {
    if tx_in.len() < 37 {
        return Err(SPVError::ReadOverrun);
    }
    parse_var_int(&tx_in[36..])
}

/// Determines the length of an input from its scriptsig:
/// 36 for outpoint, 1 for scriptsig length, 4 for sequence.
///
/// # Arguments
///
/// * `tx_in` - The input as a u8 array
pub fn determine_input_length(tx_in: &[u8]) -> Result<usize, SPVError> {
    let (data_len, script_sig_len) = extract_script_sig_len(tx_in)?;
    Ok(41 + data_len + script_sig_len)
}

/// Extracts the LE sequence bytes from an input.
/// Sequence is used for relative time locks.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
pub fn extract_sequence_le_legacy(tx_in: &[u8]) -> Result<&[u8], SPVError> {
    let (data_len, script_sig_len) = extract_script_sig_len(tx_in)?;
    let offset: usize = 36 + 1 + data_len as usize + script_sig_len as usize;
    Ok(&tx_in[offset..offset + 4])
}

/// Extracts the sequence from the input.
/// Sequence is a 4-byte little-endian number.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
pub fn extract_sequence_legacy(tx_in: &[u8]) -> Result<u32, SPVError> {
    let mut arr: [u8; 4] = [0u8; 4];
    let b = extract_sequence_le_legacy(tx_in)?;
    arr.copy_from_slice(&b[..]);
    Ok(u32::from_le_bytes(arr))
}

/// Extracts the VarInt-prepended scriptSig from the input in a tx.
/// Will return `vec![0]` if passed a witness input.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
pub fn extract_script_sig(tx_in: &[u8]) -> Result<&[u8], SPVError> {
    let (data_len, script_sig_len) = extract_script_sig_len(tx_in)?;
    let length = 1 + data_len + script_sig_len;
    Ok(&tx_in[36..36 + length as usize])
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
pub fn extract_sequence_le_witness(tx_in: &[u8]) -> &[u8] {
    &tx_in[37..41]
}

/// Extracts the sequence from the input in a tx.
/// Sequence is a 4-byte little-endian number.
///
/// # Arguments
///
/// * `tx_in` - The WITNESS input
pub fn extract_sequence_witness(tx_in: &[u8]) -> u32 {
    let mut arr: [u8; 4] = [0u8; 4];
    let b = extract_sequence_le_witness(tx_in);
    arr.copy_from_slice(&b[..]);
    u32::from_le_bytes(arr)
}

/// Extracts the outpoint from the input in a tx,
/// 32 byte tx id with 4 byte index.
///
/// # Arguments
///
/// * `tx_in` - The input
pub fn extract_outpoint(tx_in: &[u8]) -> &[u8] {
    &tx_in[0..36]
}

/// Extracts the outpoint tx id from an input,
/// 32 byte tx id.
///
/// # Arguments
///
/// * `tx_in` - The input
pub fn extract_input_tx_id_le(tx_in: &[u8]) -> &[u8] {
    &tx_in[0..32]
}

/// Extracts the LE tx input index from the input in a tx,
/// 4 byte tx index.
///
/// # Arguments
///
/// * `tx_in` - The input
pub fn extract_tx_index_le(tx_in: &[u8]) -> &[u8] {
    &tx_in[32..36]
}

/// Extracts the LE tx input index from the input in a tx,
/// 4 byte tx index.
///
/// # Arguments
///
/// * `tx_in` - The input
pub fn extract_tx_index(tx_in: &[u8]) -> u32 {
    let mut arr: [u8; 4] = [0u8; 4];
    let b = extract_tx_index_le(tx_in);
    arr.copy_from_slice(&b[..]);
    u32::from_le_bytes(arr)
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
pub fn determine_output_length(tx_out: &[u8]) -> Result<usize, SPVError> {
    if tx_out.len() < 9 {
        return Err(SPVError::MalformattedOutput);
    }
    let (data_len, script_pubkey_len) = parse_var_int(&tx_out[8..])?;

    Ok(8 + 1 + data_len + script_pubkey_len)
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
pub fn extract_output_at_index(vout: &[u8], index: usize) -> Result<&[u8], SPVError> {
    let (data_len, n_outs) = parse_var_int(vout)?;
    if index >= n_outs {
        return Err(SPVError::ReadOverrun);
    }

    let mut length = 0;
    let mut offset = 1 + data_len;

    for i in 0..=index {
        length = determine_output_length(&vout[offset..])?;
        if i != index {
            offset += length as usize
        }
    }

    if offset + length as usize > vout.len() {
        return Err(SPVError::ReadOverrun);
    }

    Ok(&vout[offset..offset + length])
}

/// Extracts the value bytes from the output in a tx.
/// Value is an 8-byte little-endian number.
///
/// # Arguments
///
/// * `tx_out` - The output
pub fn extract_value_le(tx_out: &[u8]) -> [u8; 8] {
    let mut arr: [u8; 8] = Default::default();
    arr.copy_from_slice(&tx_out[..8]);
    arr
}

/// Extracts the value from the output in a tx.
/// Value is an 8-byte little-endian number.
///
/// # Arguments
///
/// * `tx_out` - The output
pub fn extract_value(tx_out: &[u8]) -> u64 {
    u64::from_le_bytes(extract_value_le(tx_out))
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
pub fn extract_op_return_data(tx_out: &[u8]) -> Result<&[u8], SPVError> {
    if tx_out[9] == 0x6a {
        let data_len = tx_out[10] as u64;
        if (data_len + 8 + 3) as usize > tx_out.len() {
            return Err(SPVError::ReadOverrun);
        }
        Ok(&tx_out[11..11 + data_len as usize])
    } else {
        Err(SPVError::MalformattedOpReturnOutput)
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
pub fn extract_hash(tx_out: &[u8]) -> Result<&[u8], SPVError> {
    let tag = &tx_out[8..11];

    if (tag[0]) as usize + 9 != tx_out.len() {
      return Err(SPVError::OutputLengthMismatch);
    }

    /* Witness */
    if tx_out[9] == 0 {
        let script_len = tx_out[8];
        let payload_len = tx_out[10];
        if script_len < 2 {
            return Err(SPVError::MalformattedWitnessOutput);
        }

        if payload_len + 2 == script_len && (payload_len == 0x20 || payload_len == 0x14) {
            return Ok(&tx_out[11..11 + payload_len as usize]);
        } else {
            return Err(SPVError::MalformattedWitnessOutput);
        }
    }

    /* P2PKH */
    if tag == [0x19, 0x76, 0xa9] {
        let last_two: &[u8] = &tx_out[tx_out.len() - 2..];
        if tx_out[11] != 0x14 || last_two != [0x88, 0xac] {
            return Err(SPVError::MalformattedP2PKHOutput);
        }
        return Ok(&tx_out[12..32]);
    }

    /* P2SH */
    if tag == [0x17, 0xa9, 0x14] {
        if tx_out.last().cloned() != Some(0x87) {
            return Err(SPVError::MalformattedP2SHOutput);
        }
        return Ok(&tx_out[11..31]);
    }

    Err(SPVError::MalformattedOutput)
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
pub fn validate_vin(vin: &[u8]) -> bool {
    let (data_len, n_ins) = match parse_var_int(vin) {
        Ok(v) => v,
        Err(_) => return false,
    };

    let vin_length = vin.len();

    let mut offset = 1 + data_len;
    if n_ins == 0 {
        return false;
    }

    for _ in 0..n_ins {
        if offset >= vin_length {
            return false;
        }
        match determine_input_length(&vin[offset as usize..]) {
            Ok(v) => offset += v as usize,
            Err(_) => return false,
        };
    }

    offset == vin_length
}

/// Checks that the vout passed up is properly formatted;
/// Consider a vin with a valid vout in its scriptsig.
///
/// # Arguments
///
/// * `vout` - Raw bytes length-prefixed output vector
pub fn validate_vout(vout: &[u8]) -> bool {
    let (data_len, n_outs) = match parse_var_int(vout) {
        Ok(v) => v,
        Err(_) => return false,
    };

    let vout_length = vout.len();

    let mut offset = 1 + data_len;
    if n_outs == 0 {
        return false;
    }

    for _ in 0..n_outs {
        if offset >= vout_length {
            return false;
        }
        match determine_output_length(&vout[offset as usize..]) {
            Ok(v) => offset += v as usize,
            Err(_) => return false,
        };
    }

    offset == vout_length
}

//
// Block Header
//

/// Extracts the transaction merkle root from a block header.
///
/// # Arguments
///
/// * `header` - An 80-byte Bitcoin header
pub fn extract_merkle_root_le(header: RawHeader) -> Hash256Digest {
    let mut root: [u8; 32] = Default::default();
    root.copy_from_slice(&header[36..68]);
    root
}

/// Extracts the target from a block header.
///
/// Target is a 256 bit number encoded as a 3-byte mantissa
/// and 1 byte exponent.
///
/// # Arguments
///
/// * `header` - An 80-byte Bitcoin header
pub fn extract_target(header: RawHeader) -> BigUint {
    let mantissa = BigUint::from_bytes_le(&header[72..75]);
    // We use saturating here to avoid panicking.
    // This is safe because it saturates at `0`, which gives an unreachable target of `1`
    let exponent = header[75].saturating_sub(3);
    let offset = BigUint::from(256 as u64).pow(exponent);

    mantissa * offset
}

/// Calculate difficulty from the difficulty 1 target and current target.
/// Difficulty 1 is 0x1d00ffff on mainnet and testnet.
///
/// # Arguments
///
/// * `target` - The current target
pub fn calculate_difficulty(target: &BigUint) -> BigUint {
    let mut arr: [u8; 28] = Default::default();
    arr[0] = 0xff;
    arr[1] = 0xff;
    let diff_one_target = BigUint::from_bytes_be(&arr);
    diff_one_target / target
}

/// Extracts the previous block's hash from a block header.
/// Block headers do NOT include block number :(
///
/// # Arguments
///
/// * `header` - An 80-byte Bitcoin header
pub fn extract_prev_block_hash_le(header: RawHeader) -> Hash256Digest {
    let mut root: [u8; 32] = Default::default();
    root.copy_from_slice(&header[4..36]);
    root
}

/// Extracts the LE timestamp from a block header.
/// Time is not 100% reliable.
///
/// # Arguments
///
/// * `header` - The header
pub fn extract_timestamp_le(header: RawHeader) -> [u8; 4] {
    let mut timestamp: [u8; 4] = Default::default();
    timestamp.copy_from_slice(&header[68..72]);
    timestamp
}

/// Extracts the BE timestamp from a block header.
/// Time is not 100% reliable.
///
/// # Arguments
///
/// * `header` - The header
pub fn extract_timestamp(header: RawHeader) -> u32 {
    u32::from_le_bytes(extract_timestamp_le(header))
}

/// Extracts the expected difficulty from a block header.
/// Does NOT verify the work.
///
/// # Arguments
///
/// * `header` - The header
pub fn extract_difficulty(header: RawHeader) -> BigUint {
    calculate_difficulty(&extract_target(header))
}

/// Concatenates and hashes two inputs for merkle proving.
///
/// # Arguments
///
/// * `a` - The first hash
/// * `b` - The second hash
pub fn hash256_merkle_step(a: &[u8], b: &[u8]) -> Hash256Digest {
    hash256(&[a, b])
}

/// Verifies a Bitcoin-style merkle tree.
/// Leaves are 0-indexed.
/// Note that `index` is not a reliable indicator of location within a block.
///
/// # Arguments
///
/// * `proof` - The proof. Tightly packed LE sha256 hashes.  The last hash is the root
/// * `index` - The index of the leaf
pub fn verify_hash256_merkle(txid: Hash256Digest, merkle_root: Hash256Digest, intermediate_nodes: &[u8], index: u64) -> bool {
    let mut idx = index;
    let proof_len = intermediate_nodes.len();

    if proof_len % 32 != 0 {
        return false;
    }

    if proof_len == 32 {
        return true;
    }

    if proof_len == 0 {
        if txid == merkle_root {
            return true;
        }
        return false;  // no intermediate nodes
    }

    let num_steps = proof_len / 32;

    let mut current = txid;
    let mut next = Hash256Digest::default();

    for i in 0..num_steps {
        next.copy_from_slice(&intermediate_nodes[i * 32..i * 32 + 32]);

        if idx % 2 == 1 {
            current = hash256_merkle_step(&next, &current);
        } else {
            current = hash256_merkle_step(&current, &next);
        }
        idx >>= 1;
    }

    current == merkle_root
}

/// Performs the bitcoin difficulty retarget.
/// Implements the Bitcoin algorithm precisely.
///
/// # Arguments
///
/// * `previous_target` - The target of the previous period
/// * `first_timestamp` - The timestamp of the first block in the difficulty period
/// * `second_timestamp` - The timestamp of the last block in the difficulty period
pub fn retarget_algorithm(
    previous_target: &BigUint,
    first_timestamp: u32,
    second_timestamp: u32,
) -> BigUint {
    let retarget_period = 1_209_600;
    let lower_bound = retarget_period / 4;
    let upper_bound = retarget_period * 4;

    let mut elapsed_time = second_timestamp - first_timestamp;
    elapsed_time = core::cmp::min(upper_bound, elapsed_time);
    elapsed_time = core::cmp::max(lower_bound, elapsed_time);

    previous_target * elapsed_time / retarget_period
}

#[cfg(test)]
#[cfg_attr(tarpaulin, skip)]
mod tests {
    extern crate std;
    extern crate hex;

    use std::{
        println,
        vec,      // The macro
    };

    use num::bigint::BigUint;
    use super::*;
    use crate::test_utils::{self, force_deserialize_hex};

    #[test]
    fn it_determines_var_int_data_length() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("determineVarIntDataLength", &fixtures);
            for case in test_cases {
                let input = case.input.as_u64().unwrap() as u8;
                let expected = case.output.as_u64().unwrap() as u8;
                assert_eq!(determine_var_int_data_length(input), expected);
            }
        })
    }

    #[test]
    fn it_parses_var_ints() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("parseVarInt", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected = case.output.as_array().unwrap();
                let expected_len = expected[0].as_u64().unwrap() as usize;
                let expected_num = expected[1].as_u64().unwrap() as usize;
                assert_eq!(parse_var_int(&input).unwrap(), (expected_len, expected_num));
            }
        })
    }

    #[test]
    fn it_parses_var_int_errors() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("parseVarIntError", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                match parse_var_int(&input) {
                    Ok(_) => assert!(false, "expected an error"),
                    Err(e) => assert_eq!(e, SPVError::BadVarInt),
                }
            }
        })
    }

    #[test]
    fn it_does_bitcoin_hash160() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("hash160", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let mut expected: [u8; 20] = Default::default();
                let output = force_deserialize_hex(case.output.as_str().unwrap());
                expected.copy_from_slice(&output);
                assert_eq!(hash160(&input), expected);
            }
        })
    }

    #[test]
    fn it_does_bitcoin_hash256() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("hash256", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let mut expected: [u8; 32] = Default::default();
                let output = force_deserialize_hex(case.output.as_str().unwrap());
                expected.copy_from_slice(&output);
                assert_eq!(hash256(&[&input]), expected);
            }
        })
    }

    #[test]
    fn it_computes_hash256_merkle_steps() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("hash256MerkleStep", &fixtures);
            for case in test_cases {
                let inputs = case.input.as_array().unwrap();
                let a = force_deserialize_hex(inputs[0].as_str().unwrap());
                let b = force_deserialize_hex(inputs[1].as_str().unwrap());
                let mut expected: [u8; 32] = Default::default();
                let output = force_deserialize_hex(case.output.as_str().unwrap());
                expected.copy_from_slice(&output);
                assert_eq!(hash256_merkle_step(&a, &b), expected);
            }
        })
    }

    #[test]
    fn it_extracts_script_sig_length_info() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractScriptSigLen", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());

                let outputs = case.output.as_array().unwrap();
                let a = outputs[0].as_u64().unwrap() as usize;
                let b = outputs[1].as_u64().unwrap() as usize;

                assert_eq!(extract_script_sig_len(&input).unwrap(), (a, b));
            }
        })
    }

    #[test]
    fn it_extracts_legacy_le_sequence_info() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractSequenceLELegacy", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected: &[u8] = &force_deserialize_hex(case.output.as_str().unwrap());
                assert_eq!(extract_sequence_le_legacy(&input).unwrap(), expected);
            }
        })
    }

    #[test]
    fn it_extracts_legacy_sequence_info() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractSequenceLegacy", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected = case.output.as_u64().unwrap() as u32;
                assert_eq!(extract_sequence_legacy(&input).unwrap(), expected);
            }
        })
    }

    #[test]
    fn it_determines_input_length() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("determineInputLength", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected = case.output.as_u64().unwrap() as usize;
                assert_eq!(determine_input_length(&input).unwrap(), expected);
            }
        })
    }

    #[test]
    fn it_extracts_inputs_from_the_vin() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractInputAtIndex", &fixtures);
            for case in test_cases {
                let inputs = case.input.as_object().unwrap();
                let vin = force_deserialize_hex(inputs.get("vin").unwrap().as_str().unwrap());
                let index = inputs.get("index").unwrap().as_u64().unwrap() as usize;
                let expected: &[u8] = &force_deserialize_hex(case.output.as_str().unwrap());
                assert_eq!(extract_input_at_index(&vin[..], index).unwrap(), expected);
            }
        })
    }

    #[test]
    fn it_errrors_properly_when_it_extracts_inputs_from_the_vin() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractInputAtIndexError", &fixtures);
            for case in test_cases {
                let inputs = case.input.as_object().unwrap();
                let vin = force_deserialize_hex(inputs.get("vin").unwrap().as_str().unwrap());
                let index = inputs.get("index").unwrap().as_u64().unwrap() as usize;
                let expected =
                    test_utils::match_string_to_err(case.error_message.as_str().unwrap());
                match extract_input_at_index(&vin[..], index) {
                    Ok(_) => assert!(false, "expected an error"),
                    Err(e) => assert_eq!(e, expected),
                }
            }
        })
    }

    #[test]
    fn it_identifies_legacy_inputs() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("isLegacyInput", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected = case.output.as_bool().unwrap();
                assert_eq!(is_legacy_input(&input), expected);
            }
        })
    }

    #[test]
    fn it_extracts_scipt_sigs() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractScriptSig", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected: &[u8] = &force_deserialize_hex(case.output.as_str().unwrap());
                assert_eq!(extract_script_sig(&input).unwrap(), expected);
            }
        })
    }

    #[test]
    fn it_extracts_witness_le_sequence_numbers() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractSequenceLEWitness", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected: &[u8] = &force_deserialize_hex(case.output.as_str().unwrap());
                assert_eq!(extract_sequence_le_witness(&input), expected);
            }
        })
    }

    #[test]
    fn it_extracts_witness_sequence_numbers() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractSequenceWitness", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected = case.output.as_u64().unwrap() as u32;
                assert_eq!(extract_sequence_witness(&input), expected);
            }
        })
    }

    #[test]
    fn it_extracts_outpoints() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractOutpoint", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected: &[u8] = &force_deserialize_hex(case.output.as_str().unwrap());
                assert_eq!(extract_outpoint(&input), &expected[..]);
            }
        })
    }

    #[test]
    fn it_extracts_outpoint_txids() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractInputTxIdLE", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected: &[u8] = &force_deserialize_hex(case.output.as_str().unwrap());
                assert_eq!(extract_input_tx_id_le(&input), expected);
            }
        })
    }

    #[test]
    fn it_extracts_outpoint_indices_le() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractTxIndexLE", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected: &[u8] = &force_deserialize_hex(case.output.as_str().unwrap());
                assert_eq!(extract_tx_index_le(&input), expected);
            }
        })
    }

    #[test]
    fn it_extracts_outpoint_indices() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractTxIndex", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected = case.output.as_u64().unwrap() as u32;
                assert_eq!(extract_tx_index(&input), expected);
            }
        })
    }

    #[test]
    fn it_determines_output_length() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("determineOutputLength", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected = case.output.as_u64().unwrap() as usize;
                assert_eq!(determine_output_length(&input).unwrap(), expected);
            }
        })
    }

    #[test]
    fn it_extracts_outputs_from_the_vout() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractOutputAtIndex", &fixtures);
            for case in test_cases {
                let inputs = case.input.as_object().unwrap();
                let vout = force_deserialize_hex(inputs.get("vout").unwrap().as_str().unwrap());
                let index = inputs.get("index").unwrap().as_u64().unwrap() as usize;
                let expected: &[u8] = &force_deserialize_hex(case.output.as_str().unwrap());
                assert_eq!(extract_output_at_index(&vout, index).unwrap(), expected);
            }
        })
    }

    #[test]
    fn it_errors_properly_when_it_extracts_outputs_from_the_vout() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractOutputAtIndexError", &fixtures);
            for case in test_cases {
                let outputs = case.input.as_object().unwrap();
                let vout = force_deserialize_hex(outputs.get("vout").unwrap().as_str().unwrap());
                let index = outputs.get("index").unwrap().as_u64().unwrap() as usize;
                let expected =
                    test_utils::match_string_to_err(case.error_message.as_str().unwrap());
                match extract_output_at_index(&vout[..], index) {
                    Ok(_) => assert!(false, "expected an error"),
                    Err(e) => assert_eq!(e, expected),
                }
            }
        })
    }

    #[test]
    fn it_extracts_output_value_le() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractValueLE", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let mut expected: [u8; 8] = Default::default();
                let val = force_deserialize_hex(case.output.as_str().unwrap());
                expected.copy_from_slice(&val);
                assert_eq!(extract_value_le(&input[..]), expected);
            }
        })
    }

    #[test]
    fn it_extracts_output_value() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractValue", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected = case.output.as_u64().unwrap();
                assert_eq!(extract_value(&input[..]), expected);
            }
        })
    }

    #[test]
    fn it_extracts_op_return_data() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractOpReturnData", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected: &[u8] = &force_deserialize_hex(case.output.as_str().unwrap());
                assert_eq!(extract_op_return_data(&input).unwrap(), expected);
            }
        })
    }

    #[test]
    fn it_extracts_op_return_data_errors() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractOpReturnDataError", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected =
                    test_utils::match_string_to_err(case.error_message.as_str().unwrap());
                match extract_op_return_data(&input) {
                    Ok(_) => assert!(false, "expected an error"),
                    Err(e) => assert_eq!(e, expected),
                }
            }
        })
    }

    #[test]
    fn it_extracts_standard_output_hashes() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractHash", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected: &[u8] = &force_deserialize_hex(case.output.as_str().unwrap());
                assert_eq!(extract_hash(&input).unwrap(), expected);
            }
        })
    }

    #[test]
    fn it_errors_extracting_output_hashes() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractHashError", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected =
                    test_utils::match_string_to_err(case.error_message.as_str().unwrap());
                match extract_hash(&input) {
                    Ok(_) => assert!(false, "expected an error"),
                    Err(e) => assert_eq!(e, expected),
                }
            }
        })
    }

    #[test]
    fn it_validates_vin_syntax() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("validateVin", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected = case.output.as_bool().unwrap();
                assert_eq!(validate_vin(&input), expected);
            }
        })
    }

    #[test]
    fn it_validates_vout_syntax() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("validateVout", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected = case.output.as_bool().unwrap();
                assert_eq!(validate_vout(&input), expected);
            }
        })
    }

    #[test]
    fn it_extracts_header_target() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractTarget", &fixtures);
            for case in test_cases {
                let mut input: RawHeader = [0; 80];
                input.copy_from_slice(&force_deserialize_hex(case.input.as_str().unwrap()));
                let expected_bytes = force_deserialize_hex(case.output.as_str().unwrap());
                let expected = BigUint::from_bytes_be(&expected_bytes);
                assert_eq!(extract_target(input), expected);
            }
        })
    }

    #[test]
    fn it_extracts_timestamps() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractTimestamp", &fixtures);
            for case in test_cases {
                let mut input: RawHeader = [0; 80];
                input.copy_from_slice(&force_deserialize_hex(case.input.as_str().unwrap()));
                let expected = case.output.as_u64().unwrap() as u32;
                assert_eq!(extract_timestamp(input), expected);
            }
        })
    }

    #[test]
    fn it_verifies_hash256_merkles() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("verifyHash256Merkle", &fixtures);
            for case in test_cases {
                let inputs = case.input.as_object().unwrap();
                let extended_proof = force_deserialize_hex(inputs.get("proof").unwrap().as_str().unwrap());
                let proof_len = extended_proof.len();
                if proof_len < 32 {
                    continue;
                }

                let index = inputs.get("index").unwrap().as_u64().unwrap() as u64;
                let expected = case.output.as_bool().unwrap();

                // extract root and txid
                let mut root = Hash256Digest::default();
                let mut txid = Hash256Digest::default();
                println!("{:?}", extended_proof);
                root.copy_from_slice(&extended_proof[proof_len - 32..]);
                txid.copy_from_slice(&extended_proof[..32]);

                let proof = if proof_len > 64 {
                    extended_proof[32..proof_len - 32].to_vec()
                } else {
                    vec![]
                };

                // println!("{:?} {:?} {:?} {:?}", root, txid, proof, proof.len());

                assert_eq!(verify_hash256_merkle(txid, root, &proof, index), expected);
            }
        })
    }

    #[test]
    fn it_performs_consensus_correct_retargets() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("retargetAlgorithm", &fixtures);
            for case in test_cases {
                let headers = test_utils::get_headers(&case.input);
                let previous_target = &headers[0].target;
                let first_timestamp = headers[0].timestamp;
                let second_timestamp = headers[1].timestamp;

                let expected = &headers[2].target;
                let actual = retarget_algorithm(previous_target, first_timestamp, second_timestamp);
                assert_eq!(actual & expected, *expected);

                let fake_long = first_timestamp + 5 * 2016 * 10 * 60;
                let long_res = retarget_algorithm(previous_target, first_timestamp, fake_long);
                assert_eq!(long_res, previous_target * 4 as u64);

                let fake_short = first_timestamp + 2016 * 10 * 14;
                let short_res = retarget_algorithm(previous_target, first_timestamp, fake_short);
                assert_eq!(short_res, previous_target / 4 as u64);
            }
        })
    }

    #[test]
    fn it_extracts_difficulty_from_headers() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("retargetAlgorithm", &fixtures);
            for case in test_cases {
                let headers = test_utils::get_headers(&case.input);
                for header in headers {
                    assert_eq!(extract_difficulty(header.raw), header.difficulty);
                }
            }
        })
    }
}
