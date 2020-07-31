/*!
 * input.js - input object for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('./bsert');
const bio = require('./bufio');
const Script = require('./script');
const Witness = require('./witness');
const Outpoint = require('./outpoint');

/**
 * Input
 * Represents a transaction input.
 * @alias module:primitives.Input
 * @property {Outpoint} prevout - Outpoint.
 * @property {Script} script - Input script / scriptSig.
 * @property {Number} sequence - nSequence.
 * @property {Witness} witness - Witness (empty if not present).
 */

class Input {
  /**
   * Create transaction input.
   * @constructor
   * @param {Object} options
   */

  constructor(options) {
    this.prevout = new Outpoint();
    this.script = new Script();
    this.sequence = 0xffffffff;
    this.witness = new Witness();

    if (options)
      this.fromOptions(options);
  }

  /**
   * Inject properties from options object.
   * @private
   * @param {Object} options
   */

  fromOptions(options) {
    assert(options, 'Input data is required.');

    this.prevout.fromOptions(options.prevout);

    if (options.script)
      this.script.fromOptions(options.script);

    if (options.sequence != null) {
      assert((options.sequence >>> 0) === options.sequence,
        'Sequence must be a uint32.');
      this.sequence = options.sequence;
    }

    if (options.witness)
      this.witness.fromOptions(options.witness);

    return this;
  }

  /**
   * Instantiate an Input from options object.
   * @param {Object} options
   * @returns {Input}
   */

  static fromOptions(options) {
    return new this().fromOptions(options);
  }

  /**
   * Clone the input.
   * @returns {Input}
   */

  clone() {
    const input = new this.constructor();
    input.prevout = this.prevout;
    input.script.inject(this.script);
    input.sequence = this.sequence;
    input.witness.inject(this.witness);
    return input;
  }

  /**
   * Test equality against another input.
   * @param {Input} input
   * @returns {Boolean}
   */

  equals(input) {
    assert(Input.isInput(input));
    return this.prevout.equals(input.prevout);
  }

  /**
   * Compare against another input (BIP69).
   * @param {Input} input
   * @returns {Number}
   */

  compare(input) {
    assert(Input.isInput(input));
    return this.prevout.compare(input.prevout);
  }

  /**
   * Test to see if nSequence is equal to uint32max.
   * @returns {Boolean}
   */

  isFinal() {
    return this.sequence === 0xffffffff;
  }

  /**
   * Test to see if nSequence is less than 0xfffffffe.
   * @returns {Boolean}
   */

  isRBF() {
    return this.sequence < 0xfffffffe;
  }

  /**
   * Test to see if outpoint is null.
   * @returns {Boolean}
   */

  isCoinbase() {
    return this.prevout.isNull();
  }

  /**
   * Convert the input to an object suitable
   * for JSON serialization.
   * @returns {Object}
   */

  toJSON(network, coin) {
    return this.getJSON();
  }

  /**
   * Convert the input to an object suitable
   * for JSON serialization. Note that the hashes
   * will be reversed to abide by bitcoind's legacy
   * of little-endian uint256s.
   * @param {Network} network
   * @param {Coin} coin
   * @returns {Object}
   */

  getJSON() {
    return {
      prevout: this.prevout.toJSON(),
      script: this.script.toJSON(),
      witness: this.witness.toJSON(),
      sequence: this.sequence
    };
  }

  /**
   * Inject properties from a JSON object.
   * @private
   * @param {Object} json
   */

  fromJSON(json) {
    assert(json, 'Input data is required.');
    assert((json.sequence >>> 0) === json.sequence,
      'Sequence must be a uint32.');
    this.prevout.fromJSON(json.prevout);
    this.script.fromJSON(json.script);
    this.witness.fromJSON(json.witness);
    this.sequence = json.sequence;
    return this;
  }

  /**
   * Instantiate an Input from a jsonified input object.
   * @param {Object} json - The jsonified input object.
   * @returns {Input}
   */

  static fromJSON(json) {
    return new this().fromJSON(json);
  }

  /**
   * Calculate size of serialized input.
   * @returns {Number}
   */

  getSize() {
    return 40 + this.script.getVarSize();
  }

  /**
   * Serialize the input.
   * @param {String?} enc - Encoding, can be `'hex'` or null.
   * @returns {Buffer|String}
   */

  toRaw() {
    const size = this.getSize();
    return this.toWriter(bio.write(size)).render();
  }

  /**
   * Write the input to a buffer writer.
   * @param {BufferWriter} bw
   */

  toWriter(bw) {
    this.prevout.toWriter(bw);
    bw.writeVarBytes(this.script.toRaw());
    bw.writeU32(this.sequence);
    return bw;
  }

  /**
   * Inject properties from buffer reader.
   * @private
   * @param {BufferReader} br
   */

  fromReader(br) {
    this.prevout.fromReader(br);
    this.script.fromRaw(br.readVarBytes());
    this.sequence = br.readU32();
    return this;
  }

  /**
   * Inject properties from serialized data.
   * @param {Buffer} data
   */

  fromRaw(data) {
    return this.fromReader(bio.read(data));
  }

  /**
   * Instantiate an input from a buffer reader.
   * @param {BufferReader} br
   * @returns {Input}
   */

  static fromReader(br) {
    return new this().fromReader(br);
  }

  /**
   * Instantiate an input from a serialized Buffer.
   * @param {Buffer} data
   * @param {String?} enc - Encoding, can be `'hex'` or null.
   * @returns {Input}
   */

  static fromRaw(data, enc) {
    if (typeof data === 'string')
      data = Buffer.from(data, enc);
    return new this().fromRaw(data);
  }

  /**
   * Inject properties from outpoint.
   * @private
   * @param {Outpoint} outpoint
   */

  fromOutpoint(outpoint) {
    assert(Buffer.isBuffer(outpoint.hash));
    assert(typeof outpoint.index === 'number');
    this.prevout.hash = outpoint.hash;
    this.prevout.index = outpoint.index;
    return this;
  }

  /**
   * Instantiate input from outpoint.
   * @param {Outpoint}
   * @returns {Input}
   */

  static fromOutpoint(outpoint) {
    return new this().fromOutpoint(outpoint);
  }

  /**
   * Inject properties from transaction.
   * @private
   * @param {TX} tx
   * @param {Number} index
   */

  fromTX(tx, index) {
    assert(tx);
    assert(typeof index === 'number');
    assert(index >= 0 && index < tx.outputs.length);
    this.prevout.hash = tx.hash();
    this.prevout.index = index;
    return this;
  }

  /**
   * Instantiate input from tx.
   * @param {TX} tx
   * @param {Number} index
   * @returns {Input}
   */

  static fromTX(tx, index) {
    return new this().fromTX(tx, index);
  }

  /**
   * Test an object to see if it is an Input.
   * @param {Object} obj
   * @returns {Boolean}
   */

  static isInput(obj) {
    return obj instanceof Input;
  }
}

/*
 * Expose
 */

module.exports = Input;
