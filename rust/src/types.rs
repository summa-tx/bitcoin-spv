/// enum for bitcoin-spv errors
#[derive(Debug, PartialEq, Eq, Clone)]
pub enum SPVError {
    /// Overran a checked read on a slice
    ReadOverrun,
    /// Attempted to parse a VarInt without enough bytes
    BadVarInt,
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

/// A raw bitcoin header.
pub type RawHeader = [u8; 80];

/// A bitoin double-sha256 digest
pub type Hash256Digest = [u8; 32];

/// A bitcoin rmd160-of-sha256 digest
pub type Hash160Digest = [u8; 20];
