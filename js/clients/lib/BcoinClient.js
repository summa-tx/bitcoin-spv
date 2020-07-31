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


const { utils, BTCUtils } = require('@summa-tx/bitcoin-spv-js');
const { NodeClient } = require('./vendor/bclient');
const assert = require('./vendor/bsert');
const hash256 = require('./vendor/hash256');
const merkle = require('./vendor/merkle');
const BN = require('./vendor/bn');

/**
 * BcoinClient extends the bcoin NodeClient
 * and adds the methods necessary to create
 * the proofs used in this library.
 */
class BcoinClient extends NodeClient {
  /**
   * bcoinclient constructor
   * NB: none since constructor doesn't do anything
   * (see: eslint-no-useless-constructor)
   * @param {object} options
   */

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
  * Get the block height of a transaction by txid.
  * Note: requires bcoin tx-indexer enabled.
  * @param {String} txid
  * @returns {Number}
  */
  async getHeightByTX(txid) {
    const tx = await super.getTX(txid);
    if (!tx) {
      return null;
    }

    return tx.height;
  }

  /**
   * @param {String} txid - big endian
   * @returns {Object}
   */

  async getProof(txid) {
    assert(typeof txid === 'string');

    const tx = await super.getTX(txid);

    if (!tx) { throw new Error('Cannot find transaction'); }

    if (tx.height < 0) { throw new Error('Transaction not confirmed'); }

    const json = await this.getBlockHeader(tx.height);

    if (!json) { throw new Error('Cannot find header'); }

    const header = await this.getHeader(tx.height);

    const txinfo = parseTxHex(tx.hex);

    const [nodes, index] = await this.getMerkleProof(txid, tx.height);

    let path = '';

    for (const node of nodes) {
      path += node;
    }

    return {
      version: txinfo.version,
      vin: txinfo.vin,
      vout: txinfo.vout,
      locktime: txinfo.locktime,
      tx_id: reverse(txid),
      index,
      confirming_header: header,
      intermediate_nodes: path
    };
  }

  /**
   * Fetch a header by height or hash.
   * @param {Hash|Number} block block height or hash
   * @returns {Object} header proof object
   */

  async getHeader(block) {
    const json = await this.getBlockHeader(block);

    if (!json) { return null; }

    const hex = await this.execute('getblockheader', [json.hash, false]);

    return {
      raw: hex,
      hash: reverse(json.hash),
      height: typeof block === 'number' ? block : json.height,
      prevhash: reverse(json.prevBlock),
      merkle_root: reverse(json.merkleRoot),
    };
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
      if (tx === txid) { index = i >>> 0; } // cast to uint from string
      txs.push(Buffer.from(tx, 'hex').reverse());
    }

    assert(index >= 0, 'Transaction not in block.');

    const [root] = merkle.createRoot(hash256, txs.slice());
    assert.bufferEqual(Buffer.from(block.merkleroot, 'hex').reverse(), root);

    const branch = merkle.createBranch(hash256, index, txs.slice());

    const proof = [];
    for (const hash of branch) { proof.push(hash.toString('hex')); }

    return [proof, index];
  }

  /**
   * Fetch a header chain by count.
   * @param {Number} height - starting block height
   * @param {Number} count - number of headers
   * @param {String} enc - 'json', 'hex', or 'btcpsv'
   * @returns {Object}
   */

  async getHeaderChainByCount(height, count, enc) {
    assert((height >>> 0) === height);
    assert((count >>> 0) === count);

    const headers = [];

    for (let i = 0; i < count; i++) {
      const next = height + i;
      if (enc === 'btcspv') {
        headers.push(await this.getHeader(next));
      } else {
        const json = await this.getBlockHeader(next);

        if (!json) { throw new Error('Cannot find header'); }

        if (enc === 'json') {
          headers.push(json);
        } else {
          const hex = await this.execute('getblockheader', [json.hash, false]);
          headers.push(hex);
        }
      }
    }

    if (enc === 'hex') {
      return { headers: headers.join('') };
    }

    return { headers };
  }

  /**
   * Get a valid chain of headers starting at a height
   * that have greater than or equal to an amount of work.
   * @param {Number} height
   * @param {String} nwork - hex number
   * @returns {[]String} - a list of hex headers
   */
  async getHeaderChain(height, nwork) {
    const headers = [];
    let accumulated = new BN(0);

    const target = new BN(nwork, 16, 'be');

    if (target.eq(new BN(0))) {
      throw new Error('nwork is too small.');
    }

    while (accumulated.lte(target)) {
      const json = await super.getBlock(height);
      const block = Block.fromJSON(json);
      const header = block.toHeaders();

      const valid = consensus.verifyPOW(block.hash(), block.bits);
      assert(valid, 'Invalid Proof of Work.');

      headers.push(header.toRaw().toString('hex'));

      const entry = ChainEntry.fromBlock(block);
      const proof = entry.getProof();

      accumulated = accumulated.add(proof);
      height += 1;
    }

    return headers;
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

  if (hasWitnessBytes(raw)) { offset += 6; } else { offset += 4; }

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
    version,
    vin: inputs,
    vout: outputs,
    locktime
  };
}

function toString(buf) {
  let str = '';
  for (const uint of buf) {
    let hex = uint.toString(16);
    if (hex.length === 1) { hex = `0${hex}`; }
    str += hex;
  }
  return str;
}

function hasWitnessBytes(bytes) {
  return bytes[4] === 0 && bytes[5] !== 0;
}
