# bitcoin-spv proof fetcher

The following clients are provided to fetch Bitcoin data to create proofs.
## Clients

- BcoinClient

### BcoinClient
Use the BcoinClient fetch Bitcoin data from a bcoin node. See the bcoin docs for how to run your own node.

#### Install

Node.js:
```sh
$ npm i --save @summa-tx/bitcoin-spv-js-clients
```

```js
const { BcoinClient } = require('@summa-tx/bitcoin-spv-js-clients');
```

ES6 module:

```js
import { BcoinClient } from '@summa-tx/bitcoin-spv-js-clients';
```

### Use

The BcoinClient proof fetcher exports a single constructor function, `BcoinClient`, which accepts an options Object to configure the client. This constructor is an extension of bcoin's `NodeClient`. See [bcoin.io](https://bcoin.io/api-docs/#configuring-clients) for more information about how to configure the client.

```js
const options = {
  network: 'testnet',
  port: 18332,
  apiKey: 'api-key'
};

const client = new BcoinClient(options);
```

### Methods

#### client.getBlockHeader(block)
   * `@param {Hash|Number} block`
   * `@returns {Promise}`

Retrieve a block header.

```js
const client = new BcoinClient(options);
const blockHeader = await client.getBlockHeader(150151);

// block header
// {
//   "hash": "6f1003edd05cad861395225415160b5236968cc223fe982796b6e959c9651d44",
//   "version": 536870912,
//   "prevBlock": "0c4ea5e675941eca1909275f21903cef755069a03c57c10f4d4dadcdd7146daf",
//   "merkleRoot": "9a249c682aba07943c8a1f9bd774a15d71372fcd7f3f9ee99e8c7aa022ae6aa0",
//   "time": 1571661863,
//   "bits": 545259519,
//   "nonce": 8,
//   "height": 100,
//   "chainwork": "00000000000000000000000000000000000000000000000000000000000000ca"
// }
```

#### client.getProof(txid)
   * `@param {String} txid` - txid in big endian
   * `@returns {Object}` - proof object

Get a proof for a transaction.

```js
const client = new BcoinClient(options);
const txid =

// proof object
// {
//   version: {String},
//   vin: {String},
//   vout: {String},
//   locktime: {String},
//   tx_id: {String},
//   index: {Number},
//   confirming_header: {Object},
//   intermediate_nodes: {String}
// }
```

#### client.getHeader(block)
* `@param {Hash|Number} block` - block height or hash
* `@returns {Object} header` - header object

Gets header by height or hash.
```js
const client = new BcoinClient(options);
const block = 12345;
const header = client.getHeader(block);

// {
//   raw: {String},
//   hash: {String},
//   height: {Number},
//   prevhash: {String},
//   merkle_root: {String},
// }
```

#### client.getMerkleProof(txid, height)
* `@param {String}` `txid`
* `@param {Number} height`
* `@returns {[][]String, Number}` - a merkle proof and the index of the leaf

 Validate the merkle tree of a block and then compute a merkle proof of inclusion for the txid.

 ```js
const client = new BcoinClient(options);
const height = 12345;
const txid = '3a4324234'
const header = client.getMerkleProof(txid, height);

// merkle proof
// [
//   '8e2d404a039a7a3e1768b161aa23546aab0444b73905bdd3d68b3d6f1769e8c0...',
//   4
// ]
```

#### client.getHeaderChainByCount(height, count, enc)
* `@param {Number} height` - starting block height
* `@param {Number} count` - number of headers
* `@param {String} enc` - 'json' or 'hex' or 'btcspv'
* `@returns {Object}`

Fetch a header chain by count.

```js
const client = new BcoinClient(options);
const height = 12345;
const numOfHeaders = 2;
const encoding = 'hex';
const header = client.getHeaderChainByCount(height, numOfHeaders, encoding);

// headers (hex)
// {
//   headers: '00000020a15e218f5f158a31053ea101b917a6113c807f6bcdc85a000000000000000000cc7cf9eab23c2eae050377375666cd7862c1dfeb81abd3198c3a3f8e045d91484a39225af6d00018659e5e8a0101000000010000000000000000000000000000000000000000000000000000000000000000ffffffff64030096072cfabe6d6d08d1c2f6d904f4e1cd10c6558f8e5aed5d6a89c43bb22862464ebb819dd8813404000000f09f909f104d696e6564206279206a6f73656d7372000000000000000000000000000000000000000000000000000000000000000000007f06000001807c814a000000001976a914c825a1ecf2a6830c4401620c3a16f1995057c2ab88acefebcf38...'
// }
```

```js
const header = client.getHeaderChainByCount(height, numOfHeaders, 'json');

// headers (json)
// {
//   headers: [
//     {
//       "hash": "6f1003edd05cad861395225415160b5236968cc223fe982796b6e959c9651d44",
//       "version": 536870912,
//       "prevBlock": "0c4ea5e675941eca1909275f21903cef755069a03c57c10f4d4dadcdd7146daf",
//       "merkleRoot": "9a249c682aba07943c8a1f9bd774a15d71372fcd7f3f9ee99e8c7aa022ae6aa0",
//       "time": 1571661863,
//       "bits": 545259519,
//       "nonce": 8,
//       "height": 100,
//       "chainwork": "00000000000000000000000000000000000000000000000000000000000000ca"
//     },
//         {
//       "hash": "6f1003edd05cad861395225415160b5236968cc223fe982796b6e959c9651d44",
//       "version": 536870912,
//       "prevBlock": "0c4ea5e675941eca1909275f21903cef755069a03c57c10f4d4dadcdd7146daf",
//       "merkleRoot": "9a249c682aba07943c8a1f9bd774a15d71372fcd7f3f9ee99e8c7aa022ae6aa0",
//       "time": 1571661863,
//       "bits": 545259519,
//       "nonce": 8,
//       "height": 100,
//       "chainwork": "00000000000000000000000000000000000000000000000000000000000000ca"
//     },
//   ]
// }
```
