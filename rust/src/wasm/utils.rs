use js_sys::Uint8Array;

use crate::types::{Hash256Digest, RawHeader, SPVError};

/// Returns the error message.
///
/// # Arguments
///
/// * `e` - The SPV Error
pub fn match_err_to_string(e: SPVError) -> &'static str {
    match e {
        SPVError::LargeVarInt => "Multi-byte VarInts not supported",
        SPVError::MalformattedOpReturnOutput => "Malformatted data. Must be an op return",
        SPVError::MalformattedP2SHOutput => "Maliciously formatted p2sh output",
        SPVError::MalformattedP2PKHOutput => "Maliciously formatted p2pkh output",
        SPVError::MalformattedWitnessOutput => "Maliciously formatted witness output",
        SPVError::MalformattedOutput => "Nonstandard, OP_RETURN, or malformatted output",
        SPVError::WrongLengthHeader => "Header bytes not multiple of 80",
        SPVError::InsufficientWork => "Header does not meet its own difficulty target",
        SPVError::InvalidChain => "Header bytes not a valid chain",
        _ => "UnknownError",
    }
}

/// Converts `Vec<u8>` to `Uint8Array`.
///
/// # Arguments
///
/// * `v` - The vector
pub fn output_u8a(v: &Vec<u8>) -> Uint8Array {
    Uint8Array::from(&v[..])
}

/// Converts header to type RawHeader.
///
/// # Arguments
///
/// * `u` - The Uint8Array
pub fn u8a_to_header(u: &Uint8Array) -> RawHeader {
    let mut arr: [u8; 80] = [0; 80];
    u.copy_to(&mut arr[..]);
    arr
}

/// Converts digest to type Hash256Digest.
///
/// # Arguments
///
/// * `u` - The Uint8Array
pub fn u8a_to_hash256_digest(u: &Uint8Array) -> Hash256Digest {
    let mut arr: [u8; 32] = [0; 32];
    u.copy_to(&mut arr[..]);
    arr
}

/// Converts `Uint8Array` into `Vec<u8>`.
///
/// # Arguments
///
/// * `u` - The Uint8Array
pub fn u8a_to_vec(u: &Uint8Array) -> Vec<u8> {
    let mut vec: Vec<u8> = vec![0; u.length() as usize];
    u.copy_to(&mut vec[..]);
    vec
}

/// Converts a function that accepts type `Vec<u8>` into a
/// function that accepts type `Uint8Array`.
///
/// Returns a usable reference to the new function.
///
/// # Arguments
///
/// * `f` - The function
pub fn input_vec<'a, T>(f: &'a dyn Fn(&Vec<u8>) -> T) -> Box<dyn Fn(&Uint8Array) -> T + 'a> {
    Box::new(move |x: &Uint8Array| -> T {
        let vec = u8a_to_vec(x);
        f(&vec)
    })
}

/// Converts a function that accepts type `RawHeader` into a
/// function that accepts type `Uint8Array`.
///
/// Returns a usable reference to the new function.
///
/// # Arguments
///
/// * `f` - The function
pub fn input_header<'a, T>(f: &'a dyn Fn(RawHeader) -> T) -> Box<dyn Fn(&Uint8Array) -> T + 'a> {
    Box::new(move |x: &Uint8Array| -> T {
        let arr = u8a_to_header(x);
        f(arr)
    })
}
