#![warn(missing_docs)]
#![cfg_attr(not(feature = "std"), no_std)]

//! This crate is part of the `bitcoin-spv` project.
//!
//! This work is produced and copyrighted by Summa, and released under
//! the terms of the LGPLv3 license.
//!
//! It contains a collection of Rust functions and structs for working with
//! Bitcoin data structures. Basically, these tools help you parse, inspect,
//! and authenticate Bitcoin transactions.
//!
//! *It is extremely easy to write insecure code using these libraries. We do
//! not recommend a specific security model. Any SPV verification involves
//! complex security assumptions. Please seek external review for your design
//! before building with these libraries.*

#[doc(hidden)]
#[macro_use]
pub mod macros;

/// `btcspv` provides basic Bitcoin transaction and header parsing, as well as
/// utility functions like merkle verification and difficulty adjustment
/// calculation.
pub mod btcspv;

/// `validatespv` provides higher-levels of abstraction for evaluating
/// SPV proofs, transactions, and headers.
pub mod validatespv;

/// `types` exposes simple types for on-chain evaluation of SPV proofs
pub mod types;

/// `std_types` exposes useful structs for headers and SPV proofs, and provides
/// (de)serialization for these structs. It implements a standard JSON format
/// that is compatible with all other `bitcoin-spv` implementations.
#[cfg(feature = "std")]
pub mod std_types;

/// `utils` contains utility functions for working with bytestrings, including
/// hex encoding and decoding.
#[cfg(feature = "std")]
pub mod utils;

#[cfg(test)]
#[doc(hidden)]
#[cfg_attr(tarpaulin, skip)]
pub mod test_utils {

    extern crate hex;
    extern crate std;

    use primitive_types::U256;
    use serde::Deserialize;

    use crate::btcspv;
    use crate::types::{RawHeader, SPVError};

    use std::{
        format,
        fs::File,
        io::Read,
        panic,
        string::String,
        vec,      // The macro
        vec::Vec, // The struct
    };

    /// Changes the endianness of a byte array.
    /// Returns a new, backwards, byte array.
    ///
    /// # Arguments
    ///
    /// * `b` - The bytes to reverse
    pub fn reverse_endianness(b: &[u8]) -> Vec<u8> {
        b.iter().rev().copied().collect()
    }

    /// Strips the '0x' prefix off of hex string so it can be deserialized.
    ///
    /// # Arguments
    ///
    /// * `s` - The hex str
    pub fn strip_0x_prefix(s: &str) -> &str {
        if &s[..2] == "0x" {
            &s[2..]
        } else {
            s
        }
    }

    /// Deserializes a hex string into a u8 array.
    ///
    /// # Arguments
    ///
    /// * `s` - The hex string
    pub fn deserialize_hex(s: &str) -> Result<Vec<u8>, hex::FromHexError> {
        hex::decode(&strip_0x_prefix(s))
    }

    /// Serializes a u8 array into a hex string.
    ///
    /// # Arguments
    ///
    /// * `buf` - The value as a u8 array
    pub fn serialize_hex(buf: &[u8]) -> String {
        format!("0x{}", hex::encode(buf))
    }

    /// Deserialize a hex string into bytes.
    /// Panics if the string is malformatted.
    ///
    /// # Arguments
    ///
    /// * `s` - The hex string
    ///
    /// # Panics
    ///
    /// When the string is not validly formatted hex.
    pub fn force_deserialize_hex(s: &str) -> Vec<u8> {
        deserialize_hex(s).unwrap()
    }

    #[derive(Deserialize, Debug)]
    pub struct TestCase {
        pub input: serde_json::Value,
        pub output: serde_json::Value,
        pub error_message: serde_json::Value,
    }

    pub struct TestHeader {
        pub raw: RawHeader,
        pub timestamp: u32,
        pub target: U256,
        pub difficulty: U256,
    }

    pub fn to_test_header(head: &serde_json::map::Map<String, serde_json::Value>) -> TestHeader {
        let mut raw = RawHeader::default();
        raw.as_mut().copy_from_slice(&force_deserialize_hex(
            head.get("hex").unwrap().as_str().unwrap(),
        ));

        let timestamp = head.get("timestamp").unwrap().as_u64().unwrap() as u32;
        let target = btcspv::extract_target(raw);
        let difficulty = btcspv::calculate_difficulty(&target);
        TestHeader {
            raw,
            timestamp,
            target,
            difficulty,
        }
    }

