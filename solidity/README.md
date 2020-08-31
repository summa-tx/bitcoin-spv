## Bitcoin SPV Proofs in Solidity

### What is it?

`bitcoin-spv` is a collection of Solidity libraries for working with Bitcoin
transactions in Solidity contracts. Basically, these tools help you parse,
inspect, and authenticate Bitcoin transactions.

## Supported by

![Summa, Cross Chain Group](../logo-summa-ccg.jpg)

- [Summa](https://summa.one)
- [Cross Chain Group](https://crosschain.group/)

-------

## IMPORTANT WARNING

It is extremely easy to write insecure code using these libraries. We do not
recommend a specific security model. Any SPV verification involves complex
security assumptions. Please seek external review for your design before
building with these libraries.

## Using `ViewBTC` and `ViewSPV`

The high level libraries use an underlying typed memory view library for 
efficient handling of the Solidity `bytes memory` type without copying memory.
The library co-opts the `bytes29` type and uses it as a pointer to a 
contiguous region of memory. Operations on this memory are defined on the 
`bytes29` type via a `using ____ for bytes29` statement.

The memory view semantics and interface are defined in `TypedMemView.sol`.
For BTC-specific applications, it is usually sufficient to import `ViewBTC`
without importing the underlying `TypedMemView` library.

BTC types are defined in `ViewBTC.sol` and checked at run time. Solidity does
not currently allow compile time type-checking for user-defined stack types.
Each Bitcoin function defines an explicit runtime type-check via modifier.
Type-check failures result in contract reversion.

Initial conversion from `bytes memory` to a typed memory view should be done
using the `tryAs_____` functions defined in `ViewBTC`.

```solidity

conrtract
using TypedMemView for bytes;
using TypedMemView for bytes29;

using ViewBTC for bytes29;
using ViewSPV for bytes29;

function acceptAVin(bytes memory _vin) {
    bytes29 vin = _vin
        .ref()           // Produce a view (reference to) the byte array
        .tryAsVin()      // Attempt to validate the user input as a Vin
        .assertValid();  // Assert the result is not an error

    // additional logic relying on the vin
    // ...
}
```

## How are proofs formatted?

An SPV interaction has two players: a prover and a verifier. The prover submits
an SPV proof, and the verifier checks it.

The proof must contain several elements: a transaction, an inclusion proof, and
a header chain. For convenience and gas minimization, we have a standard format
for these:

1. The transaction is pre-parsed by the prover into 4 elements:
    1. The transaction version (currently always 1 or 2 as a 4-byte LE integer)
    1. The variable-length input vector
        1. No more than 0xfc inputs
        1. Prefixed with the number of inputs
        1. Tightly packed in a single bytearray called `vin`
    1. The variable-length output vector
        1. No more than 0xfc outputs
        1. Prefixed with the number of inputs
        1. Tightly packed in a single bytearray called `vout`
    1. The transaction locktime (a 4-byte LE integer)
1. The header chain:
    1. Contains any number of 80-byte headers
    1. Is a single bytearray without prefix or padding
    1. Starts from the lowest height
    1. Must form a logical hash-linked chain
1. The merkle inclusion proof, which contains 2 elements:
    1. The merkle branch containing any number of 32-byte double-sha2 digests
        1. In a single bytearray, without prefix or padding
        1. Ordered from leaf to root (but does not include leaf or root)
    1. The index of the leaf in the tree (an integer)

While the prover is off-chain, and makes Ethereum transactions, the verifier is
implemented as a solidity contract that validates proofs contained in those
transactions. The verifier must set one parameter on-chain: the required total
work, expressed as accumulated difficulty. The verifier sums difficulty across 
the header chain by measuring the work in its component headers. In addition, 
the verifier may set any number of other acceptance constraints on the proof. 
E.g. the contract may check that the `vout` contains an output paying at 
least 30,000 satoshi to a particular `scriptPubkey`.

### Development Setup

```sh
$ npm run compile # truffle compile
$ npm run test # truffle test
$ npm run coverage
```