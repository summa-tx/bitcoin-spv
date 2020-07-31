/*!
 * output.js - output object for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('./bsert');
const bio = require('./bufio');
const Script = require('./script');
const consensus = require('./consensus');

/**
 * Represents a transaction output.
 * @alias module:primitives.Output
 * @property {Amount} value
 * @property {Script} script
 */

class Output {
  /**
   * Create an output.
   * @constructor
   * @param {Object?} options
   */

  constructor(options) {
    this.value = 0;
    this.script = new Script();

    if (options)
      this.fromOptions(options);
  }

  /**
   * Inject properties from options object.
   * @private
   * @param {Object} options
   */

  fromOptions(options) {
    assert(options, 'Output data is required.');

    if (options.value) {
      assert(Number.isSafeInteger(options.value) && options.value >= 0,
        'Value must be a uint64.');
      this.value = options.value;
    }

    if (options.script)
      this.script.fromOptions(options.script);

    return this;
  }

  /**
   * Instantiate output from options object.
   * @param {Object} options
   * @returns {Output}
   */

  static fromOptions(options) {
    return new this().fromOptions(options);
  }

  /**
   * Inject properties from script/value pair.
   * @private
   * @param {Script|Address} script
   * @param {Amount} value
   * @returns {Output}
   */

  fromScript(script, value) {
    assert(script instanceof Script, 'Script must be a Script.');
    assert(Number.isSafeInteger(value) && value >= 0,
      'Value must be a uint64.');

    this.script = script;
    this.value = value;

    return this;
  }

  /**
   * Instantiate output from script/value pair.
   * @param {Script|Address} script
   * @param {Amount} value
   * @returns {Output}
   */

  static fromScript(script, value) {
    return new this().fromScript(script, value);
  }

  /**
   * Clone the output.
   * @returns {Output}
   */

  clone() {
    const output = new this.constructor();
    output.value = this.value;
    output.script.inject(this.script);
    return output;
  }

  /**
   * Test equality against another output.
   * @param {Output} output
   * @returns {Boolean}
   */

  equals(output) {
    assert(Output.isOutput(output));
    return this.value === output.value
      && this.script.equals(output.script);
  }

  /**
   * Compare against another output (BIP69).
   * @param {Output} output
   * @returns {Number}
   */

  compare(output) {
    assert(Output.isOutput(output));

    const cmp = this.value - output.value;

    if (cmp !== 0)
      return cmp;

    return this.script.compare(output.script);
  }

  /**
   * Get the script type as a string.
   * @returns {ScriptType} type
   */

  getType() {
    return Script.typesByVal[this.script.getType()].toLowerCase();
  }

  /**
   * Convert the output to an object suitable
   * for JSON serialization.
   * @returns {Object}
   */

  toJSON() {
    return this.getJSON();
  }

  /**
   * Convert the output to an object suitable
   * for JSON serialization.
   * @param {Network} network
   * @returns {Object}
   */

  getJSON() {
    return {
      value: this.value,
      script: this.script.toJSON(),
    };
  }

  /**
   * Calculate size of serialized output.
   * @returns {Number}
   */

  getSize() {
    return 8 + this.script.getVarSize();
  }

  /**
   * Inject properties from a JSON object.
   * @private
   * @param {Object} json
   */

  fromJSON(json) {
    assert(json, 'Output data is required.');
    assert(Number.isSafeInteger(json.value) && json.value >= 0,
      'Value must be a uint64.');
    this.value = json.value;
    this.script.fromJSON(json.script);
    return this;
  }

  /**
   * Instantiate an Output from a jsonified output object.
   * @param {Object} json - The jsonified output object.
   * @returns {Output}
   */

  static fromJSON(json) {
    return new this().fromJSON(json);
  }

  /**
   * Write the output to a buffer writer.
   * @param {BufferWriter} bw
   */

  toWriter(bw) {
    bw.writeI64(this.value);
    bw.writeVarBytes(this.script.toRaw());
    return bw;
  }

  /**
   * Serialize the output.
   * @param {String?} enc - Encoding, can be `'hex'` or null.
   * @returns {Buffer|String}
   */

  toRaw() {
    const size = this.getSize();
    return this.toWriter(bio.write(size)).render();
  }

  /**
   * Inject properties from buffer reader.
   * @private
   * @param {BufferReader} br
   */

  fromReader(br) {
    this.value = br.readI64();
    this.script.fromRaw(br.readVarBytes());
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
   * Instantiate an output from a buffer reader.
   * @param {BufferReader} br
   * @returns {Output}
   */

  static fromReader(br) {
    return new this().fromReader(br);
  }

  /**
   * Instantiate an output from a serialized Buffer.
   * @param {Buffer} data
   * @param {String?} enc - Encoding, can be `'hex'` or null.
   * @returns {Output}
   */

  static fromRaw(data, enc) {
    if (typeof data === 'string')
      data = Buffer.from(data, enc);
    return new this().fromRaw(data);
  }

  /**
   * Test an object to see if it is an Output.
   * @param {Object} obj
   * @returns {Boolean}
   */

  static isOutput(obj) {
    return obj instanceof Output;
  }
}

/*
 * Expose
 */

module.exports = Output;
