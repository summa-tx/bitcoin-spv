/**
*
* @file Part of the [bitcoin-spv]{@link https://github.com/summa-tx/bitcoin-spv} project
*
* @title BcoinClient
* @summary bcoin based proof fetcher
* @author Mark Tyneway <mark.tyneway@gmail.com>
* @copyright (c) [Summa]{@link https://summa.one} 2019
* @module clients
*
*/

'use strict';

const {NodeClient} = require('./vendor/bclient');
const assert = require('./vendor/bsert');
const hash256 = require('../vendor/hash256');
const merkle = require('../vendor/merkle');
const {utils, BTCUtils} = require('../../dist');

/**
 * BcoinClient extends the bcoin NodeClient
 * and adds the methods necessary to create
 * the proofs used in this library.
 */
class BcoinClient extends NodeClient {
  /**
   * bcoinclient constructor.
   * @param {object} options
   */
  constructor(options) {
    super(options);
  }

  /**
   * Retrieve a block header.
   * @param {Hash|Number} block
   * @returns {Promise}
   */

  getBlockHeader(block) {
    assert(typeof block === 'string' || typeof block === 'number');
    return this.get(`/header/${block}`);
  }

  /**
   * @params {String} txid - big endian
   */

  async getProof(txid) {
    assert(typeof txid === 'string');

    const tx = await super.getTX(txid);

    if (!tx)
      throw new Error('Cannot find transaction');

    if (tx.height < 0)
      throw new Error('Transaction not confirmed');

    const json = await this.getBlockHeader(tx.height);

    if (!json)
      throw new Error('Cannot find header');

    const header = await this.getHeader(tx.height);

    const txinfo = parseTxHex(tx.hex);

    let [nodes, index] = await this.getMerkleProof(txid, tx.height);

    let path = '';
    for (let node of nodes)
      path += node;

    return {
      version: txinfo.version,
      vin: txinfo.vin,
      vout: txinfo.vout,
      locktime: txinfo.locktime,
      tx_id: txid,
      tx_id_le: reverse(txid),
      index: index,
      confirming_header: header,
      intermediate_nodes: path
    }
  }

  /**
   * Fetch a header by height or hash.
   */

  async getHeader(height) {
    const json = await this.getBlockHeader(height);

    if (!json)
      return null;

    const hex = await this.execute('getblockheader', [json.hash, false]);

    return {
      raw: hex,
      hash: json.hash,
      hash_le: reverse(json.hash),
      height: height,
      prevhash: json.prevBlock,
      merkle_root: json.merkleRoot,
      merkle_root_le: reverse(json.merkleRoot)
    }
  }

  /**
   * Validate the merkle tree of a block and then compute
   * a merkle proof of inclusion for the txid.
   * @param {String} txid
   * @param {Number} height
   * @returns {[][]String, Number} - a merkle proof and the index of the leaf
   */

  async getMerkleProof(txid, height) {
    const block = await super.execute('getblockbyheight', [height]);

    let index = -1;
    const txs = [];
    for (const [i, tx] of Object.entries(block.tx)) {
      if (tx === txid)
        index = i >>> 0; // cast to uint from string
      txs.push(Buffer.from(tx, 'hex').reverse());
    }

    assert(index >= 0, 'Transaction not in block.');

    const [root] = merkle.createRoot(hash256, txs.slice());
    assert.bufferEqual(Buffer.from(block.merkleroot, 'hex').reverse(), root);

    const branch = merkle.createBranch(hash256, index, txs.slice());

    const proof = [];
    for (const hash of branch)
      proof.push(hash.toString('hex'));

    return [proof, index];
  }

  /**
   * Fetch a header chain by count.
   * @param {Number} height - starting block height
   * @param {Number} count - number of headers
   * @param {String} enc - json or hex
   */

  async getHeaderChainByCount(height, count, enc) {
    assert((height >>> 0) === height);
    assert((count >>> 0) === count);

    const headers = [];

    for (let i = 0; i < count; i++) {
      const json = await this.getBlockHeader(height);

      if (!json)
        throw new Error('Cannot find header');

      if (enc === 'json') {
        headers.push(json);
      } else {
        const hex = await this.execute('getblockheader', [json.hash, false]);
        headers.push(hex);
      }
    }

    if (enc === 'hex')
      return {headers: headers.join('')};

    return {headers};
  }
}

module.exports = BcoinClient;

/**
 * Reverse the endianess of a hex string
 */

function reverse(str) {
  return Buffer.from(str, 'hex').reverse().toString('hex');
}

/**
 * Parse a hex transaction into an object
 */

function parseTxHex(hex) {
  const raw = utils.deserializeHex(hex);
  let offset = 0;

  // Handle version
  let version = raw.subarray(offset, offset + 4);
  version = toString(version);

  if (hasWitnessBytes(raw))
    offset += 6;
  else
    offset += 4;

  let inputs = '';
  const vinCount = BTCUtils.determineVarIntDataLength(raw[offset]) || raw[offset];
  inputs += toString(raw.subarray(offset, offset + 1));
  offset += 1;

  // Handle inputs
  for (let i = 0; i < vinCount; i++) {
    // 32 byte hash
    const hash = raw.subarray(offset, offset + 32);
    inputs += toString(hash);
    offset += 32;
    // 32 bit integer
    const index = raw.subarray(offset, offset + 4);
    inputs += toString(index);
    offset += 4;

    // varint script
    const scriptSize = BTCUtils.determineVarIntDataLength(raw[offset]) || raw[offset];
    const varint = raw.subarray(offset, offset + 1);
    inputs += toString(varint);
    offset += 1;

    const script = raw.subarray(offset, offset + scriptSize);
    inputs += toString(script);
    offset += scriptSize;

    // 32 bit sequence
    const sequence = raw.subarray(offset, offset + 4);
    inputs += toString(sequence);
    offset += 4;
  }

  // Handle outputs
  let outputs = '';
  const voutCount = BTCUtils.determineVarIntDataLength(raw[offset]) || raw[offset];
  outputs += toString(raw.subarray(offset, offset + 1));
  offset += 1;

  for (let i = 0; i < voutCount; i++) {
    // value 64 bits
    const value = raw.subarray(offset, offset + 8);
    offset += 8;
    outputs += toString(value);

    // script varbytes
    const scriptSize = BTCUtils.determineVarIntDataLength(raw[offset]) || raw[offset];
    const varint = raw.subarray(offset, offset + 1);
    outputs += toString(varint);
    offset += 1;

    const script = raw.subarray(offset, offset + scriptSize);
    outputs += toString(script);
    offset += scriptSize;
  }

  // Handle locktime
  let locktime = raw.subarray(-4);
  locktime = toString(locktime);

  return {
    version: version,
    vin: inputs,
    vout: outputs,
    locktime: locktime
  }
}

function toString(buf) {
  let str = '';
  for (const uint of buf) {
    let hex = uint.toString(16);
    if (hex.length === 1)
      hex = '0' + hex;
    str += hex;
  }
  return str;
}

function hasWitnessBytes(bytes) {
  return bytes[4] === 0 && bytes[5] !== 0;
}
