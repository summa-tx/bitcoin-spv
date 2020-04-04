## bitcoin-spv

`bitcoin-spv` is a low-level toolkit for working with Bitcoin from other
blockchains. It supplies a set of pure functions that can be used to validate
almost all Bitcoin transactions and headers, as well as higher-level
functions that can evaluate header chains and transaction inclusion proofs.

It also supplies a standardized JSON format for proofs. Currently off-chain
proof (de)serialization is supported in Golang, Python, and JS.

## Supported by

![Binance X Fellowship, Interchain Foundation, Summa, Cross Chain Group](./logo-group.jpg)

- [Binance X Fellowship](https://binancex.dev/fellowship.html)
- [Interchain Foundation](https://interchain.io/)
- [Nervos Foundation](https://www.nervos.org/)
- [Summa](https://summa.one)
- [Cross Chain Group](https://crosschain.group/)
----------

### What smart contract chains are supported?

We have well-tested implementations in Solidty, ES6+ (JS), and golang.
These support any EVM-based chain (Ethereum, Celo, and others), as well as
projects based on [Lotion](https://github.com/nomic-io/lotion) and the
[Cosmos SDK](https://github.com/cosmos/cosmos-sdk/). Our ES6+ work will also
work on [Agoric](https://agoric.com/)'s SES-based smart contract system at
launch.

### Quickstart guide:

There really isn't one. Using these tools requires in-depth knowledge of the
Bitcoin transaction format. The implementations include setup and development
instructions. If you have a project in mind, feel free to reach out and ask
questions.

### IMPORTANT WARNING

It is extremely easy to write insecure code using these libraries. We do not
recommend a specific security model. Any SPV verification involves complex
security assumptions. Please seek external review for your design before
building with these libraries.

### A note about versioning

Implementations are versioned separately. I.e. there is no consistent feature
set for a given version number. Wherever possible we use SemVer. Because go's
versioning system is ridiculous, all releases are minor bumps, even when they
should be major bumps.

This may change in future releases.

At time of writing the following versions are roughly equivalent:
- Go v1.4.0
- JS v4.0.0
- rust v3.0.0
- py v3.0.0

Versions older than these have incompatible JSON Proof and Header formats.


### Bitcoin Endianness Gotchas
Block explorers tend to show txids and merkle roots in big-endian (BE) format.
Most human-facing apps do this as well. However, due to Satoshi's inscrutable
wisdom, almost all in-protocol data structures use little-endian (LE) byte
order.

When pulling txids and merkle nodes, make sure the endianness is correct

1. They should be in LE for the proof construction
1. They need to be in LE for hashing
1. They are in LE in the merkle tree
