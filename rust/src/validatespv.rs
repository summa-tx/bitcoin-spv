use primitive_types::U256;

use crate::{btcspv, types::*};

/// Evaluates a Bitcoin merkle inclusion proof.
/// Note that `index` is not a reliable indicator of location within a block.
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
    intermediate_nodes: &MerkleArray,
    index: u64,
) -> bool {
    if txid == merkle_root && index == 0 && intermediate_nodes.is_empty() {
        return true;
    }
    btcspv::verify_hash256_merkle(txid, merkle_root, intermediate_nodes, index)
}

/// Hashes transaction to get txid.
///
/// # Arguments
///
/// * `version` - 4-bytes version
/// * `vin` - Raw bytes length-prefixed input vector
/// * `vout` - Raw bytes length-prefixed output vector
/// * `locktime` - 4-byte tx locktime
pub fn calculate_txid(
    version: &[u8; 4],
    vin: &Vin,
    vout: &Vout,
    locktime: &[u8; 4],
) -> Hash256Digest {
    btcspv::hash256(&[version, vin.as_ref(), vout.as_ref(), locktime])
}

/// Checks validity of header work.
///
/// # Arguments
///
/// * `digest` - The digest
/// * `target` - The target threshold
pub fn validate_header_work(digest: Hash256Digest, target: &U256) -> bool {
    let empty: Hash256Digest = Default::default();

    if digest == empty {
        return false;
    }

    U256::from_little_endian(digest.as_ref()) < *target
}

/// Checks validity of header chain.
///
/// # Arguments
///
/// * `header` - The raw bytes header
/// * `expected` - The expected previous header's digest
pub fn validate_header_prev_hash(header: RawHeader, expected: Hash256Digest) -> bool {
    let actual = header.parent();
    actual == expected
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
pub fn validate_header_chain(
    headers: &HeaderArray,
    constant_difficulty: bool,
) -> Result<U256, SPVError> {
    let mut total_difficulty = U256::from(0 as u8);
    // declared outside the loop for proper check ordering
    let mut digest = Hash256Digest::default();
    let mut target = U256::default();

    for i in 0..headers.len() {
        let header = headers.index(i);

        if i == 0 {
            target = header.target();
        }
        if constant_difficulty && header.target() != target {
            return Err(SPVError::UnexpectedDifficultyChange);
        }

        if i != 0 && !validate_header_prev_hash(header, digest) {
            return Err(SPVError::InvalidChain);
        }

        digest = btcspv::hash256(&[header.as_ref()]);
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
    use crate::test_utils::{self, force_deserialize_hex};

    use super::*;

    #[test]
    fn it_verifies_merkle_inclusion_proofs() {
        test_utils::run_test(|fixtures| {
            let test_cases = test_utils::get_test_cases("prove", &fixtures);
            for case in test_cases {
                let inputs = case.input.as_object().unwrap();

                let mut txid: Hash256Digest = Default::default();
                let id = force_deserialize_hex(inputs.get("txIdLE").unwrap().as_str().unwrap());
                txid.as_mut().copy_from_slice(&id);

                let mut merkle_root: Hash256Digest = Default::default();
                let root =
                    force_deserialize_hex(inputs.get("merkleRootLE").unwrap().as_str().unwrap());
                merkle_root.as_mut().copy_from_slice(&root);

                let proof = force_deserialize_hex(inputs.get("proof").unwrap().as_str().unwrap());
                let index = inputs.get("index").unwrap().as_u64().unwrap() as u64;

                let expected = case.output.as_bool().unwrap();
                assert_eq!(
                    prove(txid, merkle_root, &MerkleArray::new(&proof).unwrap(), index),
                    expected
                );
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
                expected
                    .as_mut()
                    .copy_from_slice(&force_deserialize_hex(case.output.as_str().unwrap()));

                let mut ver = [0u8; 4];
                ver.copy_from_slice(&version);
                let mut lock = [0u8; 4];
                lock.copy_from_slice(&locktime);

                assert_eq!(
                    calculate_txid(
                        &ver,
                        &Vin::new(&vin).unwrap(),
                        &Vout::new(&vout).unwrap(),
                        &lock
                    ),
                    expected
                );
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
                digest.as_mut().copy_from_slice(&force_deserialize_hex(
                    inputs.get("digest").unwrap().as_str().unwrap(),
                ));

                let t = inputs.get("target").unwrap();
                let target = match t.is_u64() {
                    true => U256::from(t.as_u64().unwrap()),
                    false => U256::from_big_endian(&force_deserialize_hex(t.as_str().unwrap())),
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
                prev_hash.as_mut().copy_from_slice(&force_deserialize_hex(
                    inputs.get("prevHash").unwrap().as_str().unwrap(),
                ));

                let mut header = RawHeader::default();
                header.as_mut().copy_from_slice(&force_deserialize_hex(
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
                let expected = U256::from(output);
                assert_eq!(
                    validate_header_chain(&HeaderArray::new(&input).unwrap(), false).unwrap(),
                    expected
                );
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
                if let Ok(headers) = HeaderArray::new(&input) {
                    match validate_header_chain(&headers, false) {
                        Ok(_) => assert!(false, "expected an error"),
                        Err(v) => assert_eq!(v, expected),
                    }
                }
            }
        })
    }
}
