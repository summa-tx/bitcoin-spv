extern crate num_bigint as bigint;

use bigint::BigUint;

use crate::btcspv;
use crate::types::{Hash256Digest, InputType, OutputType, RawHeader, SPVError};
use crate::utils;

/// Evaluates a Bitcoin merkle inclusion proof.
///
/// # Arguments
///
/// * `txid` - The txid (LE)
/// * `merkle_root` - The merkle root (as in the block header)
/// * `intermediate_nodes` - The proof's intermediate nodes (digests between leaf and root)
/// * `index` - The leaf's index in the tree (0-indexed)
pub fn prove(
    txid: Hash256Digest,
    merkle_root: Hash256Digest,
    intermediate_nodes: &[u8],
    index: u64,
) -> bool {
    if txid == merkle_root && index == 0 && intermediate_nodes.is_empty() {
        return true;
    }
    let mut proof: Vec<u8> = vec![];
    proof.extend(&txid);
    proof.extend(intermediate_nodes);
    proof.extend(&merkle_root);

    btcspv::verify_hash256_merkle(&proof, index)
}

/// Hashes transaction to get txid.
///
/// # Arguments
///
/// * `version` - 4-bytes version
/// * `vin` - Raw bytes length-prefixed input vector
/// * `vout` - Raw bytes length-prefixed output vector
/// * `locktime` - 4-byte tx locktime
pub fn calculate_txid(version: &[u8], vin: &[u8], vout: &[u8], locktime: &[u8]) -> Hash256Digest {
    let mut tx: Vec<u8> = vec![];
    tx.extend(version);
    tx.extend(vin);
    tx.extend(vout);
    tx.extend(locktime);
    btcspv::hash256(&tx)
}

/// Parses a tx input from raw input bytes.
/// Supports LEGACY and WITNESS inputs.
///
/// # Arguments
///
/// * `tx_in` - The tx input
pub fn parse_input(tx_in: &[u8]) -> (u32, Vec<u8>, u32, InputType) {
    let sequence: u32;
    let input_type: InputType;

    match tx_in[36] {
        0 => {
            sequence = btcspv::extract_sequence_witness(&tx_in);
            input_type = InputType::Witness;
        }
        _ => {
            sequence = btcspv::extract_sequence_legacy(&tx_in);
            let witness_tag = tx_in[36..39].to_vec();
            if witness_tag == [0x22, 0x00, 0x20] || witness_tag == [0x16, 0x00, 0x14] {
                input_type = InputType::Compatibility;
            } else {
                input_type = InputType::Legacy;
            }
        }
    }

    let input_id = btcspv::extract_input_tx_id(&tx_in);
    let input_index = btcspv::extract_tx_index(&tx_in);

    (sequence, input_id, input_index, input_type)
}

/// Parses a tx output from raw output bytes.
///
/// # Arguments
///
/// * `output` - The tx output
pub fn parse_output(output: &[u8]) -> (u64, OutputType, Vec<u8>) {
    let value: u64 = btcspv::extract_value(&output);
    let output_type: OutputType;
    let payload: Vec<u8>;

    if output[9] == 0x6a {
        output_type = OutputType::OpReturn;
        let payload = btcspv::extract_op_return_data(&output).unwrap();
        return (value, output_type, payload);
    }

    let mut prefix: [u8; 2] = Default::default();
    prefix.copy_from_slice(&output[8..10]);
    match prefix {
        [0x22, 0x00] => {
            output_type = OutputType::WSH;
            payload = output[11..43].to_vec();
        }
        [0x16, 0x00] => {
            output_type = OutputType::WPKH;
            payload = output[11..31].to_vec();
        }
        [0x19, 0x76] => {
            output_type = OutputType::PKH;
            payload = output[12..32].to_vec();
        }
        [0x17, 0xa9] => {
            output_type = OutputType::SH;
            payload = output[11..31].to_vec();
        }
        _ => {
            output_type = OutputType::Nonstandard;
            payload = vec![];
        }
    }

    (value, output_type, payload)
}

/// Parses a block header struct from a bytestring.
/// Note: Block headers are always 80 bytes, see Bitcoin docs.
///
/// # Arguments
///
/// * `header` - The header
pub fn parse_header(
    header: RawHeader,
) -> (
    Hash256Digest,
    u32,
    Hash256Digest,
    Hash256Digest,
    u32,
    BigUint,
    u32,
) {
    let mut digest: Hash256Digest = Default::default();
    digest.copy_from_slice(&utils::reverse_endianness(
        &btcspv::hash256(&header).to_vec(),
    ));

    let mut vers: [u8; 4] = Default::default();
    vers.copy_from_slice(&header[0..4]);
    let version = u32::from_le_bytes(vers);

    let prev_hash = btcspv::extract_prev_block_hash_le(header);
    let merkle_root = btcspv::extract_merkle_root_le(header);
    let timestamp = btcspv::extract_timestamp(header);
    let target = btcspv::extract_target(header);

    let mut n: [u8; 4] = Default::default();
    n.copy_from_slice(&header[76..80]);
    let nonce = u32::from_le_bytes(n);

    (
        digest,
        version,
        prev_hash,
        merkle_root,
        timestamp,
        target,
        nonce,
    )
}

