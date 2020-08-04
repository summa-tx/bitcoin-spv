extern crate serde_json;
extern crate std;

use std::{fmt, string::ToString, vec::Vec};

use serde::{Deserialize, Serialize};

use crate::{btcspv, types::*, utils, validatespv};

impl_hex_serde!(RawHeader, 80);
impl_hex_serde!(Hash256Digest, 32);
impl_hex_serde!(Hash160Digest, 20);

#[doc(hidden)]
pub type RawBytes = Vec<u8>;

/// BitcoinHeader is a parsed Bitcoin header with height information appended.
/// Values are LE
#[derive(Clone, Deserialize, Serialize)]
pub struct BitcoinHeader {
    /// The double-sha2 digest encoded BE.
    pub hash: Hash256Digest,
    /// The 80-byte raw header.
    pub raw: RawHeader,
    /// The height of the header
    pub height: u32,
    /// The double-sha2 digest of the parent encoded BE.
    pub prevhash: Hash256Digest,
    /// The double-sha2 merkle tree root of the block transactions encoded BE.
    pub merkle_root: Hash256Digest,
}

impl BitcoinHeader {
    /// Checks validity of an entire Bitcoin header
    ///
    /// # Arguments
    ///
    /// * `self` - The Bitcoin header
    ///
    /// # Errors
    ///
    /// * Errors if any of the Bitcoin header elements are invalid.
    pub fn validate(&self) -> Result<(), SPVError> {
        if self.hash != self.raw.digest() {
            return Err(SPVError::WrongDigest);
        }
        if self.merkle_root != self.raw.tx_root() {
            return Err(SPVError::WrongMerkleRoot);
        }
        if self.prevhash != self.raw.parent() {
            return Err(SPVError::WrongPrevHash);
        }
        Ok(())
    }
}

impl PartialEq for BitcoinHeader {
    /// Compares two Bitcoin headers
    ///
    /// # Arguments
    ///
    /// * `self` - The Bitcoin header
    /// * ` other` - The second Bitcoin header
    fn eq(&self, other: &Self) -> bool {
        self.raw == other.raw
            && self.hash == other.hash
            && self.height == other.height
            && self.prevhash == other.prevhash
            && self.merkle_root == other.merkle_root
    }
}

impl Eq for BitcoinHeader {}

#[cfg_attr(tarpaulin, skip)]
impl fmt::Debug for BitcoinHeader {
    /// Formats the bitcoin header for readability
    ///
    /// # Arguments
    ///
    /// * `self` - The Bitcoin header
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Header (height {:?}:\t{:?})",
            self.height,
            self.raw
        )
    }
}

#[cfg_attr(tarpaulin, skip)]
impl fmt::Debug for RawHeader {
    /// Formats the bitcoin header for readability
    ///
    /// # Arguments
    ///
    /// * `self` - The Bitcoin header
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Header: {}",
            utils::serialize_hex(self.as_ref())
        )
    }
}

#[cfg_attr(tarpaulin, skip)]
impl fmt::Display for BitcoinHeader {
    /// Formats the bitcoin header for readability
    ///
    /// # Arguments
    ///
    /// * `self` - The Bitcoin header
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "Header (height {:?}:\t{})",
            self.height,
            utils::serialize_hex(self.raw.as_ref())
        )
    }
}

/// SPVProof is an SPV inclusion proof for a confirmed transaction.
#[derive(PartialEq, Eq, Clone, Serialize, Deserialize)]
pub struct SPVProof {
    /// The 4-byte LE-encoded version number. Currently always 1 or 2.
    #[serde(with = "vec_ser")]
    pub version: RawBytes,
    /// The transaction input vector, length-prefixed.
    #[serde(with = "vec_ser")]
    pub vin: RawBytes,
    /// The transaction output vector, length-prefixed.
    #[serde(with = "vec_ser")]
    pub vout: RawBytes,
    /// The 4-byte LE-encoded locktime number.
    #[serde(with = "vec_ser")]
    pub locktime: RawBytes,
    /// The tx id
    pub tx_id: Hash256Digest,
    /// The transaction index
    pub index: u32,
    /// The confirming Bitcoin header
    pub confirming_header: BitcoinHeader,
    /// The intermediate nodes (digests between leaf and root)
    #[serde(with = "vec_ser")]
    pub intermediate_nodes: RawBytes,
}

