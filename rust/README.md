## Bitcoin SPV Proofs in Rust

### What is it?

`bitcoin-spv` is a collection of Rust tooling for working with Bitcoin
data structures. Basically, these tools help you parse, inspect, and
authenticate Bitcoin transactions.

### Features

- default: `std`
- `std` -- rust standard library. Disable for no-std support

### Building

`$ cargo build`

### Testing

`$ cargo test`

Run no-std functionality tests
`$ cargo test --lib --no-default-features`

## Supported by

![Binance X Fellowship, Interchain Foundation, Summa, Cross Chain Group](../logo-group.jpg)

- [Binance X Fellowship](https://binancex.dev/fellowship.html)
- [Interchain Foundation](https://interchain.io/)
- [Summa](https://summa.one)
- [Cross Chain Group](https://crosschain.group/)


### IMPORTANT WARNING

It is extremely easy to write insecure code using these libraries. We do not
recommend a specific security model. Any SPV verification involves complex
security assumptions. Please seek external review for your design before
building with these libraries.
