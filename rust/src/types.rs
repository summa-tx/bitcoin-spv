use primitive_types::U256;

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
    /// Header chain changed difficulties unexpectedly
    UnexpectedDifficultyChange,
    /// Header does not meet its own difficulty target.
    InsufficientWork,
    /// Header in chain does not correctly reference parent header.
    InvalidChain,
    /// When validating a `BitcoinHeader`, the `hash` field is not the digest
    /// of the raw header.
    WrongDigest,
    /// When validating a `BitcoinHeader`, the `merkle_root` field does not
    /// match the root found in the raw header.
    WrongMerkleRoot,
    /// When validating a `BitcoinHeader`, the `prevhash` field does not
    /// match the parent hash found in the raw header.
    WrongPrevHash,
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
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd)]
pub enum PayloadType<'a> {
    /// A PKH
    PKH(&'a [u8]),
    /// A SH
    SH(&'a [u8]),
    /// A WPKH
    WPKH(&'a [u8]),
    /// A WSH
    WSH(&'a [u8]),
}

impl PartialEq<[u8]> for PayloadType<'_> {
    fn eq(&self, other: &[u8]) -> bool {
        match self {
            PayloadType::PKH(slice) => *slice == other,
            PayloadType::SH(slice) => *slice == other,
            PayloadType::WPKH(slice) => *slice == other,
            PayloadType::WSH(slice) => *slice == other,
        }
    }
}

impl PartialEq<&[u8]> for PayloadType<'_> {
    fn eq(&self, other: &&[u8]) -> bool {
        match self {
            PayloadType::PKH(slice) => slice == other,
            PayloadType::SH(slice) => slice == other,
            PayloadType::WPKH(slice) => slice == other,
            PayloadType::WSH(slice) => slice == other,
        }
    }
}

/// A raw bitcoin header.
#[derive(Copy, Clone)]
pub struct RawHeader([u8; 80]);

impl PartialEq for RawHeader {
    fn eq(&self, other: &Self) -> bool {
        self.0[..] == other.0[..]
    }
}

impl Eq for RawHeader {}

impl RawHeader {
    /// Try to instantiate a new RawHeader from some bytes. Errors if the bytearray is not 80
    /// bytes or more.
    pub fn new<T: AsRef<[u8]>>(buf: &T) -> Result<Self, SPVError> {
        if buf.as_ref().len() < 80 {
            return Err(SPVError::WrongLengthHeader);
        }
        let mut header = Self::default();
        header.as_mut().copy_from_slice(&buf.as_ref()[..80]);
        Ok(header)
    }

    /// Calculate the LE header digest
    pub fn digest(&self) -> Hash256Digest {
        crate::btcspv::hash256(&[self.as_ref()])
    }

    /// Extract the LE tx merkle root from the header
    pub fn tx_root(&self) -> Hash256Digest {
        crate::btcspv::extract_merkle_root_le(*self)
    }

    /// Extract the target from the header
    pub fn target(&self) -> U256 {
        crate::btcspv::extract_target(*self)
    }

    /// Extract the difficulty from the header
    pub fn difficulty(&self) -> U256 {
        crate::btcspv::extract_difficulty(*self)
    }

    /// Extract the timestamp from the header
    pub fn timestamp(&self) -> u32 {
        crate::btcspv::extract_timestamp(*self)
    }

    /// Extract the LE parent digest from the header
    pub fn parent(&self) -> Hash256Digest {
        crate::btcspv::extract_prev_block_hash_le(*self)
    }
}

impl Default for RawHeader {
    fn default() -> Self {
        Self([0u8; 80])
    }
}

impl From<[u8; 80]> for RawHeader {
    fn from(buf: [u8; 80]) -> Self {
        Self(buf)
    }
}

impl AsRef<[u8; 80]> for RawHeader {
    fn as_ref(&self) -> &[u8; 80] {
        &self.0
    }
}

impl AsMut<[u8; 80]> for RawHeader {
    fn as_mut(&mut self) -> &mut [u8; 80] {
        &mut self.0
    }
}

impl<I: core::slice::SliceIndex<[u8]>> core::ops::Index<I> for RawHeader {
    type Output = I::Output;

    fn index(&self, index: I) -> &Self::Output {
        self.as_ref().index(index)
    }
}

/// A slice of `Hash256Digest`s for use in a merkle array
#[derive(Clone, PartialEq, Eq, Hash)]
pub struct HeaderArray<'a>(&'a [u8]);

