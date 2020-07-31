/*!
 * tx.js - transaction object for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('./bsert');
const bio = require('./bufio');
const hash256 = require('./hash256');
const util = require('./util');

const Input = require('./input');
const Output = require('./output');
const Outpoint = require('./outpoint');

const consensus = require('./consensus');
const {encoding} = bio;

/**
 * TX
 * A static transaction object.
 * @alias module:primitives.TX
 * @property {Number} version
 * @property {Input[]} inputs
 * @property {Output[]} outputs
 * @property {Number} locktime
 */

class TX {
  /**
   * Create a transaction.
   * @constructor
   * @param {Object?} options
   */

  constructor(options) {
    this.version = 1;
    this.inputs = [];
    this.outputs = [];
    this.locktime = 0;

    this.mutable = false;

    this._hash = null;
    this._hhash = null;
    this._whash = null;

    this._raw = null;
    this._offset = -1;
    this._block = false;
    this._size = -1;
    this._witness = -1;
    this._sigops = -1;

    this._hashPrevouts = null;
    this._hashSequence = null;
    this._hashOutputs = null;

    if (options)
      this.fromOptions(options);
  }

  /**
   * Inject properties from options object.
   * @private
   * @param {Object} options
   */

  fromOptions(options) {
    assert(options, 'TX data is required.');

    if (options.version != null) {
      assert((options.version >>> 0) === options.version,
        'Version must be a uint32.');
      this.version = options.version;
    }

    if (options.inputs) {
      assert(Array.isArray(options.inputs), 'Inputs must be an array.');
      for (const input of options.inputs)
        this.inputs.push(new Input(input));
    }

    if (options.outputs) {
      assert(Array.isArray(options.outputs), 'Outputs must be an array.');
      for (const output of options.outputs)
        this.outputs.push(new Output(output));
    }

    if (options.locktime != null) {
      assert((options.locktime >>> 0) === options.locktime,
        'Locktime must be a uint32.');
      this.locktime = options.locktime;
    }

    return this;
  }

  /**
   * Instantiate TX from options object.
   * @param {Object} options
   * @returns {TX}
   */

  static fromOptions(options) {
    return new this().fromOptions(options);
  }

  /**
   * Clone the transaction.
   * @returns {TX}
   */

  clone() {
    return new this.constructor().inject(this);
  }

  /**
   * Inject properties from tx.
   * Used for cloning.
   * @private
   * @param {TX} tx
   * @returns {TX}
   */

  inject(tx) {
    this.version = tx.version;

    for (const input of tx.inputs)
      this.inputs.push(input.clone());

    for (const output of tx.outputs)
      this.outputs.push(output.clone());

    this.locktime = tx.locktime;

    return this;
  }

  /**
   * Clear any cached values.
   */

  refresh() {
    this._hash = null;
    this._hhash = null;
    this._whash = null;

    this._raw = null;
    this._size = -1;
    this._offset = -1;
    this._block = false;
    this._witness = -1;
    this._sigops = -1;

    this._hashPrevouts = null;
    this._hashSequence = null;
    this._hashOutputs = null;
  }

  /**
   * Hash the transaction with the non-witness serialization.
   * @param {String?} enc - Can be `'hex'` or `null`.
   * @returns {Hash|Buffer} hash
   */

  hash(enc) {
    let h = this._hash;

    if (!h) {
      h = hash256.digest(this.toNormal());
      if (!this.mutable)
        this._hash = h;
    }

    if (enc === 'hex') {
      let hex = this._hhash;
      if (!hex) {
        hex = h.toString('hex');
        if (!this.mutable)
          this._hhash = hex;
      }
      h = hex;
    }

    return h;
  }

  /**
   * Hash the transaction with the witness
   * serialization, return the wtxid (normal
   * hash if no witness is present, all zeroes
   * if coinbase).
   * @param {String?} enc - Can be `'hex'` or `null`.
   * @returns {Hash|Buffer} hash
   */

  witnessHash(enc) {
    if (!this.hasWitness())
      return this.hash(enc);

    let hash = this._whash;

    if (!hash) {
      hash = hash256.digest(this.toRaw());
      if (!this.mutable)
        this._whash = hash;
    }

    return enc === 'hex' ? hash.toString('hex') : hash;
  }

