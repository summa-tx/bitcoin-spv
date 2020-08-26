use primitive_types::U256;
use ripemd160::{Digest, Ripemd160};
use sha2::Sha256;

use crate::types::*;

/// Parse a CompactInt into its data length and the number it represents
/// Useful for Parsing Vins and Vouts. Returns `BadCompactInt` if insufficient bytes.
///
/// # Arguments
///
/// * `buf` - A byte-string starting with a CompactInt
///
/// # Returns
///
/// * (length, number) - the length of the data in bytes, and the number it represents
pub fn parse_compact_int<T: AsRef<[u8]> + ?Sized>(buf: &T) -> Result<CompactInt, SPVError> {
    let buf = buf.as_ref();
    let length = CompactInt::data_length(buf[0]) as usize;

    if length == 0 {
        return Ok(buf[0].into());
    }
    if buf.len() < 1 + length {
        return Err(SPVError::BadCompactInt);
    }

    let mut num_bytes = [0u8; 8];
    num_bytes[..length].copy_from_slice(&buf[1..=length]);

    Ok(u64::from_le_bytes(num_bytes).into())
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

    let buf: [u8; 20] = rmd.result().into();
    buf.into()
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
    let buf: [u8; 32] = second_sha.result().into();
    buf.into()
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
pub fn extract_input_at_index<'a>(vin: &'a Vin<'a>, index: usize) -> Result<TxIn<'a>, SPVError> {
    let n_ins = parse_compact_int(vin)?;
    if index >= n_ins.number() as usize {
        return Err(SPVError::ReadOverrun);
    }

    let mut length = 0;
    let mut offset = n_ins.serialized_length();

    for i in 0..=index {
        length = determine_input_length(&vin[offset..])?;
        if i != index {
            offset += length as usize;
        }
    }

    if offset + length > vin.len() {
        return Err(SPVError::ReadOverrun);
    }

    Ok(TxIn(&vin[offset..offset + length]))
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
pub fn is_legacy_input<'a>(tx_in: &TxIn<'a>) -> bool {
    tx_in[36] != 0
}

/// Determines the length of a scriptSig in an input.
/// Will return 0 if passed a witness input.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
pub fn extract_script_sig_len<'a>(tx_in: &TxIn<'a>) -> Result<CompactInt, SPVError> {
    if tx_in.len() < 37 {
        return Err(SPVError::ReadOverrun);
    }
    parse_compact_int(&tx_in[36..])
}

/// Determines the length of an input from its scriptsig:
/// 36 for outpoint, 1 for scriptsig length, 4 for sequence.
///
/// # Arguments
///
/// * `tx_in` - The input as a u8 array
pub fn determine_input_length(tx_in: &[u8]) -> Result<usize, SPVError> {
    let script_sig_len = extract_script_sig_len(&TxIn(tx_in))?;
    // 40 = 36 (outpoint) + 4 (sequence)
    Ok(40 + script_sig_len.serialized_length() + script_sig_len.as_usize())
}

/// Extracts the LE sequence bytes from an input.
/// Sequence is used for relative time locks.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
pub fn extract_sequence_le<'a>(tx_in: &TxIn<'a>) -> Result<[u8; 4], SPVError> {
    let script_sig_len = extract_script_sig_len(tx_in)?;
    let offset: usize = 36 + script_sig_len.serialized_length() + script_sig_len.as_usize();

    let mut sequence = [0u8; 4];
    sequence.copy_from_slice(&tx_in[offset..offset + 4]);
    Ok(sequence)
}

/// Extracts the sequence from the input.
/// Sequence is a 4-byte little-endian number.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
pub fn extract_sequence<'a>(tx_in: &TxIn<'a>) -> Result<u32, SPVError> {
    let mut arr: [u8; 4] = [0u8; 4];
    let b = extract_sequence_le(tx_in)?;
    arr.copy_from_slice(&b[..]);
    Ok(u32::from_le_bytes(arr))
}

/// Extracts the CompactInt-prepended scriptSig from the input in a tx.
/// Will return `vec![0]` if passed a witness input.
///
/// # Arguments
///
/// * `tx_in` - The LEGACY input
pub fn extract_script_sig<'a>(tx_in: &'a TxIn<'a>) -> Result<ScriptSig<'a>, SPVError> {
    let script_sig_len = extract_script_sig_len(tx_in)?;
    let length = script_sig_len.serialized_length() + script_sig_len.as_usize();
    Ok(ScriptSig(&tx_in[36..36 + length]))
}

