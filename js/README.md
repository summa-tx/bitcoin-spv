## Bitcoin SPV Proofs in JavaScript

### What is it?

`bitcoin-spv` is a collection of JavaScript functions for working with Bitcoin
transactions. Basically, these tools help you parse, inspect, and authenticate
Bitcoin transactions.

This library will run in all modern browsers, as well as Node. Due to extensive
use of `BigInt`s and es6 modules, this library requires Node 10 or higher.
Usage in Node requires the `--experimental-modules` flag.

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
        1. No more than 0xfc inputs
        1. Prefixed with the number of inputs
        1. Tightly packed in a single Uint8Array called `vin`
    1. The variable-length output vector
        1. No more than 0xfc outputs
        1. Prefixed with the number of inputs
        1. Tightly packed in a single Uint8Array called `vout`
    1. The transaction locktime (a 4-byte LE integer)
1. The header chain:
    1. Contains any number of 80-byte headers
    1. Is a single Uint8Array without prefix or padding
    1. Starts from the lowest height
    1. Must form a logical hash-linked chain
1. The merkle inclusion proof, which contains 2 elements:
    1. The merkle branch containing any number of 32-byte double-sha2 digests
        1. In a single Uint8Array, without prefix or padding
        1. Ordered from leaf to root (but does not include leaf or root)
    1. The index of the leaf in the tree (an integer)

The verifier is implemented in JS. It validates proofs contained in those
transactions. The verifier must set one parameter on-chain: the required total
work, expressed as accumulated difficulty. The verifier sums difficulty across
the header chain by measuring the work in its component headers. In addition,
the verifier may set any number of other acceptance constraints on the proof.
E.g. the contract may check that the `vout` contains an output paying at least
30,000 satoshi to a particular `scriptPubkey`.

**Usage Example:**
```JavaScript
import * as utils from "./utils/utils.js";
import * as BTCUtils from "./src/BTCUtils.js";
import * as ValidateSPV from "./src/ValidateSPV.js";

// convert hex strings to a Uint8Array using the deserializeHex function
const VERSION = utils.deserializeHex('0xVERSION_BYTES');
const VIN = utils.deserializeHex('0xVIN_BYTES');
const VOUT = utils.deserializeHex('0xVOUT_BYTES');
const LOCKTIME = utils.deserializeHex('0xLOCKTIME_BYTES');
const HEADER_CHAIN = utils.deserializeHex('0xHEADER_BYTES');
const PROOF = utils.deserializeHex('0xPROOF_BYTES');
const PROOF_INDEX = 0;

// calculateTxId takes in 4 values as Uint8Arrays: version, vin, vout, and locktime
// calculateTxId returns the id as a Uint8Array
let txid = ValidateSPV.calculateTxId(VERSION, VIN, VOUT, LOCKTIME);

let merkleRoot = BTCUtils.extractMerkleRootLE(HEADER_CHAIN);
assert(ValidateSPV.prove(txid, merkleRoot, PROOF, PROOF_INDEX, 'Invalid inclusion proof');

let totalDiff;
try {
    totalDiff = ValidateSP.validateHeaderChain(HEADER_CHAIN);
    console.log(
        `Verified ${utils.serializeHex(txid)} with ${totalDiff} total work`;
    );
} catch(e) {
    console.log(`Invalid header chain: ${e.message}`);
}
```

### Development Setup
```sh
$ npm i
$ npm run test
```
