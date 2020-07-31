/*!
 * witness.js - witness object for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('./bsert');
const bio = require('./bufio');
const Script = require('./script');
const Stack = require('./stack');
const common = require('./common');
const {encoding} = bio;
const scriptTypes = common.types;

/**
 * Witness
 * Refers to the witness vector of
 * segregated witness transactions.
 * @alias module:script.Witness
 * @extends Stack
 * @property {Buffer[]} items
 * @property {Script?} redeem
 * @property {Number} length
 */

class Witness extends Stack {
  /**
   * Create a witness.
   * @alias module:script.Witness
   * @constructor
   * @param {Buffer[]|Object} items - Array of
   * stack items.
   * @property {Buffer[]} items
   * @property {Script?} redeem
   * @property {Number} length
   */

  constructor(options) {
    super();

    if (options)
      this.fromOptions(options);
  }

  /**
   * Inject properties from options object.
   * @private
   * @param {Object} options
   */

  fromOptions(options) {
    assert(options, 'Witness data is required.');

    if (Array.isArray(options))
      return this.fromArray(options);

    if (options.items)
      return this.fromArray(options.items);

    return this;
  }

  /**
   * Instantiate witness from options.
   * @param {Object} options
   * @returns {Witness}
   */

  static fromOptions(options) {
    return new this().fromOptions(options);
  }

  /**
   * Convert witness to an array of buffers.
   * @returns {Buffer[]}
   */

  toArray() {
    return this.items.slice();
  }

  /**
   * Inject properties from an array of buffers.
   * @private
   * @param {Buffer[]} items
   */

  fromArray(items) {
    assert(Array.isArray(items));
    this.items = items;
    return this;
  }

  /**
   * Insantiate witness from an array of buffers.
   * @param {Buffer[]} items
   * @returns {Witness}
   */

  static fromArray(items) {
    return new this().fromArray(items);
  }

  /**
   * Convert witness to an array of buffers.
   * @returns {Buffer[]}
   */

  toItems() {
    return this.items.slice();
  }

  /**
   * Inject properties from an array of buffers.
   * @private
   * @param {Buffer[]} items
   */

  fromItems(items) {
    assert(Array.isArray(items));
    this.items = items;
    return this;
  }

  /**
   * Insantiate witness from an array of buffers.
   * @param {Buffer[]} items
   * @returns {Witness}
   */

  static fromItems(items) {
    return new this().fromItems(items);
  }

  /**
   * Clone the witness object.
   * @returns {Witness} A clone of the current witness object.
   */

  clone() {
    return new this.constructor().inject(this);
  }

  /**
   * Inject properties from witness.
   * Used for cloning.
   * @private
   * @param {Witness} witness
   * @returns {Witness}
   */

  inject(witness) {
    this.items = witness.items.slice();
    return this;
  }

  /**
   * Compile witness (NOP).
   * @returns {Witness}
   */

  compile() {
    return this;
  }

  /**
   * Grab and deserialize the redeem script from the witness.
   * @returns {Script} Redeem script.
   */

  getRedeem() {
    if (this.items.length === 0)
      return null;

    const redeem = this.items[this.items.length - 1];

    if (!redeem)
      return null;

    return Script.fromRaw(redeem);
  }

  /**
   * Find a data element in a witness.
   * @param {Buffer} data - Data element to match against.
   * @returns {Number} Index (`-1` if not present).
   */

  indexOf(data) {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (item.equals(data))
        return i;
    }
    return -1;
  }

  /**
   * Calculate size of the witness
   * excluding the varint size bytes.
   * @returns {Number}
   */

  getSize() {
    let size = 0;

    for (const item of this.items)
      size += encoding.sizeVarBytes(item);

    return size;
  }

  /**
   * Calculate size of the witness
   * including the varint size bytes.
   * @returns {Number}
   */

  getVarSize() {
    return encoding.sizeVarint(this.items.length) + this.getSize();
  }

  /**
   * Write witness to a buffer writer.
   * @param {BufferWriter} bw
   */

  toWriter(bw) {
    bw.writeVarint(this.items.length);

    for (const item of this.items)
      bw.writeVarBytes(item);

    return bw;
  }

  /**
   * Encode the witness to a Buffer.
   * @param {String} enc - Encoding, either `'hex'` or `null`.
   * @returns {Buffer|String} Serialized script.
   */

  toRaw() {
    const size = this.getVarSize();
    return this.toWriter(bio.write(size)).render();
  }

  /**
   * Convert witness to a hex string.
   * @returns {String}
   */

  toJSON() {
    return this.toRaw().toString('hex');
  }

  /**
   * Inject properties from json object.
   * @private
   * @param {String} json
   */

  fromJSON(json) {
    assert(typeof json === 'string', 'Witness must be a string.');
    return this.fromRaw(Buffer.from(json, 'hex'));
  }

  /**
   * Insantiate witness from a hex string.
   * @param {String} json
   * @returns {Witness}
   */

  static fromJSON(json) {
    return new this().fromJSON(json);
  }

  /**
   * Inject properties from buffer reader.
   * @private
   * @param {BufferReader} br
   */

  fromReader(br) {
    const count = br.readVarint();

    for (let i = 0; i < count; i++)
      this.items.push(br.readVarBytes());

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
   * Create a witness from a buffer reader.
   * @param {BufferReader} br
   */

  static fromReader(br) {
    return new this().fromReader(br);
  }

  /**
   * Create a witness from a serialized buffer.
   * @param {Buffer|String} data - Serialized witness.
   * @param {String?} enc - Either `"hex"` or `null`.
   * @returns {Witness}
   */

  static fromRaw(data, enc) {
    if (typeof data === 'string')
      data = Buffer.from(data, enc);
    return new this().fromRaw(data);
  }

  /**
   * Inject items from string.
   * @private
   * @param {String|String[]} items
   */

  fromString(items) {
    if (!Array.isArray(items)) {
      assert(typeof items === 'string');

      items = items.trim();

      if (items.length === 0)
        return this;

      items = items.split(/\s+/);
    }

    for (const item of items)
      this.items.push(Buffer.from(item, 'hex'));

    return this;
  }

  /**
   * Parse a test script/array
   * string into a witness object. _Must_
   * contain only stack items (no non-push
   * opcodes).
   * @param {String|String[]} items - Script string.
   * @returns {Witness}
   * @throws Parse error.
   */

  static fromString(items) {
    return new this().fromString(items);
  }

  /**
   * Test an object to see if it is a Witness.
   * @param {Object} obj
   * @returns {Boolean}
   */

  static isWitness(obj) {
    return obj instanceof Witness;
  }
}

/*
 * Expose
 */

module.exports = Witness;
