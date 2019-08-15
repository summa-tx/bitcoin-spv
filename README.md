## bitcoin-spv

`bitcoin-spv` is a low-level toolkit for working with Bitcoin from other
blockchains. It supplies a set of pure functions that can be used to validate
almost all Bitcoin transactions and headers, as well as higher-level
functions that can evaluate header chains and transaction inclusion proofs.

### What smart contract chains are supported?

We have well-tested implementations in Solidty and ES6+ (JS). These support any
EVM-based chain (Ethereum, Celo, and others), as well as projects based on
[Lotion](https://github.com/nomic-io/lotion). Our ES6+ work will also work on
[Agoric](https://agoric.com/)'s SES-based smart contract system at launch.

We have an in-progress implementation in golang, targeting use by projects
based on the [Cosmos sdk](https://github.com/cosmos/cosmos-sdk/).

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
