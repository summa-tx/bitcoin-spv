extern crate hex;
extern crate std;

use std::{
    format,
    string::String,
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
