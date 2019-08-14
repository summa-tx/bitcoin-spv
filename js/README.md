## Bitcoin SPV Proofs in JavaScript

### What is it?

`bitcoin-spv` is a collection of JavaScript functions for working with Bitcoin
transactions. Basically, these tools help you parse, inspect, and authenticate
Bitcoin transactions.

### IMPORTANT WARNING

It is extremely easy to write insecure code using these libraries. We do not
recommend a specific security model. Any SPV verification involves complex
security assumptions. Please seek external review for your design before
building with these libraries.

### Breaking changes from 1.x:

- Merkle proof indexes are 0-indexed (like they should have been all along)
- Merkle proofs for `ValidateSPV#prove` no longer require the leaf or root hash
- Node 10.0.0 or greater is required

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

**Usage Example:**
```JavaScript
import * as BTCUtils from "./js/src/BTCUtils.js";
import * as ValidateSPV from "./js/src/ValidateSPV.js";

// convert data to a Uint8Array using the deserializeHex function
const OUTPUT = BTCUtils.deserializeHex("0x4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c18");

// extractHash takes in the Output as a Uint8Array
// extractHash returns the hash as a Uint8Array
function callExtractHash () {
    let res = BTCUtils.extractHash(OUTPUT);
    // do stuff with res
    return BTCUtils.serializeHex(res); // convert it back to a hex value using the serializeHex function
}

// convert data to a Uint8Array using the deserializeHex function
const BE_VALUE = BTCUtils.deserializeHex("0x00112233")

// some functions require an LE or BE value, to convert between the two, use the reverseEndianness function
// reverseEndianness takes in an LE or BE value as a Uint8Array
// reverseEndianness reverses the endianness and returns it as a Uint8Array
function callReverseEndianness () {
    let leValue = BTCUtils.reverseEndianness(BE_VALUE);
}

// convert data to a Uint8Array using the deserializeHex function
const VERSION = BTCUtils.deserializeHex('0x01000000');
const VIN = BTCUtils.deserializeHex('0x011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff');
const VOUT = BTCUtils.deserializeHex('0x024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211');
const LOCKTIME_LE = BTCUtils.deserializeHex('0x00000000');

// calculateTxId takes in 4 values as Uint8Arrays: version, vin, vout, and locktime
// calculateTxId returns the id as a Uint8Array
function callCalculateTxId () {
    let id = ValidateSPV.calculateTxId(VERSION, VIN, VOUT, LOCKTIME_LE)
}
```

### Development Setup
```sh
$ cd js
$ npm i
$ npm run test # truffle test
```

### Important Bitcoin Gotchas
Blockchain.info shows txids and merkle root in BE format

They should be in LE for the proof construction

They need to be in LE for hashing

They are in LE in the block

### Test Txns

These transactions are used in tests:

#### P2WPKH With witness:
https://www.blockchain.com/btc/tx/10e3eaed1ef21787944f0d151a1a6553397e2ee4074887e344a112e13f22b70b
LE ID: `0bb7223fe112a144e3874807e42e7e3953651a1a150d4f948717f21eedeae310`
```
0200000000010134e62927bfb718ac6a6bcda87e02fce897a8af524d748c1d172570bce3a7b11a00000000008004000001145c92000000000016001486a92a3c9bd01ed7d9844c842295ccd29bbef467034730440220115db53ebdb1ad3a47399a55a246101fb234e2487a09d509df7d56da91aa8a83022021f90d37e65c457890dbddbe6f1cb60af90541ff539782aa69f846fd0c4b0d1f01004d632102302a34a02288ae9cb62d5f099b78b463124f108b4140e9c2c9657e223419d45267028004b2752102ecc5b51c462ee2ecf47e1ef67e73e884f5f539c779fdc779c7a90615a659a30e68ac00000000
```

#### 1 input, 1 WSH output, 1 op_return
https://blockchair.com/bitcoin/transaction/d60033c5cf5c199208a9c656a29967810c4e428c22efb492fdd816e6a0a1e548
```
010000000001011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000
```
