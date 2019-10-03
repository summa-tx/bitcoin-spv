## Bitcoin SPV Proofs in Golang
```go
import (
    btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)
```

### What is it?

`bitcoin-spv` is a collection of Golang functions for working with Bitcoin
data structures. Basically, these tools help you parse, inspect, and
authenticate Bitcoin transactions. This library is targeted at running in
modules or apps built on the
[Cosmos SDK](https://github.com/cosmos/cosmos-sdk/).

## Supported by

![Binance X Fellowship, Interchain Foundation, Summa, Cross Chain Group](../logo-group.jpg)

- [Binance X Fellowship](https://binancex.dev/fellowship.html)
- [Interchain Foundation](https://interchain.io/)
- [Summa](https://summa.one)
- [Cross Chain Group](https://crosschain.group/)

-----------

### IMPORTANT WARNING

It is extremely easy to write insecure code using these libraries. We do not
recommend a specific security model. Any SPV verification involves complex
security assumptions. Please seek external review for your design before
building with these libraries.

### How are SPV proofs formatted?

An SPV interaction has two players: a prover and a verifier. The prover submits
an SPV proof, and the verifier checks it.

The proof must contain several elements: a transaction, an inclusion proof, and
a header chain. For convenience and gas minimization, we have a standard format
for these:

1. The transaction is pre-parsed by the prover into 4 elements:
    1. The transaction version (currently always 1 or 2 as a 4-byte LE integer)
    1. The variable-length input vector
        1. No more than `0xfc` inputs
        1. Prefixed with the number of inputs
        1. Tightly packed in a single `[]byte` called `vin`
    1. The variable-length output vector
        1. No more than `0xfc` outputs
        1. Prefixed with the number of inputs
        1. Tightly packed in a single `[]byte` called `vout`
    1. The transaction locktime (a 4-byte LE integer)
1. The header chain:
    1. Contains any number of 80-byte headers
    1. Is a single `[]byte` without prefix or padding
    1. Starts from the lowest height
    1. Must form a logical hash-linked chain
1. The merkle inclusion proof, which contains 2 elements:
    1. The merkle branch containing any number of 32-byte double-sha2 digests
        1. In a single `[]byte`, without prefix or padding
        1. Ordered from leaf to root (but does not include leaf or root)
    1. The index of the leaf in the tree (an integer)

The verifier is implemented in Golang. It validates proofs contained in those
transactions. The verifier must set one parameter on-chain: the required total
work, expressed as accumulated difficulty. The verifier sums difficulty across
the header chain by measuring the work in its component headers. In addition,
the verifier may set any number of other acceptance constraints on the proof.
E.g. the contract may check that the `vout` contains an output paying at least
30,000 satoshi to a particular `scriptPubkey`.


### Usage Example
We've provided a sample CLI! Check out the code in `spvcli/` for basic examples
of calling `btcspv` functions.

To build the CLI, run `go build -o spvcli ./cli/*`.

Then you can interact with the cli (although you may need to run
`chmod +x spvcli` first). Here's a sample command:

```
./spvcli parseVout 2045a205000000000017a914c58d56082eeb47555f4c4fc7acb062f0e82a9bc187708203000000000017a914373733553a09172b7188d7c0d374221fdf2e46c687e1a805000000000017a9141d10131d33aaa02b19d88b04f88f3552eab2bf8587d88603000000000017a9146721b54bb3b7e9c2d9fd6fffbc411e2f0cbc0b8c874ec508000000000017a914ce549ff6a7056bcf9b651c01bae9c16cc6f6807a87ae6007000000000017a9143217f0363ec8ed14fff93de3de0733990b792b1387dc5505000000000017a914429129f4c0ffb1e31678b32a93fd9d52b6fd449587b0ad01000000000017a914dba1e2cd44c72a4b5207e96246270d839e46196987f0242c000000000017a91450d81227570591d429168103b37a107fe7dcb25f8729850a00000000001976a914a0db388af9f084082a08ba24e80fe6c9c56dc04b88ac88a302000000000017a914dd8fc156d5c7e73676fb6f008aaf05177dad36db87ca640b000000000017a914b6a81fac2db26d9865304f3e14be05388938e8d587fa9a0400000000001976a914b66df957f43c65f4d26257b18a108ce6f8386c6b88ac89b108000000000017a9148a5d64a1f792584aaffcf308eaf55a6c6c41e60287d41507000000000017a914a282ce5364195bb48686747d6ff6a4364860032f8748ee00000000000017a91469bc726bb0ecb8e1e64a4f71bb7e6f1d7437d85187d8db1400000000001976a9146bb997cef975cce8c1278dcad4b2993258703b9088ac4e0e0200000000001976a91404a8a478ea2707396554c359885f3e6b77bc035c88ac304b0700000000001976a914fc14cbb285729668d90699fb7c21eb3e2e4ddd4288ac80a70a000000000017a9141df808341dbc56c11f0823aed798bef0ed8500b687c31304000000000017a9145ade6f87813db8afb674cf6ec0a87c01af42d33687888d7400000000001976a914750a34081e7079b85e734f0d05a379137c1688da88acea7006000000000017a914c79af7945a8cb4c20add850c2f69f8e4c8ad141f87925dff00000000001976a91400e56b06a395fa5fd2bc495309d245ad4d0de3c588ac73822300000000001976a914524e377908c9aaccd4ddbd54eab719a91444610f88ac08b006000000000017a914e14a023009b395e5ed8a035172e6cdd72ae64d45870a3a0200000000001976a91465179eb63ff11f4ee0a8a386da735b13d496b18a88ac102003000000000017a9143a556b6de6fe6e28fc3eb7e44c1eea43c5a8e46a87cadd8f01000000001976a914cff8fd38572288cc475b646f886d26677ff3531788acd11b21070000000017a9143782174d94c45ed500d660a000d192249870e22c87d8e807000000000017a9145ce410d39e1e9b85ba971f0bc8ac020a86cbf6008750a506000000000017a914613be659f5015225edcb5868bb76b1cc6d709f9187
```
