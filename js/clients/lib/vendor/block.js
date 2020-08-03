/*!
 * block.js - block object for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('./bsert');
const bio = require('./bufio');
const hash256 = require('./hash256');
const merkle = require('./merkle');
const AbstractBlock = require('./abstractblock');
const Headers = require('./headers');
const TX = require('./tx');
const util = require('./util');
const {encoding} = bio;

/**
 * Block
 * Represents a full block.
 * @alias module:primitives.Block
 * @extends AbstractBlock
 */

class Block extends AbstractBlock {
  /**
   * Create a block.
   * @constructor
   * @param {Object} options
   */

  constructor(options) {
    super();

    this.txs = [];

    this._raw = null;
    this._size = -1;
    this._witness = -1;

    if (options)
      this.fromOptions(options);
  }

  /**
   * Inject properties from options object.
   * @private
   * @param {Object} options
   */

  fromOptions(options) {
    this.parseOptions(options);

    if (options.txs) {
      assert(Array.isArray(options.txs));
      for (const tx of options.txs) {
        assert(tx instanceof TX);
        this.txs.push(tx);
      }
    }

    return this;
  }

  /**
   * Instantiate block from options.
   * @param {Object} options
   * @returns {Block}
   */

  static fromOptions(options) {
    return new this().fromOptions(options);
  }

  /**
   * Clear any cached values.
   * @param {Boolean?} all - Clear transactions.
   */

  refresh(all) {
    this._refresh();

    this._raw = null;
    this._size = -1;
    this._witness = -1;

    if (!all)
      return this;

    for (const tx of this.txs)
      tx.refresh();

    return this;
  }

  /**
   * Serialize the block. Include witnesses if present.
   * @returns {Buffer}
   */

  toRaw() {
    return this.frame().data;
  }

  /**
   * Serialize the block, do not include witnesses.
   * @returns {Buffer}
   */

  toNormal() {
    if (this.hasWitness())
      return this.frameNormal().data;
    return this.toRaw();
  }

  /**
   * Serialize the block. Include witnesses if present.
   * @param {BufferWriter} bw
   */

  toWriter(bw) {
    if (this.mutable)
      return this.writeWitness(bw);

    const raw = this.frame();
    bw.writeBytes(raw.data);

    return bw;
  }

  /**
   * Serialize the block, do not include witnesses.
   * @param {BufferWriter} bw
   */

  toNormalWriter(bw) {
    if (this.hasWitness()) {
      this.writeNormal(bw);
      return bw;
    }
    return this.toWriter(bw);
  }

  /**
   * Get the raw block serialization.
   * Include witnesses if present.
   * @private
   * @returns {RawBlock}
   */

  frame() {
    if (this.mutable) {
      assert(!this._raw);
      return this.frameWitness();
    }

    if (this._raw) {
      assert(this._size >= 0);
      assert(this._witness >= 0);
      const raw = new RawBlock(this._size, this._witness);
      raw.data = this._raw;
      return raw;
    }

    const raw = this.frameWitness();

    this._raw = raw.data;
    this._size = raw.size;
    this._witness = raw.witness;

    return raw;
  }

  /**
   * Test the block's transaction vector against a hash.
   * @param {Hash} hash
   * @returns {Boolean}
   */

  hasTX(hash) {
    return this.indexOf(hash) !== -1;
  }

  /**
   * Find the index of a transaction in the block.
   * @param {Hash} hash
   * @returns {Number} index (-1 if not present).
   */

  indexOf(hash) {
    for (let i = 0; i < this.txs.length; i++) {
      const tx = this.txs[i];
      if (tx.hash().equals(hash))
        return i;
    }

    return -1;
  }

  /**
   * Calculate merkle root. Returns null
   * if merkle tree has been malleated.
   * @param {String?} enc - Encoding, can be `'hex'` or null.
   * @returns {Hash|null}
   */

  createMerkleRoot(enc) {
    const leaves = [];

    for (const tx of this.txs)
      leaves.push(tx.hash());

    const [root, malleated] = merkle.createRoot(hash256, leaves);

    if (malleated)
      return null;

    return enc === 'hex' ? root.toString('hex') : root;
  }

  /**
   * Retrieve the merkle root from the block header.
   * @param {String?} enc
   * @returns {Hash}
   */

  getMerkleRoot(enc) {
    if (enc === 'hex')
      return this.merkleRoot.toString('hex');
    return this.merkleRoot;
  }

  /**
   * Convert the block to an object suitable
   * for JSON serialization.
   * @returns {Object}
   */

  toJSON() {
    return this.getJSON();
  }

  /**
   * Convert the block to an object suitable
   * for JSON serialization. Note that the hashes
   * will be reversed to abide by bitcoind's legacy
   * of little-endian uint256s.
   * @param {Network} network
   * @param {CoinView} view
   * @param {Number} height
   * @param {Number} depth
   * @returns {Object}
   */