#[cfg_attr(tarpaulin, skip)]
impl core::fmt::Debug for HeaderArray<'_> {
    /// Formats the RawHeader for readability
    ///
    /// # Arguments
    ///
    /// * `self` - The Bitcoin header
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(
            f,
            "HeaderArray: {:x?}", self.0
        )
    }
}

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

    /// Index into the merkle array. This does not protect you from overruns, which may result in
    /// panics.
    pub fn index(&self, index: usize) -> RawHeader {
        let mut header = RawHeader::default();
        header
            .as_mut()
            .copy_from_slice(&self.0[index * 80..(index + 1) * 80]);
        header
    }

    /// Validate the header array. Return either the accumulated difficulty, or an error
    pub fn valid_difficulty(&self, constant_difficulty: bool) -> Result<U256, SPVError> {
        crate::validatespv::validate_header_chain(self, constant_difficulty)
    }

    /// Return a new iterator for the header array.
    pub fn iter(&self) -> HeaderArrayIter {
        HeaderArrayIter::new(&self)
    }
}

/// Iterator for a HeaderArray
pub struct HeaderArrayIter<'a> {
    next_index: usize,
    headers: &'a HeaderArray<'a>,
}

impl<'a> HeaderArrayIter<'a> {
    fn new(headers: &'a HeaderArray<'a>) -> Self {
        Self {
            next_index: 0,
            headers,
        }
    }
}

impl<'a> Iterator for HeaderArrayIter<'a> {
    type Item = RawHeader;

    fn next(&mut self) -> Option<Self::Item> {
        if self.next_index == self.headers.len() {
            return None;
        }
        let header = self.headers.index(self.next_index);
        self.next_index += 1;
        Some(header)
    }
}

/// A bitoin double-sha256 digest
#[derive(Copy, Clone, PartialEq, Eq, Default, Hash)]
pub struct Hash256Digest([u8; 32]);

#[cfg_attr(tarpaulin, skip)]
impl core::fmt::Debug for Hash256Digest {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(
            f,
            "Hash256Digest: {:x?}", self.0
        )
    }
}


impl From<[u8; 32]> for Hash256Digest {
    fn from(buf: [u8; 32]) -> Self {
        Self(buf)
    }
}

impl AsRef<[u8; 32]> for Hash256Digest {
    fn as_ref(&self) -> &[u8; 32] {
        &self.0
    }
}

impl AsMut<[u8; 32]> for Hash256Digest {
    fn as_mut(&mut self) -> &mut [u8; 32] {
        &mut self.0
    }
}

/// A bitcoin rmd160-of-sha256 digest
#[derive(Copy, Clone, PartialEq, Eq, Default, Hash)]
pub struct Hash160Digest([u8; 20]);

#[cfg_attr(tarpaulin, skip)]
impl core::fmt::Debug for Hash160Digest {
    /// Formats the Hash160Digest for readability
    ///
    /// # Arguments
    ///
    /// * `self` - The Bitcoin header
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(
            f,
            "Hash160Digest: {:x?}", self.0
        )
    }
}

impl From<[u8; 20]> for Hash160Digest {
    fn from(buf: [u8; 20]) -> Self {
        Self(buf)
    }
}

impl AsRef<[u8; 20]> for Hash160Digest {
    fn as_ref(&self) -> &[u8; 20] {
        &self.0
    }
}

impl AsMut<[u8; 20]> for Hash160Digest {
    fn as_mut(&mut self) -> &mut [u8; 20] {
        &mut self.0
    }
}

