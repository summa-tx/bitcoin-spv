## bitcoin-spv

`bitcoin-spv` is a low-level toolkit for working with Bitcoin from other
blockchains. It supplies a set of pure functions that can be used to validate
almost all Bitcoin transactions and headers, as well as higher-level
functions that can evaluate header chains and transaction inclusion proofs.

## Supported by

![Binance X Fellowship, Interchain Foundation, Summa, Cross Chain Group](./logo-group.jpg)

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

### Bitcoin Endianness Gotchas
Block explorers tend to show txids and merkle roots in big-endian (BE) format.
Most human-facing apps do this as well. However, due to Satoshi's inscrutable
wisdom, almost all in-protocol data structures use little-endian (LE) byte
order.

When pulling txids and merkle nodes, make sure the endianness is correct

1. They should be in LE for the proof construction
1. They need to be in LE for hashing
1. They are in LE in the merkle tree