  /**
   * Serialize the transaction. Note
   * that this is cached. This will use
   * the witness serialization if a
   * witness is present.
   * @returns {Buffer} Serialized transaction.
   */

  toRaw() {
    return this.frame().data;
  }

  /**
   * Serialize the transaction without the
   * witness vector, regardless of whether it
   * is a witness transaction or not.
   * @returns {Buffer} Serialized transaction.
   */

  toNormal() {
    if (this.hasWitness())
      return this.frameNormal().data;
    return this.toRaw();
  }

  /**
   * Write the transaction to a buffer writer.
   * @param {BufferWriter} bw
   * @param {Boolean} block
   */

  toWriter(bw, block) {
    if (this.mutable) {
      if (this.hasWitness())
        return this.writeWitness(bw);
      return this.writeNormal(bw);
    }

    if (block) {
      this._offset = bw.offset;
      this._block = true;
    }

    bw.writeBytes(this.toRaw());

    return bw;
  }

  /**
   * Write the transaction to a buffer writer.
   * Uses non-witness serialization.
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
   * Serialize the transaction. Note
   * that this is cached. This will use
   * the witness serialization if a
   * witness is present.
   * @private
   * @returns {RawTX}
   */

  frame() {
    if (this.mutable) {
      assert(!this._raw);
      if (this.hasWitness())
        return this.frameWitness();
      return this.frameNormal();
    }

    if (this._raw) {
      assert(this._size >= 0);
      assert(this._witness >= 0);
      const raw = new RawTX(this._size, this._witness);
      raw.data = this._raw;
      return raw;
    }

    let raw;
    if (this.hasWitness())
      raw = this.frameWitness();
    else
      raw = this.frameNormal();

    this._raw = raw.data;
    this._size = raw.size;
    this._witness = raw.witness;

    return raw;
  }

  /**
   * Calculate total size and size of the witness bytes.
   * @returns {Object} Contains `size` and `witness`.
   */

  getSizes() {
    if (this.mutable) {
      if (this.hasWitness())
        return this.getWitnessSizes();
      return this.getNormalSizes();
    }
    return this.frame();
  }

  /**
   * Calculate the virtual size of the transaction.
   * Note that this is cached.
   * @returns {Number} vsize
   */

  getVirtualSize() {
    const scale = consensus.WITNESS_SCALE_FACTOR;
    return (this.getWeight() + scale - 1) / scale | 0;
  }

  /**
   * Calculate the weight of the transaction.
   * Note that this is cached.
   * @returns {Number} weight
   */

  getWeight() {
    const raw = this.getSizes();
    const base = raw.size - raw.witness;
    return base * (consensus.WITNESS_SCALE_FACTOR - 1) + raw.size;
  }

  /**
   * Calculate the real size of the transaction
   * with the witness included.
   * @returns {Number} size
   */

  getSize() {
    return this.getSizes().size;
  }

  /**
   * Calculate the size of the transaction
   * without the witness.
   * with the witness included.
   * @returns {Number} size
   */

  getBaseSize() {
    const raw = this.getSizes();
    return raw.size - raw.witness;
  }

  /**
   * Test whether the transaction has a non-empty witness.
   * @returns {Boolean}
   */

  hasWitness() {
    if (this._witness !== -1)
      return this._witness !== 0;

    for (const input of this.inputs) {
      if (input.witness.items.length > 0)
        return true;
    }

    return false;
  }

  /**
   * Test whether the transaction is a coinbase
   * by examining the inputs.
   * @returns {Boolean}
   */

  isCoinbase() {
    return this.inputs.length === 1 && this.inputs[0].prevout.isNull();
  }

  /**
   * Test whether the transaction is replaceable.
   * @returns {Boolean}
   */

  isRBF() {
    // Core doesn't do this, but it should:
    if (this.version === 2)
      return false;

    for (const input of this.inputs) {
      if (input.isRBF())
        return true;
    }

    return false;
  }

  /**
   * Calculate the total output value.
   * @returns {Amount} value
   */

  getOutputValue() {
    let total = 0;

    for (const output of this.outputs)
      total += output.value;

    return total;
  }