    pub fn get_headers(heads: &serde_json::Value) -> Vec<TestHeader> {
        let vals: &Vec<serde_json::Value> = heads.as_array().unwrap();
        let mut headers = vec![];
        for i in vals {
            headers.push(to_test_header(&i.as_object().unwrap()));
        }
        headers
    }

    pub fn setup() -> serde_json::Value {
        let mut file = File::open("../testVectors.json").unwrap();
        let mut data = String::new();
        file.read_to_string(&mut data).unwrap();

        serde_json::from_str(&data).unwrap()
    }

    pub fn to_test_case(val: &serde_json::Value) -> TestCase {
        let o = val.get("output");
        let output: &serde_json::Value;
        output = match o {
            Some(v) => v,
            None => &serde_json::Value::Null,
        };

        let e = val.get("rustError");
        let error_message: &serde_json::Value;
        error_message = match e {
            Some(v) => v,
            None => &serde_json::Value::Null,
        };

        TestCase {
            input: val.get("input").unwrap().clone(),
            output: output.clone(),
            error_message: error_message.clone(),
        }
    }

    pub fn get_test_cases(name: &str, fixtures: &serde_json::Value) -> Vec<TestCase> {
        let vals: &Vec<serde_json::Value> = fixtures.get(name).unwrap().as_array().unwrap();
        let mut cases = vec![];
        for i in vals {
            cases.push(to_test_case(&i));
        }
        cases
    }

    pub fn match_string_to_err(s: &str) -> SPVError {
        match s {
            "Malformatted data. Read overrun" => SPVError::ReadOverrun,
            "Read overrun" => SPVError::ReadOverrun,
            "Vout read overrun" => SPVError::ReadOverrun,
            "Vin read overrun" => SPVError::ReadOverrun,
            "Read overrun when parsing vout" => SPVError::ReadOverrun,
            "Read overrun when parsing vin" => SPVError::ReadOverrun,
            "Bad VarInt in scriptPubkey" => SPVError::BadCompactInt,
            "Bad VarInt in scriptSig" => SPVError::BadCompactInt,
            "Read overrun during VarInt parsing" => SPVError::BadCompactInt,
            "Malformatted data. Must be an op return" => SPVError::MalformattedOpReturnOutput,
            "Maliciously formatted p2sh output" => SPVError::MalformattedP2SHOutput,
            "Maliciously formatted p2pkh output" => SPVError::MalformattedP2PKHOutput,
            "Maliciously formatted witness output" => SPVError::MalformattedWitnessOutput,
            "Nonstandard, OP_RETURN, or malformatted output" => SPVError::MalformattedOutput,
            "Header bytes not multiple of 80" => SPVError::WrongLengthHeader,
            "Header does not meet its own difficulty target" => SPVError::InsufficientWork,
            "Header bytes not a valid chain" => SPVError::InvalidChain,
            "Hash is not the correct hash of the header" => SPVError::WrongDigest,
            "MerkleRoot is not the correct merkle root of the header" => SPVError::WrongMerkleRoot,
            "Prevhash is not the correct parent hash of the header" => SPVError::WrongPrevHash,
            "Vin is not valid" => SPVError::InvalidVin,
            "Vout is not valid" => SPVError::InvalidVout,
            "Version, Vin, Vout and Locktime did not yield correct TxID" => SPVError::WrongTxID,
            "Merkle Proof is not valid" => SPVError::BadMerkleProof,
            "Reported length mismatch" => SPVError::OutputLengthMismatch,
            _ => SPVError::UnknownError,
        }
    }

    pub fn run_test<T>(test: T)
    where
        T: FnOnce(&serde_json::Value) -> () + panic::UnwindSafe,
    {
        let fixtures = setup();

        let result = panic::catch_unwind(|| test(&fixtures));

        assert!(result.is_ok())
    }

    #[test]
    fn it_strips_0x_prefixes() {
        let cases = [
            ("00", "00"),
            ("0x00", "00"),
            ("aa", "aa"),
            ("0xaa", "aa"),
            ("Quotidian", "Quotidian"),
            ("0xQuotidian", "Quotidian"),
        ];
        for case in cases.iter() {
            assert_eq!(strip_0x_prefix(case.0), case.1);
        }
    }
}
