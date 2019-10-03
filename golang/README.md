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
`chmod +x spvcli` first). Here are some sample commands:

```
./spvcli parseVin 0411c75317188acf700684e5bf54d21e64ce950b3d94ecb0f323cc4b8ca145dc860100000000ffffffff7761252b3ed6eb20468a29007e624976f01ebb182feb83fab07c79c6028308ac070000006a473044022047fa4bb5b1975f1fae539675653ecd7bb2698c0b110fc35658cd7b227f9b9a5402203407f59b9fa5e94dabc2c87fc65e740c281f9ed89b25db9517b92cac76d56a9a0121036d9401fba14d2e1bbe7074c6e716557f7c0c8a48e6e4bf12e5798c75afec992dffffffff33de669bb42c9e05dada07d81775b55397feeac27a05f55cd9d89a6f5e73252b010000006a473044022038f921af4da78526817aaea304b4a0f12615f29babc8da6d0e618db77e0b828f0220787efb070e00fb5a15db4d854813da78abde84317a0263b5d1cceba04aa486f10121036d9401fba14d2e1bbe7074c6e716557f7c0c8a48e6e4bf12e5798c75afec992dffffffffe72701f12466fc9f4e476d87084e05f22bb9869318d3dd9880d6624e95474ae9010000006b483045022100e15bcd9b6f968d29c2660cfb099350bec5a2f9702bf3fcf720161ca5b3ebec7f02206893cb8abe87d6994a06315a9bacbb47a4788a26e50eef922f8b942766fe2a2001210343c792123ca88b3062528b0aabaa1c428523ccaef0dc63cc67d8ddb98fd9f720ffffffff


./spvcli parseVout 0x024db6000000000000160014455c0ea778752831d6fc25f6f8cf55dc49d335f040420f0000000000220020aedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c91922


./spvcli parseHeader 0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b
```