  /**
   * Check finality of transaction by examining
   * nLocktime and nSequence values.
   * @example
   * tx.isFinal(chain.height + 1, network.now());
   * @param {Number} height - Height at which to test. This
   * is usually the chain height, or the chain height + 1
   * when the transaction entered the mempool.
   * @param {Number} time - Time at which to test. This is
   * usually the chain tip's parent's median time, or the
   * time at which the transaction entered the mempool. If
   * MEDIAN_TIME_PAST is enabled this will be the median
   * time of the chain tip's previous entry's median time.
   * @returns {Boolean}
   */

  isFinal(height, time) {
    const THRESHOLD = consensus.LOCKTIME_THRESHOLD;

    if (this.locktime === 0)
      return true;

    if (this.locktime < (this.locktime < THRESHOLD ? height : time))
      return true;

    for (const input of this.inputs) {
      if (input.sequence !== 0xffffffff)
        return false;
    }

    return true;
  }

  /**
   * Verify the absolute locktime of a transaction.
   * Called by OP_CHECKLOCKTIMEVERIFY.
   * @param {Number} index - Index of input being verified.
   * @param {Number} predicate - Locktime to verify against.
   * @returns {Boolean}
   */

  verifyLocktime(index, predicate) {
    const THRESHOLD = consensus.LOCKTIME_THRESHOLD;
    const input = this.inputs[index];

    assert(input, 'Input does not exist.');
    assert(predicate >= 0, 'Locktime must be non-negative.');

    // Locktimes must be of the same type (blocks or seconds).
    if ((this.locktime < THRESHOLD) !== (predicate < THRESHOLD))
      return false;

    if (predicate > this.locktime)
      return false;

    if (input.sequence === 0xffffffff)
      return false;

    return true;
  }

  /**
   * Verify the relative locktime of an input.
   * Called by OP_CHECKSEQUENCEVERIFY.
   * @param {Number} index - Index of input being verified.
   * @param {Number} predicate - Relative locktime to verify against.
   * @returns {Boolean}
   */

  verifySequence(index, predicate) {
    const DISABLE_FLAG = consensus.SEQUENCE_DISABLE_FLAG;
    const TYPE_FLAG = consensus.SEQUENCE_TYPE_FLAG;
    const MASK = consensus.SEQUENCE_MASK;
    const input = this.inputs[index];

    assert(input, 'Input does not exist.');
    assert(predicate >= 0, 'Locktime must be non-negative.');

    // For future softfork capability.
    if (predicate & DISABLE_FLAG)
      return true;

    // Version must be >=2.
    if (this.version < 2)
      return false;

    // Cannot use the disable flag without
    // the predicate also having the disable
    // flag (for future softfork capability).
    if (input.sequence & DISABLE_FLAG)
      return false;

    // Locktimes must be of the same type (blocks or seconds).
    if ((input.sequence & TYPE_FLAG) !== (predicate & TYPE_FLAG))
      return false;

    if ((predicate & MASK) > (input.sequence & MASK))
      return false;

    return true;
  }

  /**
   * Get little-endian tx hash.
   * @returns {Hash}
   */

  rhash() {
    return util.revHex(this.hash());
  }

  /**
   * Get little-endian wtx hash.
   * @returns {Hash}
   */

  rwhash() {
    return util.revHex(this.witnessHash());
  }

  /**
   * Get little-endian tx hash.
   * @returns {Hash}
   */

  txid() {
    return this.rhash();
  }

  /**
   * Get little-endian wtx hash.
   * @returns {Hash}
   */

  wtxid() {
    return this.rwhash();
  }

  /**
   * Convert the transaction to an object suitable
   * for JSON serialization.
   * @returns {Object}
   */

  toJSON() {
    return this.getJSON();
  }

  /**
   * Convert the transaction to an object suitable
   * for JSON serialization. Note that the hashes
   * will be reversed to abide by bitcoind's legacy
   * of little-endian uint256s.
   * @param {Network} network
   * @param {CoinView} view
   * @param {ChainEntry} entry
   * @param {Number} index
   * @returns {Object}
   */

