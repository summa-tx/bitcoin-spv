/// enum for bitcoin-spv errors
#[derive(Debug, PartialEq, Eq, Clone)]
pub enum SPVError {
    /// Overran a checked read on a slice
    ReadOverrun,
    /// Attempted to parse a CompactInt without enough bytes
    BadCompactInt,
    /// Called `extract_op_return_data` on an output without an op_return.
    MalformattedOpReturnOutput,
    /// `extract_hash` identified a SH output prefix without a SH postfix.
    MalformattedP2SHOutput,
    /// `extract_hash` identified a PKH output prefix without a PKH postfix.
    MalformattedP2PKHOutput,
    /// `extract_hash` identified a Witness output with a bad length tag.
    MalformattedWitnessOutput,
    /// `extract_hash` could not identify the output type.
    MalformattedOutput,
    /// Header not exactly 80 bytes.
    WrongLengthHeader,
    /// Header does not meet its own difficulty target.
    InsufficientWork,
    /// Header in chain does not correctly reference parent header.
    InvalidChain,
    /// When validating a `BitcoinHeader`, the `hash` field is not the digest
    /// of the raw header.
    WrongDigest,
    /// When validating a `BitcoinHeader`, the `hash` and `hash_le` fields
    /// do not match.
    NonMatchingDigests,
    /// When validating a `BitcoinHeader`, the `merkle_root` field does not
    /// match the root found in the raw header.
    WrongMerkleRoot,
    /// When validating a `BitcoinHeader`, the `merkle_root` and
    /// `merkle_root_le` fields do not match.
    NonMatchingMerkleRoots,
    /// When validating a `BitcoinHeader`, the `prevhash` field does not
    /// match the parent hash found in the raw header.
    WrongPrevHash,
    /// When validating a `BitcoinHeader`, the `prevhash` and
    /// `prevhash_le` fields do not match.
    NonMatchingPrevhashes,
    /// A `vin` (transaction input vector) is malformatted.
    InvalidVin,
    /// A `vout` (transaction output vector) is malformatted.
    InvalidVout,
    /// When validating an `SPVProof`, the `tx_id` field is not the digest
    /// of the `version`, `vin`, `vout`, and `locktime`.
    WrongTxID,
    /// When validating an `SPVProof`, the `intermediate_nodes` is not a valid
    /// merkle proof connecting the `tx_id_le` to the `confirming_header`.
    BadMerkleProof,
    /// TxOut's reported length does not match passed-in byte slice's length
    OutputLengthMismatch,
    /// Any other error
    UnknownError,
}