/// A slice of `Hash256Digest`s for use in a merkle array
#[derive(Debug, Clone, PartialEq, Eq)]
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
        let mut digest = Hash256Digest::default();
        digest
            .as_mut()
            .copy_from_slice(&self.0[index * 32..(index + 1) * 32]);
        digest
    }
}

/// A Bitcoin-formatted `CompactInt`
#[derive(Copy, Clone, Debug, Eq, PartialEq, Hash, Ord, PartialOrd)]
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
    /// Parse a compact int from a byte slice
    pub fn parse<T: AsRef<[u8]> + ?Sized>(t: &T) -> Result<CompactInt, SPVError> {
        crate::btcspv::parse_compact_int(t)
    }

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

impl Outpoint<'_> {
    /// Extract the LE txid from the outpoint
    pub fn txid_le(&self) -> Hash256Digest {
        crate::btcspv::extract_input_tx_id_le(self)
    }

    /// Extract the outpoint's index in the prevout tx's vout
    pub fn vout_index(&self) -> u32 {
        crate::btcspv::extract_tx_index(self)
    }
}

impl_view_type!(
    /// A TxIn
    TxIn
);

impl TxIn<'_> {
    /// Extract the outpoint from the TxIn
    pub fn outpoint(&self) -> Outpoint {
        crate::btcspv::extract_outpoint(self)
    }

    /// Extract the sequence number from the TxIn
    pub fn sequence(&self) -> u32 {
        crate::btcspv::extract_sequence(self).expect("Not malformed")
    }

    /// Extract the script sig from the TxIn
    pub fn script_sig(&self) -> ScriptSig {
        crate::btcspv::extract_script_sig(self).expect("Not malformed")
    }
}

impl_view_type!(
    /// A Vin
    Vin
);

impl<'a> Vin<'a> {
    /// Instantiate a new `Vin` from a slice, if the slice is a valid `Vin`
    pub fn new(slice: &'a [u8]) -> Result<Vin<'a>, SPVError> {
        if crate::btcspv::validate_vin(slice) {
            Ok(Self(slice))
        } else {
            Err(SPVError::InvalidVin)
        }
    }

    /// Retrieve the txin at the specified index of the vin
    pub fn index(&self, index: usize) -> Result<TxIn, SPVError> {
        crate::btcspv::extract_input_at_index(self, index)
    }
}

impl_view_type!(
    /// A ScriptPubkey, with its compact int length prefix
    ScriptPubkey
);

impl ScriptPubkey<'_> {
    /// Extract the op return payload, if any
    pub fn op_return(&self) -> Result<OpReturnPayload, SPVError> {
        crate::btcspv::extract_op_return_data(self)
    }

    /// Extract the hash payload from standard scripts
    pub fn payload(&self) -> Result<PayloadType, SPVError> {
        crate::btcspv::extract_hash(self)
    }
}

impl_view_type!(
    /// A OpReturnPayload
    OpReturnPayload
);

impl_view_type!(
    /// A TxOut
    TxOut
);

impl TxOut<'_> {
    /// Extract the value of the txout, as a u64
    pub fn value(&self) -> u64 {
        crate::btcspv::extract_value(self)
    }

    /// Extract the script pubkey from the TxOut
    pub fn script_pubkey(&self) -> ScriptPubkey {
        crate::btcspv::extract_script_pubkey(self)
    }
}

impl_view_type!(
    /// A Vout
    Vout
);

impl<'a> Vout<'a> {
    /// Instantiate a new `Vout` from a slice, if the slice is a valid `Vout`
    pub fn new(slice: &'a [u8]) -> Result<Vout<'a>, SPVError> {
        if crate::btcspv::validate_vout(slice) {
            Ok(Self(slice))
        } else {
            Err(SPVError::InvalidVout)
        }
    }

    /// Retrieve the txout at the specified index of the vout
    pub fn index(&self, index: usize) -> Result<TxOut, SPVError> {
        crate::btcspv::extract_output_at_index(self, index)
    }
}
