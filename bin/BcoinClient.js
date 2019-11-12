/*!
 * BcoinClient.js - bcoin based proof fetcher
 * Copyright (c) 2019, Mark Tyneway (Apache-2.0 License).
 * https://github.com/summa-tx/agoric-bitcoin-spv
 */

'use strict';

const {NodeClient} = require('bcoin/lib/client');
const assert = require('bsert');
const TX = require('bcoin/lib/primitives/tx');
const Block = require('bcoin/lib/primitives/block')
const ChainEntry = require('bcoin/lib/blockchain/chainentry');
const Amount = require('bcoin/lib/btc/amount');
const Headers = require('bcoin/lib/primitives/headers');
const consensus = require('bcoin/lib/protocol/consensus');
const hash256 = require('bcrypto/lib/hash256');
const {merkle} = require('bcrypto');
const BN = require('bcrypto/lib/bn.js');
const {utils} = require('@summa-tx/bitcoin-spv-js')

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
   * @params {String} txid - big endian
   * @params {Number} count
   */

  async getProof(txid, enc) {
    assert(typeof txid === 'string');

    const tx = await super.getTX(txid);

    if (!tx)
      throw new Error('Cannot find transaction');

    if (tx.height < 0)
      throw new Error('Transaction not confirmed');

    const json = await super.getBlockHeader(tx.height);

    if (!json)
      throw new Error('Cannot find header');

    const header = await this.getHeader(tx.height, enc);
    const txinfo = parseBcoinTx(tx.hex);

    let [nodes, index] = await this.getMerkleProof(txid, tx.height);

    let path = '';
    for (let node of nodes)
      path += node;

    if (enc === 'hex') {
      return {
        version: Buffer.from(txinfo.version).toString('hex'),
        vin: Buffer.from(txinfo.vin).toString('hex'),
        vout: Buffer.from(txinfo.vout).toString('hex'),
        locktime: Buffer.from(txinfo.locktime).toString('hex'),
        tx_id: txid,
        tx_id_le: reverse(txid),
        index: index,
        confirming_header: header,
        intermediate_nodes: path
      }
    }

    return {
      version: txinfo.version,
      vin: txinfo.vin,
      vout: txinfo.vout,
      locktime: txinfo.locktime,
      tx_id: utils.deserializeHex(txid),
      tx_id_le: utils.deserializeHex(reverse(txid)),
      index: index,
      confirming_header: header,
      intermediate_nodes: utils.deserializeHex(path)
    }
  }

  async getHeader(height, enc) {
    const json = await super.getBlockHeader(height);

    if (!json)
      return null;

    const header = Headers.fromJSON(json);

    if (enc === 'hex' || enc === 'json') {
      return {
        raw: header.toRaw().slice(0, 80).toString('hex'),
        hash: json.hash,
        hash_le: reverse(json.hash),
        height: height,
        prevhash: json.prevBlock,
        merkle_root: json.merkleRoot,
        merkle_root_le: reverse(json.merkleRoot)
      }
    }

    return {
      raw: utils.deserializeHex(header.toRaw().slice(0, 80).toString('hex')),
      hash: utils.deserializeHex(header.hash().reverse().toString('hex')),
      hash_le: utils.deserializeHex(header.hash().toString('hex')),
      height: height,
      prevhash: utils.deserializeHex(header.prevBlock.reverse().toString('hex')),
      merkle_root: utils.deserializeHex(header.merkleRoot.reverse().toString('hex')),
      merkle_root_le: utils.deserializeHex(header.merkleRoot.toString('hex')),
    }
  }

  async getHeaders(height, count, enc) {
    const headers = [];
    const rawHeaders = [];

    for (let i = 0; i < count; i++) {
      const header = await this.getHeader(height + i, enc);

      if (!header)
        return headers;

      headers.push(header);
    }

    if (enc === 'hex')
      return headers.join('');

    if (enc === 'raw')
      return new Uint8Array(headers.join(''));

    return headers;
  }

  async getHeadersByWork(height, nwork, enc) {
    const headers = [];
    let accumulated = new BN(0);

    if(!(nwork instanceof BN))
      nwork = new BN(nwork);

    if (nwork.eq(new BN(0)))
      throw new Error('nwork is too small.');

    while (accumulated.lte(nwork)) {
      const json = await super.getBlockHeader(height);
      const header = Headers.fromJSON(json);

      const entry = ChainEntry.fromBlock(header)
      const proof = entry.getProof();

      accumulated.iadd(proof);
      height += 1;

      if (enc === 'json') {
        const spv = await this.getHeader(height, 'hex');
        headers.push(spv);
      } else {
        headers.push(header.toRaw().toString('hex'));
      }
    }

    if (enc === 'hex')
      return headers.join('');

    return headers;
  }

  /**
   *
   * @param {}
   * @returns {}
   */

  async getHeadersByCurrency(height, budget, unit, enc) {
    const headers = [];
    let total = new BN(0);

    if(!(budget instanceof BN))
      budget = new BN(budget);

    if(!(unit instanceof BN))
      unit = new BN(unit);

    while (total.lte(budget)) {
      const json = await super.getBlock(height);

      if (!json)
        throw new Error(`Cannot query block ${height}`);

      const coinbase = json.txs[0];
      // satoshis
      const value = coinbase.outputs[0].value;
      // bitcoin
      let cost = Amount.fromSatoshis(value);
      cost = new BN(parseInt(cost.toBTC(), 10));
      cost.imul(unit);

      // stop one before it goes over
      const next = total.add(cost);
      if (next.gt(budget))
        break;

      total.iadd(cost);
      height++;

      if (enc === 'json') {
        const spv = await this.getHeader(height, 'hex');
        headers.push(spv);
      } else {
        const header = Headers.fromJSON(json);
        headers.push(header.toRaw().toString('hex'));
      }
    }

    if (enc === 'hex')
      return headers.join('');

    return headers;
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

  async getHeaderChainByCount(height, count, enc) {
    assert((height >>> 0) === height);
    assert((count >>> 0) === count);

    const headers = [];

    for (let i = 0; i < count; i++) {
      const json = await super.getBlockHeader(height);

      if (!json)
        throw new Error('Cannot find header');

      const header = Headers.fromJSON(json);

      if (enc === 'json') {
        headers.push(header);
      } else {
        const hex = header.toRaw().toString('hex');
        headers.push(hex);
      }
    }

    if (enc === 'hex')
      return headers.join('');

    if (enc === 'raw')
      return new Uint8Array(headers.join(''));

    return headers;
  }
}

module.exports = BcoinClient;

/**
 * This will be useful for moving off
 * of depending on bcoin
 */
function parseBcoinTx(hex) {
  if (typeof hex !== 'string') {
    throw new Error('Must pass string')
  }

  const tx = TX.fromRaw(hex, 'hex');

  if (tx.inputs.length > 253 || tx.outputs.length > 253) {
    throw RangeError('too many ins/outs');
  }

  const raw = tx.toRaw();
  // version and witness flag if any
  const baseOffset = raw[4] === 0 ? 6 : 4;

  const vinBytes = 1 + tx.inputs.reduce((a, b) => a + b.getSize(), 0);
  const voutBytes = 1 + tx.outputs.reduce((a, b) => a + b.getSize(), 0);

  return {
    version: new Uint8Array(raw.subarray(0, 4)),
    vin: new Uint8Array(raw.subarray(baseOffset, baseOffset + vinBytes)),
    vout: new Uint8Array(raw.subarray(baseOffset + vinBytes, baseOffset + vinBytes + voutBytes)),
    locktime: new Uint8Array(raw.subarray(-4))
  };
}

/**
 * Reverse the endianess of a hex string
 */

function reverse(str) {
  return Buffer.from(str, 'hex').reverse().toString('hex');
}