/// The standard address payload types
pub enum PayloadType<'a> {
    /// A PKH
    PKH(&'a [u8]),
    /// A WPKH
    WPKH(&'a [u8]),
    /// A WSH
    WSH(&'a [u8]),
    /// A SH
    SH(&'a [u8]),
}

/// A raw bitcoin header.
pub type RawHeader = [u8; 80];

/// A slice of `Hash256Digest`s for use in a merkle array
pub struct HeaderArray<'a>(&'a [u8]);

impl<'a> HeaderArray<'a> {
    /// Return a new merkle array from a slice
    pub fn new(slice: &'a [u8]) -> Result<HeaderArray<'a>, SPVError> {
        if slice.len() % 80 == 0 {
            Ok(Self(slice))
        } else {
            Err(SPVError::WrongLengthHeader)
        }
    }
}

impl HeaderArray<'_> {
    /// The length of the underlying slice
    pub fn len(&self) -> usize {
        self.0.len() / 80
    }

    /// Whether the underlying slice is empty
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    /// Index into the merkle array
    pub fn index(&self, index: usize) -> RawHeader {
        let mut header = [0u8; 80];
        header.copy_from_slice(&self.0[index * 80..(index + 1) * 80]);
        header
    }
}

/// A bitoin double-sha256 digest
pub type Hash256Digest = [u8; 32];

/// A slice of `Hash256Digest`s for use in a merkle array
pub struct MerkleArray<'a>(&'a [u8]);

impl<'a> MerkleArray<'a> {
    /// Return a new merkle array from a slice
    pub fn new(slice: &'a [u8]) -> Result<MerkleArray<'a>, SPVError> {
        if slice.len() % 32 == 0 {
            Ok(Self(slice))
        } else {
            Err(SPVError::BadMerkleProof)
        }
    }
}

impl MerkleArray<'_> {
    /// The length of the underlying slice
    pub fn len(&self) -> usize {
        self.0.len() / 32
    }

    /// Whether the underlying slice is empty
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    /// Index into the merkle array
    pub fn index(&self, index: usize) -> Hash256Digest {
        let mut digest = [0u8; 32];
        digest.copy_from_slice(&self.0[index * 32..(index + 1) * 32]);
        digest
    }
}

/// A bitcoin rmd160-of-sha256 digest
pub type Hash160Digest = [u8; 20];

/// A Bitcoin-formatted `CompactInt`
#[derive(Debug, Eq, PartialEq, Hash, Ord, PartialOrd)]
pub struct CompactInt(u64);

compact_int_conv!(u8);
compact_int_conv!(u16);
compact_int_conv!(u32);
compact_int_conv!(u64);
compact_int_conv!(usize);

impl AsRef<u64> for CompactInt {
    fn as_ref(&self) -> &u64 {
        &self.0
    }
}

impl CompactInt {
    /// Return the underlying u64
    pub fn number(&self) -> u64 {
        self.0
    }

    /// The underlying number as a usize
    pub fn as_usize(&self) -> usize {
        self.0 as usize
    }

    /// Determine the length of the compact int when serialized
    pub fn serialized_length(&self) -> usize {
        match self.0 {
            0..=0xfc => 1,
            0xfd..=0xffff => 3,
            0x10000..=0xffff_ffff => 5,
            _ => 9,
        }
    }

    /// Determines the length of a CompactInt in bytes.
    /// A CompactInt of > 1 byte is prefixed with a flag indicating its length.
    ///
    /// # Arguments
    ///
    /// * `flag` - The first byte of a compact_int
    pub fn data_length(flag: u8) -> u8 {
        let length: u8 = match flag {
            0xfd => 2,
            0xfe => 4,
            0xff => 8,
            _ => 0,
        };
        length
    }
}

impl_view_type!(
    /// A ScriptSig
    ScriptSig
);
impl_view_type!(
    /// A Outpoint
    Outpoint
);
impl_view_type!(
    /// A TxIn
    TxIn
);
impl_view_type!(
    /// A IntermediateTxIns
    IntermediateTxIns
);
impl_view_type!(
    /// A Vin
    Vin
);

impl<'a> Vin<'a> {
    /// Instantiate a new `Vin` from a slice, if the slice is a valid `Vin`
    pub fn new(slice: &'a[u8]) -> Result<Vin<'a>, SPVError> {
        if crate::btcspv::validate_vin(slice) {
            Ok(Self(slice))
        } else {
            Err(SPVError::InvalidVin)
        }
    }
}

impl_view_type!(
    /// A ScriptPubkey
    ScriptPubkey
);
impl_view_type!(
    /// A OpReturnPayload
    OpReturnPayload
);
impl_view_type!(
    /// A TxOut
    TxOut
);
impl_view_type!(
    /// A IntermediateTxOuts
    IntermediateTxOuts
);
impl_view_type!(
    /// A Vout
    Vout
);

impl<'a> Vout<'a> {
    /// Instantiate a new `Vout` from a slice, if the slice is a valid `Vout`
    pub fn new(slice: &'a[u8]) -> Result<Vout<'a>, SPVError> {
        if crate::btcspv::validate_vout(slice) {
            Ok(Self(slice))
        } else {
            Err(SPVError::InvalidVout)
        }
    }
}