/// Extracts the outpoint from the input in a tx,
/// 32 byte tx id with 4 byte index.
///
/// # Arguments
///
/// * `tx_in` - The input
pub fn extract_outpoint<'a>(tx_in: &'a TxIn<'a>) -> Outpoint<'a> {
    Outpoint(&tx_in[0..36])
}

/// Extracts the outpoint tx id from an input,
/// 32 byte tx id.
///
/// # Arguments
///
/// * `outpoint` - The outpoint extracted from the input
pub fn extract_input_tx_id_le(outpoint: &Outpoint) -> Hash256Digest {
    let mut txid = Hash256Digest::default();
    txid.as_mut().copy_from_slice(&outpoint[0..32]);
    txid
}

/// Extracts the LE tx input index from the input in a tx,
/// 4 byte tx index.
///
/// # Arguments
///
/// * `outpoint` - The outpoint extracted from the input
pub fn extract_tx_index_le(outpoint: &Outpoint) -> [u8; 4] {
    let mut idx = [0u8; 4];
    idx.copy_from_slice(&outpoint[32..36]);
    idx
}

/// Extracts the LE tx input index from the input in a tx,
/// 4 byte tx index.
///
/// # Arguments
///
/// * `outpoint` - The outpoint extracted from the input
pub fn extract_tx_index(outpoint: &Outpoint) -> u32 {
    let mut arr: [u8; 4] = [0u8; 4];
    let b = extract_tx_index_le(outpoint);
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
/// * Errors if CompactInt represents a number larger than 253; large CompactInts are not supported.
pub fn determine_output_length(tx_out: &[u8]) -> Result<usize, SPVError> {
    if tx_out.len() < 9 {
        return Err(SPVError::MalformattedOutput);
    }
    let script_pubkey_len = parse_compact_int(&tx_out[8..])?;

    Ok(8 + script_pubkey_len.serialized_length() + script_pubkey_len.as_usize())
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
/// * Errors if CompactInt represents a number larger than 253.  Large CompactInts are not supported.
pub fn extract_output_at_index<'a>(
    vout: &'a Vout<'a>,
    index: usize,
) -> Result<TxOut<'a>, SPVError> {
    let n_outs = parse_compact_int(vout)?;
    if index >= n_outs.as_usize() {
        return Err(SPVError::ReadOverrun);
    }

    let mut length = 0;
    let mut offset = n_outs.serialized_length();

    for i in 0..=index {
        length = determine_output_length(&vout[offset..])?;
        if i != index {
            offset += length as usize
        }
    }

    if offset + length as usize > vout.len() {
        return Err(SPVError::ReadOverrun);
    }

    Ok(TxOut(&vout[offset..offset + length]))
}

/// Extracts the value bytes from the output in a tx.
/// Value is an 8-byte little-endian number.
///
/// # Arguments
///
/// * `tx_out` - The output
pub fn extract_value_le(tx_out: &TxOut) -> [u8; 8] {
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
pub fn extract_value(tx_out: &TxOut) -> u64 {
    u64::from_le_bytes(extract_value_le(tx_out))
}

/// Extracts the ScriptPubkey from a TxOut
///
/// # Arguments
///
/// * `tx_out` - The output
pub fn extract_script_pubkey<'a>(tx_out: &'a TxOut<'a>) -> ScriptPubkey<'a> {
    ScriptPubkey(&tx_out[8..])
}

/// Extracts the data from an op return output.
/// Errors if no data or not an op return.
///
/// # Arguments
///
/// * `spk` - The script pubkey extracted from the output
///
/// # Errors
///
/// * Errors if the spk is not a properly formatted op return
pub fn extract_op_return_data<'a>(
    spk: &'a ScriptPubkey<'a>,
) -> Result<OpReturnPayload<'a>, SPVError> {
    if spk[1] == 0x6a {
        let data_len = spk[2] as usize;
        if data_len + 3 > spk.len() {
            return Err(SPVError::ReadOverrun);
        }
        Ok(OpReturnPayload(&spk[3..3 + data_len]))
    } else {
        Err(SPVError::MalformattedOpReturnOutput)
    }
}