  getJSON(network, view, entry, index) {
    let rate, fee, height, block, time, date;

    if (view) {
      fee = this.getFee(view);
      rate = this.getRate(view);

      // Rate can exceed 53 bits in testing.
      if (!Number.isSafeInteger(rate))
        rate = 0;
    }

    if (entry) {
      height = entry.height;
      block = util.revHex(entry.hash);
      time = entry.time;
      date = util.date(time);
    }

    network = null;

    return {
      hash: this.txid(),
      witnessHash: this.wtxid(),
      fee: fee,
      rate: rate,
      mtime: util.now(),
      height: height,
      block: block,
      time: time,
      date: date,
      index: index,
      version: this.version,
      inputs: this.inputs.map((input) => {
        const coin = view ? view.getCoinFor(input) : null;
        return input.getJSON(network, coin);
      }),
      outputs: this.outputs.map((output) => {
        return output.getJSON(network);
      }),
      locktime: this.locktime,
      hex: this.toRaw().toString('hex')
    };
  }

  /**
   * Inject properties from a json object.
   * @private
   * @param {Object} json
   */

  fromJSON(json) {
    assert(json, 'TX data is required.');
    assert((json.version >>> 0) === json.version, 'Version must be a uint32.');
    assert(Array.isArray(json.inputs), 'Inputs must be an array.');
    assert(Array.isArray(json.outputs), 'Outputs must be an array.');
    assert((json.locktime >>> 0) === json.locktime,
      'Locktime must be a uint32.');

    this.version = json.version;

    for (const input of json.inputs)
      this.inputs.push(Input.fromJSON(input));

    for (const output of json.outputs)
      this.outputs.push(Output.fromJSON(output));

    this.locktime = json.locktime;

    return this;
  }

  /**
   * Instantiate a transaction from a
   * jsonified transaction object.
   * @param {Object} json - The jsonified transaction object.
   * @returns {TX}
   */

  static fromJSON(json) {
    return new this().fromJSON(json);
  }

  /**
   * Instantiate a transaction from a serialized Buffer.
   * @param {Buffer} data
   * @param {String?} enc - Encoding, can be `'hex'` or null.
   * @returns {TX}
   */

  static fromRaw(data, enc) {
    if (typeof data === 'string')
      data = Buffer.from(data, enc);
    return new this().fromRaw(data);
  }

  /**
   * Instantiate a transaction from a buffer reader.
   * @param {BufferReader} br
   * @param {Boolean} block
   * @returns {TX}
   */

