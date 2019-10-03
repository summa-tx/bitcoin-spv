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


./spvcli validateHeaderChain 0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b00000020fe70e48339d6b17fbbf1340d245338f57336e97767cc240000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d9515900000020baaea6746f4c16ccb7cd961655b636d39b5fe1519b8f15000000000000000000c63a8848a448a43c9e4402bd893f701cd11856e14cbbe026699e8fdc445b35a8d93c9c5ba1192817b945dc6c00000020f402c0b551b944665332466753f1eebb846a64ef24c71700000000000000000033fc68e070964e908d961cd11033896fa6c9b8b76f64a2db7ea928afa7e304257d3f9c5ba11928176164145d0000ff3f63d40efa46403afd71a254b54f2b495b7b0164991c2d22000000000000000000f046dc1b71560b7d0786cfbdb25ae320bd9644c98d5c7c77bf9df05cbe96212758419c5ba1192817a2bb2caa00000020e2d4f0edd5edd80bdcb880535443747c6b22b48fb6200d0000000000000000001d3799aa3eb8d18916f46bf2cf807cb89a9b1b4c56c3f2693711bf1064d9a32435429c5ba1192817752e49ae0000002022dba41dff28b337ee3463bf1ab1acf0e57443e0f7ab1d000000000000000000c3aadcc8def003ecbd1ba514592a18baddddcd3a287ccf74f584b04c5c10044e97479c5ba1192817c341f595


./spvcli prove 0x01000000 0x011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff 0x024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211 0x00000000 0x0296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c2 0xe35a0d6de94b656694589964a252957e4673a9fb1d2f8b4a92e3f0a7bb654fddb94e5a1e6d7f7f499fd1be5dd30a73bf5584bf137da5fdd77cc21aeb95b9e35788894be019284bd4fbed6dd6118ac2cb6d26bc4be4e423f55a3a48f2874d8d02a65d9c87d07de21d4dfe7b0a9f4a23cc9a58373e9e6931fefdb5afade5df54c91104048df1ee999240617984e18b6f931e2373673d0195b8c6987d7ff7650d5ce53bcec46e13ab4f2da1146a7fc621ee672f62bc22742486392d75e55e67b09960c3386a0b49e75f1723d6ab28ac9a2028a0c72866e2111d79d4817b88e17c821937847768d92837bae3832bb8e5a4ab4434b97e00a6c10182f211f592409068d6f5652400d9a3d1cc150a7fb692e874cc42d76bdafc842f2fe0f835a7c24d2d60c109b187d64571efbaa8047be85821f8e67e0e85f2f5894bc63d00c2ed9d64 281
```
