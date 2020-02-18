/// `btcspv` provides basic Bitcoin transaction and header parsing, as well as
/// utility functions like merkle verification and difficulty adjustment
/// calculation.
pub mod btcspv;
/// `utils` contains utility functions for working with bytestrings, including
/// hex encoding and decoding.
pub mod utils;
/// `validatespv` provides higher-levels of abstraction for evaluating
/// SPV proofs, transactions, and headers.
pub mod validatespv;