  static fromReader(br, block) {
    return new this().fromReader(br, block);
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
   * Inject properties from buffer reader.
   * @private
   * @param {BufferReader} br
   * @param {Boolean} block
   */

  fromReader(br, block) {
    if (hasWitnessBytes(br))
      return this.fromWitnessReader(br, block);

    const start = br.start();

    this.version = br.readU32();

    const inCount = br.readVarint();

    for (let i = 0; i < inCount; i++)
      this.inputs.push(Input.fromReader(br));

    const outCount = br.readVarint();

    for (let i = 0; i < outCount; i++)
      this.outputs.push(Output.fromReader(br));

    this.locktime = br.readU32();

    if (block) {
      this._offset = start;
      this._block = true;
    }

    if (!this.mutable) {
      this._raw = br.endData();
      this._size = this._raw.length;
      this._witness = 0;
    } else {
      br.end();
    }

    return this;
  }

  /**
   * Inject properties from serialized
   * buffer reader (witness serialization).
   * @private
   * @param {BufferReader} br
   * @param {Boolean} block
   */

  fromWitnessReader(br, block) {
    const start = br.start();

    this.version = br.readU32();

    assert(br.readU8() === 0, 'Non-zero marker.');

    let flags = br.readU8();

    assert(flags !== 0, 'Flags byte is zero.');

    const inCount = br.readVarint();

    for (let i = 0; i < inCount; i++)
      this.inputs.push(Input.fromReader(br));

    const outCount = br.readVarint();

    for (let i = 0; i < outCount; i++)
      this.outputs.push(Output.fromReader(br));

    let witness = 0;
    let hasWitness = false;

    if (flags & 1) {
      flags ^= 1;

      witness = br.offset;

      for (const input of this.inputs) {
        input.witness.fromReader(br);
        if (input.witness.items.length > 0)
          hasWitness = true;
      }

      witness = (br.offset - witness) + 2;
    }

    if (flags !== 0)
      throw new Error('Unknown witness flag.');

    // We'll never be able to reserialize
    // this to get the regular txid, and
    // there's no way it's valid anyway.
    if (this.inputs.length === 0 && this.outputs.length !== 0)
      throw new Error('Zero input witness tx.');

    this.locktime = br.readU32();

    if (block) {
      this._offset = start;
      this._block = true;
    }

    if (!this.mutable && hasWitness) {
      this._raw = br.endData();
      this._size = this._raw.length;
      this._witness = witness;
    } else {
      br.end();
    }

    return this;
  }

  /**
   * Serialize transaction without witness.
   * @private
   * @returns {RawTX}
   */

  frameNormal() {
    const raw = this.getNormalSizes();
    const bw = bio.write(raw.size);
    this.writeNormal(bw);
    raw.data = bw.render();
    return raw;
  }

  /**
   * Serialize transaction with witness. Calculates the witness
   * size as it is framing (exposed on return value as `witness`).
   * @private
   * @returns {RawTX}
   */

  frameWitness() {
    const raw = this.getWitnessSizes();
    const bw = bio.write(raw.size);
    this.writeWitness(bw);
    raw.data = bw.render();
    return raw;
  }

  /**
   * Serialize transaction without witness.
   * @private
   * @param {BufferWriter} bw
   * @returns {RawTX}
   */

  writeNormal(bw) {
    if (this.inputs.length === 0 && this.outputs.length !== 0)
      throw new Error('Cannot serialize zero-input tx.');

    bw.writeU32(this.version);

    bw.writeVarint(this.inputs.length);

    for (const input of this.inputs)
      input.toWriter(bw);

    bw.writeVarint(this.outputs.length);

    for (const output of this.outputs)
      output.toWriter(bw);

    bw.writeU32(this.locktime);

    return bw;
  }

  /**
   * Serialize transaction with witness. Calculates the witness
   * size as it is framing (exposed on return value as `witness`).
   * @private
   * @param {BufferWriter} bw
   * @returns {RawTX}
   */

  writeWitness(bw) {
    if (this.inputs.length === 0 && this.outputs.length !== 0)
      throw new Error('Cannot serialize zero-input tx.');

    bw.writeU32(this.version);
    bw.writeU8(0);
    bw.writeU8(1);

    bw.writeVarint(this.inputs.length);

    for (const input of this.inputs)
      input.toWriter(bw);

    bw.writeVarint(this.outputs.length);

    for (const output of this.outputs)
      output.toWriter(bw);

    const start = bw.offset;

    for (const input of this.inputs)
      input.witness.toWriter(bw);

    const witness = bw.offset - start;

    bw.writeU32(this.locktime);

    if (witness === this.inputs.length)
      throw new Error('Cannot serialize empty-witness tx.');

    return bw;
  }

  /**
   * Calculate the real size of the transaction
   * without the witness vector.
   * @returns {RawTX}
   */

  getNormalSizes() {
    let base = 0;

    base += 4;

    base += encoding.sizeVarint(this.inputs.length);

    for (const input of this.inputs)
      base += input.getSize();

    base += encoding.sizeVarint(this.outputs.length);

    for (const output of this.outputs)
      base += output.getSize();

    base += 4;

    return new RawTX(base, 0);
  }

  /**
   * Calculate the real size of the transaction
   * with the witness included.
   * @returns {RawTX}
   */

  getWitnessSizes() {
    let base = 0;
    let witness = 0;

    base += 4;
    witness += 2;

    base += encoding.sizeVarint(this.inputs.length);

    for (const input of this.inputs) {
      base += input.getSize();
      witness += input.witness.getVarSize();
    }

    base += encoding.sizeVarint(this.outputs.length);

    for (const output of this.outputs)
      base += output.getSize();

    base += 4;

    return new RawTX(base + witness, witness);
  }

  /**
   * Test whether an object is a TX.
   * @param {Object} obj
   * @returns {Boolean}
   */

  static isTX(obj) {
    return obj instanceof TX;
  }
}

/*
 * Helpers
 */

function hasWitnessBytes(br) {
  if (br.left() < 6)
    return false;

  return br.data[br.offset + 4] === 0
    && br.data[br.offset + 5] !== 0;
}

class RawTX {
  constructor(size, witness) {
    this.data = null;
    this.size = size;
    this.witness = witness;
  }
}

/*
 * Expose
 */

module.exports = TX;