/// Checks validity of header work.
///
/// # Arguments
///
/// * `digest` - The digest
/// * `target` - The target threshold
pub fn validate_header_work(digest: Hash256Digest, target: &BigUint) -> bool {
    let empty: Hash256Digest = Default::default();

    if digest == empty {
        return false;
    }

    BigUint::from_bytes_le(&digest[..]) < *target
}

/// Checks validity of header chain.
///
/// # Arguments
///
/// * `header` - The raw bytes header
/// * `prev_hash` - The previous header's digest
pub fn validate_header_prev_hash(header: RawHeader, prev_hash: Hash256Digest) -> bool {
    let actual = btcspv::extract_prev_block_hash_le(header);
    actual == prev_hash
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
pub fn validate_header_chain(headers: &[u8]) -> Result<BigUint, SPVError> {
    if headers.len() % 80 != 0 {
        return Err(SPVError::WrongLengthHeader);
    }

    let mut digest: Hash256Digest = Default::default();
    let mut total_difficulty = BigUint::from(0 as u8);

    for i in 0..headers.len() / 80 {
        let start = i * 80;
        let mut header: RawHeader = [0; 80];
        header.copy_from_slice(&headers[start..start + 80]);

        if i != 0 && !validate_header_prev_hash(header, digest) {
            return Err(SPVError::InvalidChain);
        }

        let target = btcspv::extract_target(header);
        digest.copy_from_slice(&btcspv::hash256(&header));
        if !validate_header_work(digest, &target) {
            return Err(SPVError::InsufficientWork);
        }
        total_difficulty += btcspv::calculate_difficulty(&target);
    }
    Ok(total_difficulty)
}

#[cfg(test)]
#[cfg_attr(tarpaulin, skip)]
mod tests {

    use super::*;
    use crate::utils::*;

    #[test]
    fn it_verifies_merkle_inclusion_proofs() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("prove", &fixtures);
            for case in test_cases {
                let inputs = case.input.as_object().unwrap();

                let mut txid: Hash256Digest = Default::default();
                let id = force_deserialize_hex(inputs.get("txIdLE").unwrap().as_str().unwrap());
                txid.copy_from_slice(&id);

                let mut merkle_root: Hash256Digest = Default::default();
                let root =
                    force_deserialize_hex(inputs.get("merkleRootLE").unwrap().as_str().unwrap());
                merkle_root.copy_from_slice(&root);

                let proof = force_deserialize_hex(inputs.get("proof").unwrap().as_str().unwrap());
                let index = inputs.get("index").unwrap().as_u64().unwrap() as u64;

                let expected = case.output.as_bool().unwrap();
                assert_eq!(prove(txid, merkle_root, &proof, index), expected);
            }
        })
    }

    #[test]
    fn it_calculates_transaction_ids() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("calculateTxId", &fixtures);
            for case in test_cases {
                let inputs = case.input.as_object().unwrap();
                let version =
                    force_deserialize_hex(inputs.get("version").unwrap().as_str().unwrap());
                let vin = force_deserialize_hex(inputs.get("vin").unwrap().as_str().unwrap());
                let vout = force_deserialize_hex(inputs.get("vout").unwrap().as_str().unwrap());
                let locktime =
                    force_deserialize_hex(inputs.get("locktime").unwrap().as_str().unwrap());
                let mut expected: Hash256Digest = Default::default();
                expected.copy_from_slice(&force_deserialize_hex(case.output.as_str().unwrap()));

                assert_eq!(calculate_txid(&version, &vin, &vout, &locktime), expected);
            }
        })
    }

    #[test]
    fn it_parses_tx_ins() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("parseInput", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());

                let outputs = case.output.as_object().unwrap();
                let sequence = outputs.get("sequence").unwrap().as_u64().unwrap() as u32;
                let txid = force_deserialize_hex(outputs.get("txId").unwrap().as_str().unwrap());
                let index = outputs.get("index").unwrap().as_u64().unwrap() as u32;
                let t = outputs.get("type").unwrap().as_u64().unwrap();
                let input_type = test_utils::match_number_to_input_type(t);

                let expected = (sequence, txid, index, input_type);
                assert_eq!(parse_input(&input), expected);
            }
        })
    }

    #[test]
    fn it_parses_tx_outs() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("parseOutput", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());

                let outputs = case.output.as_object().unwrap();
                let value = outputs.get("value").unwrap().as_u64().unwrap();

                let t = outputs.get("type").unwrap().as_u64().unwrap();
                let output_type = test_utils::match_number_to_output_type(t);
                let payload =
                    force_deserialize_hex(outputs.get("payload").unwrap().as_str().unwrap());
                let expected = (value, output_type, payload);
                assert_eq!(parse_output(&input), expected);
            }
        })
    }

    #[test]
    fn it_parses_headers() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("parseHeader", &fixtures);
            for case in test_cases {
                let mut input: RawHeader = [0; 80];
                input.copy_from_slice(&force_deserialize_hex(case.input.as_str().unwrap()));

                let outputs = case.output.as_object().unwrap();

                let mut digest: Hash256Digest = Default::default();
                let d = force_deserialize_hex(outputs.get("digest").unwrap().as_str().unwrap());
                digest.copy_from_slice(&d);

                let version = outputs.get("version").unwrap().as_u64().unwrap() as u32;

                let mut prev_hash: Hash256Digest = Default::default();
                let p = force_deserialize_hex(outputs.get("prevHash").unwrap().as_str().unwrap());
                prev_hash.copy_from_slice(&p);

                let mut merkle_root: Hash256Digest = Default::default();
                let root =
                    force_deserialize_hex(outputs.get("merkleRoot").unwrap().as_str().unwrap());
                merkle_root.copy_from_slice(&root);

                let timestamp = outputs.get("timestamp").unwrap().as_u64().unwrap() as u32;

                let target_bytes =
                    force_deserialize_hex(outputs.get("target").unwrap().as_str().unwrap());
                let target = BigUint::from_bytes_be(&target_bytes);

                let nonce = outputs.get("nonce").unwrap().as_u64().unwrap() as u32;

                let expected = (
                    digest,
                    version,
                    prev_hash,
                    merkle_root,
                    timestamp,
                    target,
                    nonce,
                );
                assert_eq!(parse_header(input), expected);
            }
        })
    }

    #[test]
    fn it_checks_header_work() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("validateHeaderWork", &fixtures);
            for case in test_cases {
                let inputs = case.input.as_object().unwrap();

                let mut digest: Hash256Digest = Default::default();
                digest.copy_from_slice(&force_deserialize_hex(
                    inputs.get("digest").unwrap().as_str().unwrap(),
                ));

                let t = inputs.get("target").unwrap();
                let target = match t.is_u64() {
                    true => BigUint::from(t.as_u64().unwrap()),
                    false => BigUint::from_bytes_be(&force_deserialize_hex(t.as_str().unwrap())),
                };

                let expected = case.output.as_bool().unwrap();
                assert_eq!(validate_header_work(digest, &target), expected);
            }
        })
    }

    #[test]
    fn it_checks_header_prev_hash() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("validateHeaderPrevHash", &fixtures);
            for case in test_cases {
                let inputs = case.input.as_object().unwrap();

                let mut prev_hash: Hash256Digest = Default::default();
                prev_hash.copy_from_slice(&force_deserialize_hex(
                    inputs.get("prevHash").unwrap().as_str().unwrap(),
                ));

                let mut header: RawHeader = [0; 80];
                header.copy_from_slice(&force_deserialize_hex(
                    inputs.get("header").unwrap().as_str().unwrap(),
                ));

                let expected = case.output.as_bool().unwrap();
                assert_eq!(validate_header_prev_hash(header, prev_hash), expected);
            }
        })
    }

    #[test]
    fn it_validates_header_chains() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("validateHeaderChain", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let output = case.output.as_u64().unwrap();
                let expected = BigUint::from(output);
                assert_eq!(validate_header_chain(&input).unwrap(), expected);
            }
        })
    }

    #[test]
    fn it_errors_while_validating_header_chains() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("validateHeaderChainError", &fixtures);
            for case in test_cases {
                let input = force_deserialize_hex(case.input.as_str().unwrap());
                let expected =
                    test_utils::match_string_to_err(case.error_message.as_str().unwrap());
                match validate_header_chain(&input) {
                    Ok(_) => assert!(false, "expected an error"),
                    Err(v) => assert_eq!(v, expected),
                }
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
                    assert_eq!(btcspv::extract_difficulty(header.raw), header.difficulty);
                }
            }
        })
    }
}