impl SPVProof {
    /// Checks validity of an entire SPV Proof
    ///
    /// # Arguments
    ///
    /// * `self` - The SPV Proof
    ///
    /// # Errors
    ///
    /// * Errors if any of the SPV Proof elements are invalid.
    pub fn validate(&self) -> Result<(), SPVError> {
        if !btcspv::validate_vin(&self.vin) {
            return Err(SPVError::InvalidVin);
        }

        if !btcspv::validate_vout(&self.vout) {
            return Err(SPVError::InvalidVout);
        }

        let mut ver = [0u8; 4];
        ver.copy_from_slice(&self.version);
        let mut lock = [0u8; 4];
        lock.copy_from_slice(&self.locktime);

        let tx_id = validatespv::calculate_txid(
            &ver,
            &Vin::new(&self.vin)?,
            &Vout::new(&self.vout)?,
            &lock,
        );
        if tx_id != self.tx_id {
            return Err(SPVError::WrongTxID);
        }

        self.confirming_header.validate()?;

        if !validatespv::prove(
            tx_id,
            self.confirming_header.merkle_root,
            &MerkleArray::new(&self.intermediate_nodes)?,
            self.index as u64,
        ) {
            return Err(SPVError::BadMerkleProof);
        }
        Ok(())
    }
}

#[cfg_attr(tarpaulin, skip)]
impl fmt::Debug for SPVProof {
    /// Formats the SPV Proof for readability
    ///
    /// # Arguments
    ///
    /// * `self` - The SPV Proof
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "\nSPVProof (\n\ttx_id:\t{}\n\tindex:\t{}\n\th:\t",
            utils::serialize_hex(self.tx_id.as_ref()),
            self.index
        )?;
        self.confirming_header.fmt(f)?;
        write!(
            f,
            "\n\tproof:\t{})\n",
            utils::serialize_hex(self.intermediate_nodes.as_ref())
        )
    }
}

#[cfg_attr(tarpaulin, skip)]
impl fmt::Display for SPVProof {
    /// Formats the SPVProof for readability
    ///
    /// # Arguments
    ///
    /// * `self` - The SPV Proof
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "\nSPVProof (\n\ttx_id:\t{}\n\tindex:\t{}\n\th:\t",
            utils::serialize_hex(self.tx_id.as_ref()),
            self.index
        )?;
        self.confirming_header.fmt(f)?;
        write!(
            f,
            "\n\tproof:\t{})\n",
            utils::serialize_hex(self.intermediate_nodes.as_ref())
        )
    }
}
mod vec_ser {
    use super::*;
    use serde::{Deserialize, Deserializer, Serializer};

    use crate::utils;

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s: &str = Deserialize::deserialize(deserializer)?;
        utils::deserialize_hex(s).map_err(|e| serde::de::Error::custom(e.to_string()))
    }

    pub fn serialize<S>(d: &[u8], serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s: &str = &utils::serialize_hex(&d[..]);
        serializer.serialize_str(s)
    }
}


#[cfg(test)]
#[cfg_attr(tarpaulin, skip)]
mod tests {
    use serde_json;

    use std::{
        fs::File,
        io::Read,
        panic,
        string::{String, ToString},
    };

    use super::*;
    use crate::test_utils;

    #[derive(Debug, Deserialize)]
    struct InvalidHeadersCases {
        header: BitcoinHeader,
        e: String,
    }

    #[derive(Debug, Deserialize)]
    struct InvalidProofsCases {
        proof: SPVProof,
        e: String,
    }

    #[allow(non_snake_case)]
    #[derive(Debug, Deserialize)]
    struct TestCases {
        valid: Vec<String>,
        badHeaders: Vec<InvalidHeadersCases>,
        badSPVProofs: Vec<InvalidProofsCases>,
        errBadHexBytes: String,
        errBadHexHash256: String,
        errBadLenHash256: String,
        errBadHexRawHeader: String,
        errBadLenRawHeader: String,
    }

    fn setup() -> TestCases {
        let mut file = File::open("../testProofs.json").unwrap();
        let mut data = String::new();
        file.read_to_string(&mut data).unwrap();

        let cases: TestCases = serde_json::from_str(&data).unwrap();
        cases
    }