  getJSON(network, view, height, depth) {
    return {
      hash: this.rhash(),
      height: height,
      depth: depth,
      version: this.version,
      prevBlock: util.revHex(this.prevBlock),
      merkleRoot: util.revHex(this.merkleRoot),
      time: this.time,
      bits: this.bits,
      nonce: this.nonce,
      txs: this.txs.map((tx, i) => {
        return tx.getJSON(network, view, null, i);
      })
    };
  }

  /**
   * Inject properties from json object.
   * @private
   * @param {Object} json
   */

  fromJSON(json) {
    assert(json, 'Block data is required.');
    assert(Array.isArray(json.txs));

    this.parseJSON(json);

    for (const tx of json.txs)
      this.txs.push(TX.fromJSON(tx));

    return this;
  }

  /**
   * Instantiate a block from a jsonified block object.
   * @param {Object} json - The jsonified block object.
   * @returns {Block}
   */

  static fromJSON(json) {
    return new this().fromJSON(json);
  }

  /**
   * Inject properties from serialized data.
   * @private
   * @param {Buffer} data
   */

  fromReader(br) {
    br.start();

    this.readHead(br);

    const count = br.readVarint();
    let witness = 0;

    for (let i = 0; i < count; i++) {
      const tx = TX.fromReader(br, true);
      witness += tx._witness;
      this.txs.push(tx);
    }

    if (!this.mutable) {
      this._raw = br.endData();
      this._size = this._raw.length;
      this._witness = witness;
    }

    return this;
  }

  /**
   * Inject properties from serialized data.
   * @private
   * @param {Buffer} data
   */

  fromRaw(data) {
    return this.fromReader(bio.read(data));
  }

  /**
   * Instantiate a block from a serialized Buffer.
   * @param {Buffer} data
   * @param {String?} enc - Encoding, can be `'hex'` or null.
   * @returns {Block}
   */

  static fromReader(data) {
    return new this().fromReader(data);
  }

  /**
   * Instantiate a block from a serialized Buffer.
   * @param {Buffer} data
   * @param {String?} enc - Encoding, can be `'hex'` or null.
   * @returns {Block}
   */

  static fromRaw(data, enc) {
    if (typeof data === 'string')
      data = Buffer.from(data, enc);
    return new this().fromRaw(data);
  }

  /**
   * Serialze block with or without witness data.
   * @private
   * @param {Boolean} witness
   * @param {BufferWriter?} writer
   * @returns {Buffer}
   */

  writeNormal(bw) {
    this.writeHead(bw);

    bw.writeVarint(this.txs.length);

    for (const tx of this.txs)
      tx.toNormalWriter(bw);

    return bw;
  }

  /**
   * Serialze block with or without witness data.
   * @private
   * @param {Boolean} witness
   * @param {BufferWriter?} writer
   * @returns {Buffer}
   */

  writeWitness(bw) {
    this.writeHead(bw);

    bw.writeVarint(this.txs.length);

    for (const tx of this.txs)
      tx.toWriter(bw, true);

    return bw;
  }

  /**
   * Serialze block with or without witness data.
   * @private
   * @param {Boolean} witness
   * @param {BufferWriter?} writer
   * @returns {Buffer}
   */

  frameNormal() {
    const raw = this.getNormalSizes();
    const bw = bio.write(raw.size);
    this.writeNormal(bw);
    raw.data = bw.render();
    return raw;
  }

  /**
   * Serialze block without witness data.
   * @private
   * @param {BufferWriter?} writer
   * @returns {Buffer}
   */

  frameWitness() {
    const raw = this.getWitnessSizes();
    const bw = bio.write(raw.size);
    this.writeWitness(bw);
    raw.data = bw.render();
    return raw;
  }

  /**
   * Convert the block to a headers object.
   * @returns {Headers}
   */

  toHeaders() {
    return Headers.fromBlock(this);
  }

  /**
   * Get real block size without witness.
   * @returns {RawBlock}
   */

  getNormalSizes() {
    let size = 0;

    size += 80;
    size += encoding.sizeVarint(this.txs.length);

    for (const tx of this.txs)
      size += tx.getBaseSize();

    return new RawBlock(size, 0);
  }

  /**
   * Get real block size with witness.
   * @returns {RawBlock}
   */

  getWitnessSizes() {
    let size = 0;
    let witness = 0;

    size += 80;
    size += encoding.sizeVarint(this.txs.length);

    for (const tx of this.txs) {
      const raw = tx.getSizes();
      size += raw.size;
      witness += raw.witness;
    }

    return new RawBlock(size, witness);
  }

  /**
   * Test whether an object is a Block.
   * @param {Object} obj
   * @returns {Boolean}
   */

  static isBlock(obj) {
    return obj instanceof Block;
  }
}

/*
 * Helpers
 */

class RawBlock {
  constructor(size, witness) {
    this.data = null;
    this.size = size;
    this.witness = witness;
  }
}

/*
 * Expose
 */

module.exports = Block;
