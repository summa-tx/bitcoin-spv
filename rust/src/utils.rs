extern crate hex;

/// Changes the endianness of a byte array.
/// Returns a new, backwards, byte array.
///
/// # Arguments
///
/// * `b` - The bytes to reverse
pub fn reverse_endianness(b: &Vec<u8>) -> Vec<u8> {
    let mut newvec = b.to_vec();
    newvec.reverse();
    newvec
}

/// Strips the '0x' prefix off of hex string so it can be deserialized.
///
/// # Arguments
///
/// * `s` - The hex str
pub fn strip_0x_prefix(s: &str) -> &str {
    if &s[..2] == "0x" { &s[2..] } else { s }
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

#[doc(hidden)]
#[cfg_attr(tarpaulin, skip)]
pub mod test_utils {
    extern crate num_bigint as bigint;

    use serde_json;
    use std::panic;
    use std::fs::File;
    use std::io::Read;
    use bigint::BigUint;
    use serde::{Deserialize};

    use super::*;
    use crate::btcspv;
    use crate::types::{InputType, OutputType, RawHeader, SPVError};

    #[derive(Deserialize, Debug)]
    pub struct TestCase {
        pub input: serde_json::Value,
        pub output: serde_json::Value,
        pub error_message: serde_json::Value
    }

    pub struct TestHeader {
        pub raw: RawHeader,
        pub timestamp: u32,
        pub target: BigUint,
        pub difficulty: BigUint
    }

    pub fn to_test_header(head: &serde_json::map::Map<String, serde_json::Value>) -> TestHeader {
        let mut raw: RawHeader = [0; 80];
        raw.copy_from_slice(&force_deserialize_hex(head.get("hex").unwrap().as_str().unwrap()));

        let timestamp = head.get("timestamp").unwrap().as_u64().unwrap() as u32;
        let target = btcspv::extract_target(raw);
        let difficulty = btcspv::calculate_difficulty(&target);
        TestHeader {
            raw: raw,
            timestamp: timestamp,
            target: target,
            difficulty: difficulty
        }
    }

    pub fn get_headers(heads: &serde_json::Value) -> Vec<TestHeader> {
        let vals: &Vec<serde_json::Value> = heads.as_array().unwrap();
        let mut headers = vec!();
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
            None => &serde_json::Value::Null
        };

        let e = val.get("errorMessage");
        let error_message: &serde_json::Value;
        error_message = match e {
            Some(v) => v,
            None => &serde_json::Value::Null
        };

        TestCase {
            input: val.get("input").unwrap().clone(),
            output: output.clone(),
            error_message: error_message.clone()
        }
    }

    pub fn get_test_cases(name: &str, fixtures: &serde_json::Value) -> Vec<TestCase> {
        let vals: &Vec<serde_json::Value> = fixtures.get(name).unwrap().as_array().unwrap();
        let mut cases = vec!();
        for i in vals {
            cases.push(to_test_case(&i));
        }
        cases
    }

    pub fn match_number_to_input_type(i: u64) -> InputType {
        match i {
            1 => InputType::Legacy,
            2 => InputType::Compatibility,
            3 => InputType::Witness,
            _ => InputType::InputNone
        }
    }

    pub fn match_number_to_output_type(i: u64) -> OutputType {
        match i {
            1 => OutputType::WPKH,
            2 => OutputType::WSH,
            3 => OutputType::OpReturn,
            4 => OutputType::PKH,
            5 => OutputType::SH,
            6 => OutputType::Nonstandard,
            _ => OutputType::OutputNone
        }
    }

    pub fn match_num_to_err(s: &str) -> SPVError {
      match s {
        "1" => SPVError::InvalidChain,
        "2" => SPVError::WrongLengthHeader,
        "3" => SPVError::InsufficientWork,
        "5" => SPVError::WrongDigest,
        "6" => SPVError::NonMatchingDigests,
        "7" => SPVError::WrongMerkleRoot,
        "8" => SPVError::NonMatchingMerkleRoots,
        "9" => SPVError::WrongPrevHash,
        "10" => SPVError::NonMatchingPrevhashes,
        "11" => SPVError::InvalidVin,
        "12" => SPVError::InvalidVout,
        "13" => SPVError::WrongTxID,
        "14" => SPVError::BadMerkleProof,
        "15" => SPVError::LargeVarInt,
        "16" => SPVError::MalformattedOpReturnOutput,
        "17" => SPVError::MalformattedWitnessOutput,
        "18" => SPVError::MalformattedP2PKHOutput,
        "19" => SPVError::MalformattedP2SHOutput,
        "20" => SPVError::MalformattedOutput,
          _ => SPVError::UnknownError
      }
  }

    pub fn run_test<T>(test: T) -> ()
        where T: FnOnce(&serde_json::Value) -> () + panic::UnwindSafe
    {
        let fixtures = setup();

        let result = panic::catch_unwind(|| {
            test(&fixtures)
        });

        assert!(result.is_ok())
    }
}