    fn run_test<T>(test: T) -> ()
    where
        T: FnOnce(&TestCases) -> () + panic::UnwindSafe,
    {
        let cases = setup();

        let result = panic::catch_unwind(|| test(&cases));

        assert!(result.is_ok())
    }

    #[test]
    fn it_can_deser_and_reser_proofs() {
        run_test(|cases| {
            let valid_proofs = &cases.valid;
            for case in valid_proofs {
                let proof: SPVProof = serde_json::from_str(&case).unwrap();
                let re_stringed = serde_json::to_string(&proof).unwrap();
                let re_proofed: SPVProof = serde_json::from_str(&re_stringed).unwrap();
                assert_eq!(re_proofed, proof);
            }
        })
    }

    #[test]
    fn it_errors_on_bad_hex_bytes() {
        run_test(|cases| {
            let invalid_proof = &cases.errBadHexBytes;
            let proof: serde_json::Result<SPVProof> = serde_json::from_str(invalid_proof);
            let expected = "Invalid character \'Q\' at position";
            match proof {
                Ok(_) => assert!(false, "Expected error"),
                Err(v) => assert!(v.to_string().contains(expected)),
            }
        })
    }

    #[test]
    fn it_errors_on_bad_hash256_bytes() {
        run_test(|cases| {
            let invalid_proof = &cases.errBadHexHash256;
            let proof: serde_json::Result<SPVProof> = serde_json::from_str(invalid_proof);
            let expected = "Invalid character \'R\' at position";
            match proof {
                Ok(_) => assert!(false, "Expected error"),
                Err(v) => assert!(v.to_string().contains(expected)),
            }
        })
    }

    #[test]
    fn it_errors_on_bad_hash256_len() {
        run_test(|cases| {
            let invalid_proof = &cases.errBadLenHash256;
            let proof: serde_json::Result<SPVProof> = serde_json::from_str(invalid_proof);
            let expected = "Expected 32 bytes, got 31 bytes";
            match proof {
                Ok(_) => assert!(false, "Expected error"),
                Err(v) => assert!(v.to_string().contains(expected)),
            }
        })
    }

    #[test]
    fn it_errors_on_bad_header_bytes() {
        run_test(|cases| {
            let invalid_proof = &cases.errBadHexRawHeader;
            let proof: serde_json::Result<SPVProof> = serde_json::from_str(invalid_proof);
            let expected = "Invalid character \'S\' at position";
            match proof {
                Ok(_) => assert!(false, "Expected error"),
                Err(v) => assert!(v.to_string().contains(expected)),
            }
        })
    }

    #[test]
    fn it_errors_on_bad_header_len() {
        run_test(|cases| {
            let invalid_proof = &cases.errBadLenRawHeader;
            let proof: serde_json::Result<SPVProof> = serde_json::from_str(invalid_proof);
            let expected = "Expected 80 bytes, got 79 bytes";
            match proof {
                Ok(_) => assert!(false, "Expected error"),
                Err(v) => assert!(v.to_string().contains(expected)),
            }
        })
    }

    #[test]
    fn it_validates_bitcoin_header_objects() {
        run_test(|cases| {
            let valid: SPVProof = serde_json::from_str(&cases.valid[0]).unwrap();
            let header = valid.confirming_header;
            let result = header.validate();
            result.unwrap(); // panics if there's an error

            let invalid = &cases.badHeaders;
            for i in invalid {
                let res = i.header.validate();
                let expected = test_utils::match_string_to_err(&i.e);
                match res {
                    Ok(_) => assert!(false, "Expected an error"),
                    Err(e) => assert_eq!(e, expected),
                }
            }
        })
    }

    #[test]
    fn it_validates_spv_proof_objects() {
        run_test(|cases| {
            let valid: SPVProof = serde_json::from_str(&cases.valid[0]).unwrap();
            let result = valid.validate();
            result.expect("Invalid case expected to be valid"); // panics if there's an error

            let invalid = &cases.badSPVProofs;
            for i in invalid {
                let res = i.proof.validate();
                let expected = test_utils::match_string_to_err(&i.e);
                match res {
                    Ok(_) => assert!(false, "Expected an error"),
                    Err(e) => assert_eq!(e, expected),
                }
            }
        })
    }
}
