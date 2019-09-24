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

### IMPORTANT WARNING

It is extremely easy to write insecure code using these libraries. We do not
recommend a specific security model. Any SPV verification involves complex
security assumptions. Please seek external review for your design before
building with these libraries.

### Breaking changes from 1.x:

- Merkle proof indexes are 0-indexed (like they should have been all along)
- Merkle proofs for `ValidateSPV#prove` no longer require the leaf or root hash

### Solidity Compiler

Starting from version `1.1.0`, required solidity compiler (`solc`) version is
at least `0.5.10`.

### How are proofs formatted?

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
work, expressed as accumulated difficulty. The verifier sums difficulty across the header chain by measuring the work in its component headers.
In addition, the verifier may set any number of other acceptance constraints
on the proof. E.g. the contract may check that the `vout` contains an
output paying at least 30,000 satoshi to a particular `scriptPubkey`.

### Why is there a library and a Delegate?

1.0.0 was accessible only by the EVM's `DELEGATECALL`. For v2.0.0 we give you
the option to use `DELEGATECALL` or to compile the library methods into your
contract.

Compiling them in will save several hundred gas per invocation. That's
significant for higher-level functions like `prove` in `ValidateSPV`. But it
does add additional deployment cost to your contracts.

If you're using the Delegate, make sure to add a linking step to your
deployment scripts. :)

**Usage Example:**
```Solidity
import {BTCUtils} from "./contracts/BTCUtils.sol";
import {BTCUtilsDelegate} from "./contracts/BTCUtilsDelegate.sol";


contract CompilesIn {
    using BTCUtils for bytes;

    function multiHash(bytes memory _b) {
        return keccak256(_b.hash256());  // Compiled In
    }

}

contract DelegateCalls {
    using BTCUtilsDelegate for bytes;

    function multiHash(bytes memory _b) {
        return keccak256(_b.hash256());  // DELEGATECALL
    }
}

contract MixedAccess {

    function multiHash(bytes memory _b) {
        return keccak256(BTCUtils.hash256(_b));  // Compiled In
    }

    function multiHashWithDelegate(bytes memory _b) {
        return keccak256(BTCUtilsDelegate.hash256(_b)); // DELEGATECALL
    }

}

```

### Deployed Instances (for DELEGATECALLs)

| Contract    | Version |  Solc     |  Main                                        |  Ropsten
|-------------|---------|-----------|----------------------------------------------|-------------------------------------------
| ValidateSPV |  1.0.0  |  v0.4.25  |  0xaa75a0d48fca26ec2102ab68047e98a80a63df1d  |  0x112ef10aef3bde1cd8fd062d805ae8173ec36d66
| BTCUtils    |	 1.0.0  |  v0.4.25  |  0xD0d4EA34e4a5c27cA40e78838a4Ed5C1bB033BbC  |  0x7a79d4112d79af980e741e0b10c47ffa543cc93a
| BytesLib    |	 1.0.0  |  v0.4.25  |  0x302A17fcE39E877966817b7cc5479D8BfCe05295  |  0xcc69fec9ba70d6b4e386bfdb70b94349aff15f53
| ValidateSPV |  1.1.0  |  v0.5.10  |  NOT YET DEPLOYED                            |  NOT YET DEPLOYED
| BTCUtils    |	 1.1.0  |  v0.5.10  |  NOT YET DEPLOYED                            |  NOT YET DEPLOYED
| BytesLib    |	 1.1.0  |  v0.5.10  |  NOT YET DEPLOYED                            |  NOT YET DEPLOYED
| ValidateSPV |  2.0.0  |  v0.5.10  |  NOT YET DEPLOYED                            |  NOT YET DEPLOYED
| BTCUtils    |	 2.0.0  |  v0.5.10  |  NOT YET DEPLOYED                            |  NOT YET DEPLOYED
| BytesLib    |	 2.0.0  |  v0.5.10  |  NOT YET DEPLOYED                            |  NOT YET DEPLOYED


### Development Setup
By default, you must run an instance of `ganache-cli` (or some other ganache
VM) when running tests.
```sh
$ npm run compile # truffle compile
$ npm run test # truffle test
$ npm run coverage
```
