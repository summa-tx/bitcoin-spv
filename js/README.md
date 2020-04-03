## Bitcoin SPV Proofs in JavaScript

### What is it?

`bitcoin-spv-js` is a collection of JavaScript functions for working with Bitcoin
data structures. Basically, these tools help you parse, inspect, and
authenticate Bitcoin transactions.

This library will run in all modern browsers, as well as Node. Due to extensive
use of `BigInt`s and ES6 modules, this library requires Node 10 or higher.
Usage in Node requires the `--experimental-modules` flag.

## Supported by

![Binance X Fellowship, Interchain Foundation, Summa, Cross Chain Group](../logo-group.jpg)

- [Binance X Fellowship](https://binancex.dev/fellowship.html)
- [Interchain Foundation](https://interchain.io/)
- [Summa](https://summa.one)
- [Cross Chain Group](https://crosschain.group/)

---------

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
        1. Tightly packed in a single `Uint8Array` called `vin`
    1. The variable-length output vector
        1. No more than `0xfc` outputs
        1. Prefixed with the number of inputs
        1. Tightly packed in a single `Uint8Array` called `vout`
    1. The transaction locktime (a 4-byte LE integer)
1. The header chain:
    1. Contains any number of 80-byte headers
    1. In a single `Uint8Array` without prefix or padding
    1. Starts from the lowest height
    1. Must form a logical hash-linked chain
1. The merkle inclusion proof, which contains 2 elements:
    1. The merkle branch containing any number of 32-byte double-sha2 digests
        1. In a single `Uint8Array`, without prefix or padding
        1. Ordered from leaf to root (but does not include leaf or root)
    1. The index of the leaf in the tree (an integer)

The verifier is implemented in JS. It validates proofs contained in those
transactions. The verifier must set one parameter on-chain: the required total
work, expressed as accumulated difficulty. The verifier sums difficulty across
the header chain by measuring the work in its component headers. In addition,
the verifier may set any number of other acceptance constraints on the proof.
E.g. the contract may check that the `vout` contains an output paying at least
30,000 satoshi to a particular `scriptPubkey`.

**SPV Proof Example:**  
We have provided serialization methods for proofs with a single header in
`ser.js`.

```JavaScript
import * as ser from './src/ser'
import * as ValidateSPV from './src/ValidateSPV'

// An SPV Proof is an object comprised of version, vin, vout, locktime, tx_id, index, intermediate_nodes and confirming_header
// Confirming Header is a bitcoin header object comprised of hash, height, raw (the raw header), merkle_root, and prevhash
// Values inside an SPV Proof and Confirming Header are Little-Endian
// This is an example of an SPV Proof stored in JSON
const SPVProofJSON = "{\"version\": \"0x01000000\",\"vin\": \"0x0101748906a5c7064550a594c4683ffc6d1ee25292b638c4328bb66403cfceb58a000000006a4730440220364301a77ee7ae34fa71768941a2aad5bd1fa8d3e30d4ce6424d8752e83f2c1b02203c9f8aafced701f59ffb7c151ff2523f3ed1586d29b674efb489e803e9bf93050121029b3008c0fa147fd9db5146e42b27eb0a77389497713d3aad083313d1b1b05ec0ffffffff\", \"vout\": \"0x0316312f00000000001976a91400cc8d95d6835252e0d95eb03b11691a21a7bac588ac220200000000000017a914e5034b9de4881d62480a2df81032ef0299dcdc32870000000000000000166a146f6d6e69000000000000001f0000000315e17900\",\"locktime\": \"0x00000000\",\"tx_id\": \"0x5176f6b03b8bc29f4deafbb7384b673debde6ae712deab93f3b0c91fdcd6d674\",\"index\": 26,\"intermediate_nodes\": \"0x8d7a6d53ce27f79802631f1aae5f172c43d128b210ab4962d488c81c96136cfb75c95def872e878839bd93b42c04eb44da44c401a2d580ca343c3262e9c0a2819ed4bbfb9ea620280b31433f43b2512a893873b8c8c679f61e1a926c0ec80bcfc6225a15d72fbd1116f78b14663d8518236b02e765bf0a746a6a08840c122a02afa4df3ab6b9197a20f00495a404ee8e07da2b7554e94609e9ee1d5da0fb7857ea0332072568d0d53a9aedf851892580504a7fcabfbdde076242eb7f4e5f218a14d2a3f357d950b4f6a1dcf93f7c19c44d0fc122d00afa297b9503c1a6ad24cf36cb5f2835bcf490371db2e96047813a24176c3d3416f84b7ddfb7d8c915eb0c5ce7de089b5d9e700ecd12e09163f173b70bb4c9af33051b466b1f55abd66f3121216ad0ad9dfa898535e1d5e51dd07bd0a73d584daace7902f20ece4ba4f4f241c80cb31eda88a244a3c68d0f157c1049b4153d7addd6548aca0885acafbf98a1f8345c89914c24729ad095c7a0b9acd20232ccd90dbd359468fcc4eee7b67d\",\"confirming_header\": {\"hash\": \"0x4d0cfbf5aa3b2359e5cb7dcf3b286264bd22de883b6316000000000000000000\",\"height\": 592920,\"raw\": \"0x0000c020c238b601308b7297346ab2ed59942d7d7ecea8d23a1001000000000000000000b61ac92842abc82aa93644b190fc18ad46c6738337e78bc0c69ab21c5d5ee2ddd6376d5d3e211a17d8706a84\",\"merkle_root\": \"0xb61ac92842abc82aa93644b190fc18ad46c6738337e78bc0c69ab21c5d5ee2dd\",\"prevhash\": \"0xc238b601308b7297346ab2ed59942d7d7ecea8d23a1001000000000000000000\"}}"

// deserializeSPVProof will parse the json, deserialize the values, and return an SPVProof object
let SPVProof = ser.deserializeSPVProof(SPVProofJSON)

// The SPVProof object can now be used in functions, such as validateProof
let validProof = ValidateSPV.validateProof(SPVProof)
```

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
let txID = ValidateSPV.calculateTxId(VERSION, VIN, VOUT, LOCKTIME);

let merkleRoot = BTCUtils.extractMerkleRootLE(HEADER_CHAIN);
assert(ValidateSPV.prove(txID, merkleRoot, PROOF, PROOF_INDEX, 'Invalid inclusion proof');

let totalDiff;
try {
    totalDiff = ValidateSP.validateHeaderChain(HEADER_CHAIN);
    console.log(
        `Verified ${utils.serializeHex(txID)} with ${totalDiff} total work`;
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