/// Extracts the hash from the output script.
/// Determines type by the length prefix and validates format.
///
/// # Arguments
///
/// * `spk` - The script pubkey extracted from the output
///
/// # Errors
///
/// * Errors if spk is not a validly formatted standard hash-commitment output type
/// (i.e. PKH, SH, WPKH, or WSH).
pub fn extract_hash<'a>(spk: &'a ScriptPubkey<'a>) -> Result<PayloadType, SPVError> {
    let tag = &spk[..3];

    if (tag[0]) as usize + 1 != spk.len() {
        return Err(SPVError::OutputLengthMismatch);
    }

    /* Witness */
    if spk[1] == 0 {
        let script_len = spk[0];
        let payload_len = spk[2];
        if script_len < 2 {
            return Err(SPVError::MalformattedWitnessOutput);
        }

        if payload_len + 2 == script_len {
            let payload = &spk[3..3 + payload_len as usize];
            match payload_len {
                0x20 => return Ok(PayloadType::WSH(payload)),
                0x14 => return Ok(PayloadType::WPKH(payload)),
                _ => {} // fall through to error
            }
        }
        return Err(SPVError::MalformattedWitnessOutput);
    }

    /* P2PKH */
    if tag == [0x19, 0x76, 0xa9] {
        let last_two: &[u8] = &spk[spk.len() - 2..];
        if spk[3] != 0x14 || last_two != [0x88, 0xac] {
            return Err(SPVError::MalformattedP2PKHOutput);
        }
        return Ok(PayloadType::PKH(&spk[4..24]));
    }

    /* P2SH */
    if tag == [0x17, 0xa9, 0x14] {
        if spk.last().cloned() != Some(0x87) {
            return Err(SPVError::MalformattedP2SHOutput);
        }
        return Ok(PayloadType::SH(&spk[3..23]));
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
    let n_ins = match parse_compact_int(vin) {
        Ok(v) => v,
        Err(_) => return false,
    };

    let vin_length = vin.len();

    let mut offset = n_ins.serialized_length();
    if n_ins == 0usize {
        return false;
    }

    for _ in 0..n_ins.as_usize() {
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
    let n_outs = match parse_compact_int(vout) {
        Ok(v) => v,
        Err(_) => return false,
    };

    let vout_length = vout.len();

    let mut offset = n_outs.serialized_length();
    if n_outs == 0usize {
        return false;
    }

    for _ in 0..n_outs.as_usize() {
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
    let mut root = Hash256Digest::default();
    root.as_mut().copy_from_slice(&header[36..68]);
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
pub fn extract_target(header: RawHeader) -> U256 {
    let mantissa = U256::from_little_endian(&header[72..75]);
    // We use saturating here to avoid panicking.
    // This is safe because it saturates at `0`, which gives an unreachable target of `1`
    let exponent = header[75].saturating_sub(3);
    let offset = U256::from(256 as u64).pow(exponent.into());

    mantissa * offset
}

/// Calculate difficulty from the difficulty 1 target and current target.
/// Difficulty 1 is 0x1d00ffff on mainnet and testnet.
///
/// # Arguments
///
/// * `target` - The current target
pub fn calculate_difficulty(target: &U256) -> U256 {
    let mut arr: [u8; 28] = Default::default();
    arr[0] = 0xff;
    arr[1] = 0xff;
    let diff_one_target = U256::from_big_endian(&arr);
    diff_one_target / target
}

/// Extracts the previous block's hash from a block header.
/// Block headers do NOT include block number :(
///
/// # Arguments
///
/// * `header` - An 80-byte Bitcoin header
pub fn extract_prev_block_hash_le(header: RawHeader) -> Hash256Digest {
    let mut root = Hash256Digest::default();
    root.as_mut().copy_from_slice(&header[4..36]);
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
pub fn extract_difficulty(header: RawHeader) -> U256 {
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
pub fn verify_hash256_merkle(
    txid: Hash256Digest,
    merkle_root: Hash256Digest,
    intermediate_nodes: &MerkleArray,
    index: u64,
) -> bool {
    let mut idx = index;
    let proof_len = intermediate_nodes.len();

    match proof_len {
        0 => return txid == merkle_root,
        1 => return true,
        _ => {}
    }

    let mut current = txid;

    for i in 0..proof_len {
        let next = intermediate_nodes.index(i);

        if idx % 2 == 1 {
            current = hash256_merkle_step(next.as_ref(), current.as_ref());
        } else {
            current = hash256_merkle_step(current.as_ref(), next.as_ref());
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
    previous_target: &U256,
    first_timestamp: u32,
    second_timestamp: u32,
) -> U256 {
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
    extern crate hex;
    extern crate std;

    use std::{
        println,
        vec, // The macro
    };

    use super::*;
    use crate::test_utils::{self, force_deserialize_hex};
    use primitive_types::U256;

    #[test]
    fn it_determines_compact_int_data_length() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("determineVarIntDataLength", &fixtures);
            for case in test_cases {
                let input = case.input.as_u64().unwrap() as u8;
                let expected = case.output.as_u64().unwrap() as u8;
                assert_eq!(CompactInt::data_length(input), expected);
            }
        })
    }

    #[test]
    fn it_parses_compact_ints() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("parseVarInt", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected = case.output.as_array().unwrap();
                let expected_num = expected[1].as_u64().unwrap() as usize;
                assert_eq!(parse_compact_int(&input).unwrap(), expected_num);
            }
        })
    }

    #[test]
    fn it_parses_compact_int_errors() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("parseVarIntError", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                match parse_compact_int(&input) {
                    Ok(_) => assert!(false, "expected an error"),
                    Err(e) => assert_eq!(e, SPVError::BadCompactInt),
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
                let mut expected = Hash160Digest::default();
                let output = force_deserialize_hex(case.output.as_str().unwrap());
                expected.as_mut().copy_from_slice(&output);
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
                let mut expected = Hash256Digest::default();
                let output = force_deserialize_hex(case.output.as_str().unwrap());
                expected.as_mut().copy_from_slice(&output);
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
                let mut expected = Hash256Digest::default();
                let output = force_deserialize_hex(case.output.as_str().unwrap());
                expected.as_mut().copy_from_slice(&output);
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
                let expected_num = outputs[1].as_u64().unwrap() as usize;

                assert_eq!(extract_script_sig_len(&TxIn(&input)).unwrap(), expected_num);
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
                assert_eq!(&extract_sequence_le(&TxIn(&input)).unwrap(), expected);
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
                assert_eq!(extract_sequence(&TxIn(&input)).unwrap(), expected);
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
                assert_eq!(extract_input_at_index(&Vin(&vin), index).unwrap(), expected);
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
                match extract_input_at_index(&Vin(&vin), index) {
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
                assert_eq!(is_legacy_input(&TxIn(&input)), expected);
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
                assert_eq!(extract_script_sig(&TxIn(&input)).unwrap(), expected);
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
                assert_eq!(extract_sequence_le(&TxIn(&input)).unwrap(), expected);
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
                assert_eq!(extract_sequence(&TxIn(&input)).unwrap(), expected);
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
                assert_eq!(extract_outpoint(&TxIn(&input)), &expected[..]);
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
                assert_eq!(
                    extract_input_tx_id_le(&extract_outpoint(&TxIn(&input))).as_ref(),
                    expected
                );
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
                assert_eq!(
                    extract_tx_index_le(&extract_outpoint(&TxIn(&input))),
                    expected
                );
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
                assert_eq!(extract_tx_index(&extract_outpoint(&TxIn(&input))), expected);
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
                assert_eq!(
                    extract_output_at_index(&Vout(&vout), index).unwrap(),
                    expected
                );
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
                match extract_output_at_index(&Vout(&vout), index) {
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
                assert_eq!(extract_value_le(&TxOut(&input)), expected);
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
                assert_eq!(extract_value(&TxOut(&input)), expected);
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
                assert_eq!(
                    extract_op_return_data(&extract_script_pubkey(&TxOut(&input))).unwrap(),
                    expected
                );
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
                match extract_op_return_data(&extract_script_pubkey(&TxOut(&input))) {
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
                assert_eq!(
                    extract_hash(&extract_script_pubkey(&TxOut(&input))).unwrap(),
                    expected
                );
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
                match extract_hash(&extract_script_pubkey(&TxOut(&input))) {
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
                let mut input = RawHeader::default();
                input
                    .as_mut()
                    .copy_from_slice(&force_deserialize_hex(case.input.as_str().unwrap()));
                let expected_bytes = force_deserialize_hex(case.output.as_str().unwrap());
                let expected = U256::from_big_endian(&expected_bytes);
                assert_eq!(extract_target(input), expected);
            }
        })
    }

    #[test]
    fn it_extracts_timestamps() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("extractTimestamp", &fixtures);
            for case in test_cases {
                let mut input = RawHeader::default();
                input
                    .as_mut()
                    .copy_from_slice(&force_deserialize_hex(case.input.as_str().unwrap()));
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
                let extended_proof =
                    force_deserialize_hex(inputs.get("proof").unwrap().as_str().unwrap());
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
                root.as_mut()
                    .copy_from_slice(&extended_proof[proof_len - 32..]);
                txid.as_mut().copy_from_slice(&extended_proof[..32]);

                let proof = if proof_len > 64 {
                    extended_proof[32..proof_len - 32].to_vec()
                } else {
                    vec![]
                };

                println!("{:?} {:?} {:?} {:?}", root, txid, proof, proof.len());

                assert_eq!(
                    verify_hash256_merkle(txid, root, &MerkleArray::new(&proof).unwrap(), index),
                    expected
                );
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
                assert_eq!(actual & *expected, *expected);

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
