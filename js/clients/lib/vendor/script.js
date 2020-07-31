/*!
 * script.js - script interpreter for bcoin
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('./bsert');
const bio = require('./bufio');
const consensus = require('./consensus');
const Opcode = require('./opcode');
const common = require('./common');
const opcodes = common.opcodes;
const scriptTypes = common.types;
const {encoding} = bio;

/*
 * Constants
 */

const EMPTY_BUFFER = Buffer.alloc(0);

/**
 * Script
 * Represents a input or output script.
 * @alias module:script.Script
 * @property {Array} code - Parsed script code.
 * @property {Buffer?} raw - Serialized script.
 * @property {Number} length - Number of parsed opcodes.
 */

class Script {
  /**
   * Create a script.
   * @constructor
   * @param {Buffer|Array|Object} code
   */

  constructor(options) {
    this.raw = EMPTY_BUFFER;
    this.code = [];

    if (options)
      this.fromOptions(options);
  }

  /**
   * Get length.
   * @returns {Number}
   */

  get length() {
    return this.code.length;
  }

  /**
   * Set length.
   * @param {Number} value
   */

  set length(value) {
    this.code.length = value;
  }

  /**
   * Inject properties from options object.
   * @private
   * @param {Object} options
   */

  fromOptions(options) {
    assert(options, 'Script data is required.');

    if (Buffer.isBuffer(options))
      return this.fromRaw(options);

    if (Array.isArray(options))
      return this.fromArray(options);

    if (options.raw) {
      if (!options.code)
        return this.fromRaw(options.raw);
      assert(Buffer.isBuffer(options.raw), 'Raw must be a Buffer.');
      this.raw = options.raw;
    }

    if (options.code) {
      if (!options.raw)
        return this.fromArray(options.code);
      assert(Array.isArray(options.code), 'Code must be an array.');
      this.code = options.code;
    }

    return this;
  }

  /**
   * Insantiate script from options object.
   * @param {Object} options
   * @returns {Script}
   */

  static fromOptions(options) {
    return new this().fromOptions(options);
  }

  /**
   * Instantiate a value-only iterator.
   * @returns {ScriptIterator}
   */

  values() {
    return this.code.values();
  }

  /**
   * Instantiate a key and value iterator.
   * @returns {ScriptIterator}
   */

  entries() {
    return this.code.entries();
  }

  /**
   * Instantiate a value-only iterator.
   * @returns {ScriptIterator}
   */

  [Symbol.iterator]() {
    return this.code[Symbol.iterator]();
  }

  /**
   * Convert the script to an array of
   * Buffers (pushdatas) and Numbers
   * (opcodes).
   * @returns {Array}
   */

  toArray() {
    return this.code.slice();
  }

  /**
   * Inject properties from an array of
   * of buffers and numbers.
   * @private
   * @param {Array} code
   * @returns {Script}
   */

  fromArray(code) {
    assert(Array.isArray(code));

    this.clear();

    for (const op of code)
      this.push(op);

    return this.compile();
  }

  /**
   * Instantiate script from an array
   * of buffers and numbers.
   * @param {Array} code
   * @returns {Script}
   */

  static fromArray(code) {
    return new this().fromArray(code);
  }

  /**
   * Convert script to stack items.
   * @returns {Buffer[]}
   */

  toItems() {
    const items = [];

    for (const op of this.code) {
      const data = op.toPush();

      if (!data)
        throw new Error('Non-push opcode in script.');

      items.push(data);
    }

    return items;
  }

  /**
   * Inject data from stack items.
   * @private
   * @param {Buffer[]} items
   * @returns {Script}
   */

  fromItems(items) {
    assert(Array.isArray(items));

    this.clear();

    for (const item of items)
      this.pushData(item);

    return this.compile();
  }

  /**
   * Instantiate script from stack items.
   * @param {Buffer[]} items
   * @returns {Script}
   */

  static fromItems(items) {
    return new this().fromItems(items);
  }

  /**
   * Clone the script.
   * @returns {Script} Cloned script.
   */

  clone() {
    return new this.constructor().inject(this);
  }

  /**
   * Inject properties from script.
   * Used for cloning.
   * @private
   * @param {Script} script
   * @returns {Script}
   */

  inject(script) {
    this.raw = script.raw;
    this.code = script.code.slice();
    return this;
  }

  /**
   * Test equality against script.
   * @param {Script} script
   * @returns {Boolean}
   */

  equals(script) {
    assert(Script.isScript(script));
    return this.raw.equals(script.raw);
  }

  /**
   * Compare against another script.
   * @param {Script} script
   * @returns {Number}
   */

  compare(script) {
    assert(Script.isScript(script));
    return this.raw.compare(script.raw);
  }

  /**
   * Clear the script.
   * @returns {Script}
   */

  clear() {
    this.raw = EMPTY_BUFFER;
    this.code.length = 0;
    return this;
  }

  /**
   * Convert the script to a bitcoind test string.
   * @returns {String} Human-readable script code.
   */

  toString() {
    const out = [];

    for (const op of this.code)
      out.push(op.toFormat());

    return out.join(' ');
  }

  /**
   * Format the script as bitcoind asm.
   * @param {Boolean?} decode - Attempt to decode hash types.
   * @returns {String} Human-readable script.
   */

  toASM(decode) {
    if (this.isNulldata())
      decode = false;

    const out = [];

    for (const op of this.code)
      out.push(op.toASM(decode));

    return out.join(' ');
  }

  /**
   * Re-encode the script internally. Useful if you
   * changed something manually in the `code` array.
   * @returns {Script}
   */

  compile() {
    if (this.code.length === 0)
      return this.clear();

    let size = 0;

    for (const op of this.code)
      size += op.getSize();

    const bw = bio.write(size);

    for (const op of this.code)
      op.toWriter(bw);

    this.raw = bw.render();

    return this;
  }

  /**
   * Write the script to a buffer writer.
   * @param {BufferWriter} bw
   */

  toWriter(bw) {
    bw.writeVarBytes(this.raw);
    return bw;
  }

  /**
   * Encode the script to a Buffer. See {@link Script#encode}.
   * @param {String} enc - Encoding, either `'hex'` or `null`.
   * @returns {Buffer|String} Serialized script.
   */

  toRaw() {
    return this.raw;
  }

  /**
   * Convert script to a hex string.
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
    assert(typeof json === 'string', 'Code must be a string.');
    return this.fromRaw(Buffer.from(json, 'hex'));
  }

  /**
   * Instantiate script from a hex string.
   * @params {String} json
   * @returns {Script}
   */

  static fromJSON(json) {
    return new this().fromJSON(json);
  }

  /**
   * Find a data element in a script.
   * @param {Buffer} data - Data element to match against.
   * @returns {Number} Index (`-1` if not present).
   */

  indexOf(data) {
    for (let i = 0; i < this.code.length; i++) {
      const op = this.code[i];

      if (op.value === -1)
        break;

      if (!op.data)
        continue;

      if (op.data.equals(data))
        return i;
    }

    return -1;
  }

  /**
   * Test a script to see if it is likely
   * to be script code (no weird opcodes).
   * @returns {Boolean}
   */

  isCode() {
    for (const op of this.code) {
      if (op.value === -1)
        return false;

      if (op.isDisabled())
        return false;

      switch (op.value) {
        case opcodes.OP_RESERVED:
        case opcodes.OP_NOP:
        case opcodes.OP_VER:
        case opcodes.OP_VERIF:
        case opcodes.OP_VERNOTIF:
        case opcodes.OP_RESERVED1:
        case opcodes.OP_RESERVED2:
        case opcodes.OP_NOP1:
          return false;
      }

      if (op.value > opcodes.OP_CHECKSEQUENCEVERIFY)
        return false;
    }

    return true;
  }

  /**
   * Inject properties from a pay-to-pubkey script.
   * @private
   * @param {Buffer} key
   */

  fromPubkey(key) {
    assert(Buffer.isBuffer(key) && (key.length === 33 || key.length === 65));

    this.raw = Buffer.allocUnsafe(1 + key.length + 1);
    this.raw[0] = key.length;
    key.copy(this.raw, 1);
    this.raw[1 + key.length] = opcodes.OP_CHECKSIG;

    key = this.raw.slice(1, 1 + key.length);

    this.code.length = 0;
    this.code.push(Opcode.fromPush(key));
    this.code.push(Opcode.fromOp(opcodes.OP_CHECKSIG));

    return this;
  }

  /**
   * Create a pay-to-pubkey script.
   * @param {Buffer} key
   * @returns {Script}
   */

  static fromPubkey(key) {
    return new this().fromPubkey(key);
  }

  /**
   * Inject properties from a pay-to-pubkeyhash script.
   * @private
   * @param {Buffer} hash
   */

  fromPubkeyhash(hash) {
    assert(Buffer.isBuffer(hash) && hash.length === 20);

    this.raw = Buffer.allocUnsafe(25);
    this.raw[0] = opcodes.OP_DUP;
    this.raw[1] = opcodes.OP_HASH160;
    this.raw[2] = 0x14;
    hash.copy(this.raw, 3);
    this.raw[23] = opcodes.OP_EQUALVERIFY;
    this.raw[24] = opcodes.OP_CHECKSIG;

    hash = this.raw.slice(3, 23);

    this.code.length = 0;
    this.code.push(Opcode.fromOp(opcodes.OP_DUP));
    this.code.push(Opcode.fromOp(opcodes.OP_HASH160));
    this.code.push(Opcode.fromPush(hash));
    this.code.push(Opcode.fromOp(opcodes.OP_EQUALVERIFY));
    this.code.push(Opcode.fromOp(opcodes.OP_CHECKSIG));

    return this;
  }

  /**
   * Create a pay-to-pubkeyhash script.
   * @param {Buffer} hash
   * @returns {Script}
   */

  static fromPubkeyhash(hash) {
    return new this().fromPubkeyhash(hash);
  }

  /**
   * Inject properties from pay-to-multisig script.
   * @private
   * @param {Number} m
   * @param {Number} n
   * @param {Buffer[]} keys
   */

  fromMultisig(m, n, keys) {
    assert((m & 0xff) === m && (n & 0xff) === n);
    assert(Array.isArray(keys));
    assert(keys.length === n, '`n` keys are required for multisig.');
    assert(m >= 1 && m <= n);
    assert(n >= 1 && n <= 15);

    this.clear();

    this.pushSmall(m);

    for (const key of sortKeys(keys))
      this.pushData(key);

    this.pushSmall(n);
    this.pushOp(opcodes.OP_CHECKMULTISIG);

    return this.compile();
  }

  /**
   * Create a pay-to-multisig script.
   * @param {Number} m
   * @param {Number} n
   * @param {Buffer[]} keys
   * @returns {Script}
   */

  static fromMultisig(m, n, keys) {
    return new this().fromMultisig(m, n, keys);
  }

  /**
   * Inject properties from a pay-to-scripthash script.
   * @private
   * @param {Buffer} hash
   */

  fromScripthash(hash) {
    assert(Buffer.isBuffer(hash) && hash.length === 20);

    this.raw = Buffer.allocUnsafe(23);
    this.raw[0] = opcodes.OP_HASH160;
    this.raw[1] = 0x14;
    hash.copy(this.raw, 2);
    this.raw[22] = opcodes.OP_EQUAL;

    hash = this.raw.slice(2, 22);

    this.code.length = 0;
    this.code.push(Opcode.fromOp(opcodes.OP_HASH160));
    this.code.push(Opcode.fromPush(hash));
    this.code.push(Opcode.fromOp(opcodes.OP_EQUAL));

    return this;
  }

  /**
   * Create a pay-to-scripthash script.
   * @param {Buffer} hash
   * @returns {Script}
   */

  static fromScripthash(hash) {
    return new this().fromScripthash(hash);
  }

  /**
   * Inject properties from a nulldata/opreturn script.
   * @private
   * @param {Buffer} flags
   */

  fromNulldata(flags) {
    assert(Buffer.isBuffer(flags));
    assert(flags.length <= policy.MAX_OP_RETURN, 'Nulldata too large.');

    this.clear();
    this.pushOp(opcodes.OP_RETURN);
    this.pushData(flags);

    return this.compile();
  }

  /**
   * Create a nulldata/opreturn script.
   * @param {Buffer} flags
   * @returns {Script}
   */

  static fromNulldata(flags) {
    return new this().fromNulldata(flags);
  }

  /**
   * Inject properties from a witness program.
   * @private
   * @param {Number} version
   * @param {Buffer} data
   */

  fromProgram(version, data) {
    assert((version & 0xff) === version && version >= 0 && version <= 16);
    assert(Buffer.isBuffer(data) && data.length >= 2 && data.length <= 40);

    this.raw = Buffer.allocUnsafe(2 + data.length);
    this.raw[0] = version === 0 ? 0 : version + 0x50;
    this.raw[1] = data.length;
    data.copy(this.raw, 2);

    data = this.raw.slice(2, 2 + data.length);

    this.code.length = 0;
    this.code.push(Opcode.fromSmall(version));
    this.code.push(Opcode.fromPush(data));

    return this;
  }

  /**
   * Create a witness program.
   * @param {Number} version
   * @param {Buffer} data
   * @returns {Script}
   */

  static fromProgram(version, data) {
    return new this().fromProgram(version, data);
  }

  /**
   * Inject properties from a witness block commitment.
   * @private
   * @param {Buffer} hash
   * @param {String|Buffer} flags
   */

  fromCommitment(hash, flags) {
    const bw = bio.write(36);

    bw.writeU32BE(0xaa21a9ed);
    bw.writeHash(hash);

    this.clear();
    this.pushOp(opcodes.OP_RETURN);
    this.pushData(bw.render());

    if (flags)
      this.pushData(flags);

    return this.compile();
  }

  /**
   * Create a witness block commitment.
   * @param {Buffer} hash
   * @param {String|Buffer} flags
   * @returns {Script}
   */

  static fromCommitment(hash, flags) {
    return new this().fromCommitment(hash, flags);
  }

  /**
   * Grab and deserialize the redeem script.
   * @returns {Script|null} Redeem script.
   */

  getRedeem() {
    let data = null;

    for (const op of this.code) {
      if (op.value === -1)
        return null;

      if (op.value > opcodes.OP_16)
        return null;

      data = op.data;
    }

    if (!data)
      return null;

    return Script.fromRaw(data);
  }

  /**
   * Get the standard script type.
   * @returns {ScriptType}
   */

  getType() {
    if (this.isPubkey())
      return scriptTypes.PUBKEY;

    if (this.isPubkeyhash())
      return scriptTypes.PUBKEYHASH;

    if (this.isScripthash())
      return scriptTypes.SCRIPTHASH;

    if (this.isWitnessPubkeyhash())
      return scriptTypes.WITNESSPUBKEYHASH;

    if (this.isWitnessScripthash())
      return scriptTypes.WITNESSSCRIPTHASH;

    if (this.isMultisig())
      return scriptTypes.MULTISIG;

    if (this.isNulldata())
      return scriptTypes.NULLDATA;

    return scriptTypes.NONSTANDARD;
  }

  /**
   * Test whether a script is of an unknown/non-standard type.
   * @returns {Boolean}
   */

  isUnknown() {
    return this.getType() === scriptTypes.NONSTANDARD;
  }

  /**
   * Test whether the script is standard by policy standards.
   * @returns {Boolean}
   */

  isStandard() {
    const [m, n] = this.getMultisig();

    if (m !== -1) {
      if (n < 1 || n > 3)
        return false;

      if (m < 1 || m > n)
        return false;

      return true;
    }

    if (this.isNulldata())
      return this.raw.length <= policy.MAX_OP_RETURN_BYTES;

    return this.getType() !== scriptTypes.NONSTANDARD;
  }

  /**
   * Calculate the size of the script
   * excluding the varint size bytes.
   * @returns {Number}
   */

  getSize() {
    return this.raw.length;
  }

  /**
   * Calculate the size of the script
   * including the varint size bytes.
   * @returns {Number}
   */

  getVarSize() {
    return encoding.sizeVarBytes(this.raw);
  }

  /**
   * Test whether the output script is pay-to-pubkeyhash.
   * @param {Boolean} [minimal=false] - Minimaldata only.
   * @returns {Boolean}
   */

  isPubkeyhash(minimal) {
    if (minimal || this.raw.length === 25) {
      return this.raw.length === 25
        && this.raw[0] === opcodes.OP_DUP
        && this.raw[1] === opcodes.OP_HASH160
        && this.raw[2] === 0x14
        && this.raw[23] === opcodes.OP_EQUALVERIFY
        && this.raw[24] === opcodes.OP_CHECKSIG;
    }

    if (this.code.length !== 5)
      return false;

    return this.getOp(0) === opcodes.OP_DUP
      && this.getOp(1) === opcodes.OP_HASH160
      && this.getLength(2) === 20
      && this.getOp(3) === opcodes.OP_EQUALVERIFY
      && this.getOp(4) === opcodes.OP_CHECKSIG;
  }

  /**
   * Get P2PKH hash if present.
   * @param {Boolean} [minimal=false] - Minimaldata only.
   * @returns {Buffer|null}
   */

  getPubkeyhash(minimal) {
    if (!this.isPubkeyhash(minimal))
      return null;

    if (minimal)
      return this.raw.slice(3, 23);

    return this.getData(2);
  }

  /**
   * Test whether the output script is pay-to-scripthash. Note that
   * bitcoin itself requires scripthashes to be in strict minimaldata
   * encoding. Using `OP_HASH160 OP_PUSHDATA1 [hash] OP_EQUAL` will
   * _not_ be recognized as a scripthash.
   * @returns {Boolean}
   */

  isScripthash() {
    return this.raw.length === 23
      && this.raw[0] === opcodes.OP_HASH160
      && this.raw[1] === 0x14
      && this.raw[22] === opcodes.OP_EQUAL;
  }

  /**
   * Get P2SH hash if present.
   * @returns {Buffer|null}
   */

  getScripthash() {
    if (!this.isScripthash())
      return null;

    return this.getData(1);
  }

  /**
   * Test whether the output script is nulldata/opreturn.
   * @param {Boolean} [minimal=false] - Minimaldata only.
   * @returns {Boolean}
   */

  isNulldata(minimal) {
    if (this.code.length === 0)
      return false;

    if (this.getOp(0) !== opcodes.OP_RETURN)
      return false;

    if (this.code.length === 1)
      return true;

    if (minimal) {
      if (this.raw.length > policy.MAX_OP_RETURN_BYTES)
        return false;
    }

    for (let i = 1; i < this.code.length; i++) {
      const op = this.code[i];

      if (op.value === -1)
        return false;

      if (op.value > opcodes.OP_16)
        return false;

      if (minimal && !op.isMinimal())
        return false;
    }

    return true;
  }

  /**
   * Get OP_RETURN data if present.
   * @param {Boolean} [minimal=false] - Minimaldata only.
   * @returns {Buffer|null}
   */

  getNulldata(minimal) {
    if (!this.isNulldata(minimal))
      return null;

    for (let i = 1; i < this.code.length; i++) {
      const op = this.code[i];
      const data = op.toPush();
      if (data)
        return data;
    }

    return EMPTY_BUFFER;
  }

  /**
   * Test whether the output script is a witness program.
   * Note that this will return true even for malformed
   * witness v0 programs.
   * @return {Boolean}
   */

  isProgram() {
    if (this.raw.length < 4 || this.raw.length > 42)
      return false;

    if (this.raw[0] !== opcodes.OP_0
        && (this.raw[0] < opcodes.OP_1 || this.raw[0] > opcodes.OP_16)) {
      return false;
    }

    if (this.raw[1] + 2 !== this.raw.length)
      return false;

    return true;
  }

  /**
   * Test whether the output script is
   * a pay-to-witness-pubkeyhash program.
   * @returns {Boolean}
   */

  isWitnessPubkeyhash() {
    return this.raw.length === 22
      && this.raw[0] === opcodes.OP_0
      && this.raw[1] === 0x14;
  }

  /**
   * Get P2WPKH hash if present.
   * @returns {Buffer|null}
   */

  getWitnessPubkeyhash() {
    if (!this.isWitnessPubkeyhash())
      return null;

    return this.getData(1);
  }

  /**
   * Test whether the output script is
   * a pay-to-witness-scripthash program.
   * @returns {Boolean}
   */

  isWitnessScripthash() {
    return this.raw.length === 34
      && this.raw[0] === opcodes.OP_0
      && this.raw[1] === 0x20;
  }

  /**
   * Get P2WSH hash if present.
   * @returns {Buffer|null}
   */

  getWitnessScripthash() {
    if (!this.isWitnessScripthash())
      return null;

    return this.getData(1);
  }

  /**
   * Test whether the output script is unspendable.
   * @returns {Boolean}
   */

  isUnspendable() {
    if (this.raw.length > consensus.MAX_SCRIPT_SIZE)
      return true;

    return this.raw.length > 0 && this.raw[0] === opcodes.OP_RETURN;
  }

  /**
   * Get P2PK signature if present.
   * @returns {Buffer|null}
   */

  getPubkeyInput() {
    if (!this.isPubkeyInput())
      return null;

    return this.getData(0);
  }

  /**
   * Get coinbase height.
   * @returns {Number} `-1` if not present.
   */

  getCoinbaseHeight() {
    return Script.getCoinbaseHeight(this.raw);
  }

  /**
   * Get coinbase height.
   * @param {Buffer} raw - Raw script.
   * @returns {Number} `-1` if not present.
   */

  static getCoinbaseHeight(raw) {
    if (raw.length === 0)
      return -1;

    if (raw[0] >= opcodes.OP_1 && raw[0] <= opcodes.OP_16)
      return raw[0] - 0x50;

    if (raw[0] > 0x06)
      return -1;

    const op = Opcode.fromRaw(raw);
    const num = op.toNum();

    if (!num)
      return 1;

    if (num.isNeg())
      return -1;

    if (!op.equals(Opcode.fromNum(num)))
      return -1;

    return num.toDouble();
  }

  /**
   * Count the sigops in the script.
   * @param {Boolean} accurate - Whether to enable accurate counting. This will
   * take into account the `n` value for OP_CHECKMULTISIG(VERIFY).
   * @returns {Number} sigop count
   */

  getSigops(accurate) {
    let total = 0;
    let lastOp = -1;

    for (const op of this.code) {
      if (op.value === -1)
        break;

      switch (op.value) {
        case opcodes.OP_CHECKSIG:
        case opcodes.OP_CHECKSIGVERIFY:
          total += 1;
          break;
        case opcodes.OP_CHECKMULTISIG:
        case opcodes.OP_CHECKMULTISIGVERIFY:
          if (accurate && lastOp >= opcodes.OP_1 && lastOp <= opcodes.OP_16)
            total += lastOp - 0x50;
          else
            total += consensus.MAX_MULTISIG_PUBKEYS;
          break;
      }

      lastOp = op.value;
    }

    return total;
  }

  /**
   * Count the sigops in the script, taking into account redeem scripts.
   * @param {Script} input - Input script, needed for access to redeem script.
   * @returns {Number} sigop count
   */

  getScripthashSigops(input) {
    if (!this.isScripthash())
      return this.getSigops(true);

    const redeem = input.getRedeem();

    if (!redeem)
      return 0;

    return redeem.getSigops(true);
  }

  /*
   * Mutation
   */

  get(index) {
    if (index < 0)
      index += this.code.length;

    if (index < 0 || index >= this.code.length)
      return null;

    return this.code[index];
  }

  pop() {
    const op = this.code.pop();
    return op || null;
  }

  shift() {
    const op = this.code.shift();
    return op || null;
  }

  remove(index) {
    if (index < 0)
      index += this.code.length;

    if (index < 0 || index >= this.code.length)
      return null;

    const items = this.code.splice(index, 1);

    if (items.length === 0)
      return null;

    return items[0];
  }

  set(index, op) {
    if (index < 0)
      index += this.code.length;

    assert(Opcode.isOpcode(op));
    assert(index >= 0 && index <= this.code.length);

    this.code[index] = op;

    return this;
  }

  push(op) {
    assert(Opcode.isOpcode(op));
    this.code.push(op);
    return this;
  }

  unshift(op) {
    assert(Opcode.isOpcode(op));
    this.code.unshift(op);
    return this;
  }

  insert(index, op) {
    if (index < 0)
      index += this.code.length;

    assert(Opcode.isOpcode(op));
    assert(index >= 0 && index <= this.code.length);

    this.code.splice(index, 0, op);

    return this;
  }

  /*
   * Op
   */

  getOp(index) {
    const op = this.get(index);
    return op ? op.value : -1;
  }

  popOp() {
    const op = this.pop();
    return op ? op.value : -1;
  }

  shiftOp() {
    const op = this.shift();
    return op ? op.value : -1;
  }

  removeOp(index) {
    const op = this.remove(index);
    return op ? op.value : -1;
  }

  setOp(index, value) {
    return this.set(index, Opcode.fromOp(value));
  }

  pushOp(value) {
    return this.push(Opcode.fromOp(value));
  }

  unshiftOp(value) {
    return this.unshift(Opcode.fromOp(value));
  }

  insertOp(index, value) {
    return this.insert(index, Opcode.fromOp(value));
  }

  /*
   * Data
   */

  getData(index) {
    const op = this.get(index);
    return op ? op.data : null;
  }

  popData() {
    const op = this.pop();
    return op ? op.data : null;
  }

  shiftData() {
    const op = this.shift();
    return op ? op.data : null;
  }

  removeData(index) {
    const op = this.remove(index);
    return op ? op.data : null;
  }

  setData(index, data) {
    return this.set(index, Opcode.fromData(data));
  }

  pushData(data) {
    return this.push(Opcode.fromData(data));
  }

  unshiftData(data) {
    return this.unshift(Opcode.fromData(data));
  }

  insertData(index, data) {
    return this.insert(index, Opcode.fromData(data));
  }

  /*
   * Length
   */

  getLength(index) {
    const op = this.get(index);
    return op ? op.toLength() : -1;
  }

  /*
   * Push
   */

  getPush(index) {
    const op = this.get(index);
    return op ? op.toPush() : null;
  }

  popPush() {
    const op = this.pop();
    return op ? op.toPush() : null;
  }

  shiftPush() {
    const op = this.shift();
    return op ? op.toPush() : null;
  }

  removePush(index) {
    const op = this.remove(index);
    return op ? op.toPush() : null;
  }

  setPush(index, data) {
    return this.set(index, Opcode.fromPush(data));
  }

  pushPush(data) {
    return this.push(Opcode.fromPush(data));
  }

  unshiftPush(data) {
    return this.unshift(Opcode.fromPush(data));
  }

  insertPush(index, data) {
    return this.insert(index, Opcode.fromPush(data));
  }

  /*
   * String
   */

  getString(index, enc) {
    const op = this.get(index);
    return op ? op.toString(enc) : null;
  }

  popString(enc) {
    const op = this.pop();
    return op ? op.toString(enc) : null;
  }

  shiftString(enc) {
    const op = this.shift();
    return op ? op.toString(enc) : null;
  }

  removeString(index, enc) {
    const op = this.remove(index);
    return op ? op.toString(enc) : null;
  }

  setString(index, str, enc) {
    return this.set(index, Opcode.fromString(str, enc));
  }

  pushString(str, enc) {
    return this.push(Opcode.fromString(str, enc));
  }

  unshiftString(str, enc) {
    return this.unshift(Opcode.fromString(str, enc));
  }

  insertString(index, str, enc) {
    return this.insert(index, Opcode.fromString(str, enc));
  }

  /*
   * Small
   */

  getSmall(index) {
    const op = this.get(index);
    return op ? op.toSmall() : -1;
  }

  popSmall() {
    const op = this.pop();
    return op ? op.toSmall() : -1;
  }

  shiftSmall() {
    const op = this.shift();
    return op ? op.toSmall() : -1;
  }

  removeSmall(index) {
    const op = this.remove(index);
    return op ? op.toSmall() : -1;
  }

  setSmall(index, num) {
    return this.set(index, Opcode.fromSmall(num));
  }

  pushSmall(num) {
    return this.push(Opcode.fromSmall(num));
  }

  unshiftSmall(num) {
    return this.unshift(Opcode.fromSmall(num));
  }

  insertSmall(index, num) {
    return this.insert(index, Opcode.fromSmall(num));
  }

  /*
   * Num
   */

  getNum(index, minimal, limit) {
    const op = this.get(index);
    return op ? op.toNum(minimal, limit) : null;
  }

  popNum(minimal, limit) {
    const op = this.pop();
    return op ? op.toNum(minimal, limit) : null;
  }

  shiftNum(minimal, limit) {
    const op = this.shift();
    return op ? op.toNum(minimal, limit) : null;
  }

  removeNum(index, minimal, limit) {
    const op = this.remove(index);
    return op ? op.toNum(minimal, limit) : null;
  }

  setNum(index, num) {
    return this.set(index, Opcode.fromNum(num));
  }

  pushNum(num) {
    return this.push(Opcode.fromNum(num));
  }

  unshiftNum(num) {
    return this.unshift(Opcode.fromNum(num));
  }

  insertNum(index, num) {
    return this.insert(index, Opcode.fromNum(num));
  }

  /*
   * Int
   */

  getInt(index, minimal, limit) {
    const op = this.get(index);
    return op ? op.toInt(minimal, limit) : -1;
  }

  popInt(minimal, limit) {
    const op = this.pop();
    return op ? op.toInt(minimal, limit) : -1;
  }

  shiftInt(minimal, limit) {
    const op = this.shift();
    return op ? op.toInt(minimal, limit) : -1;
  }

  removeInt(index, minimal, limit) {
    const op = this.remove(index);
    return op ? op.toInt(minimal, limit) : -1;
  }

  setInt(index, num) {
    return this.set(index, Opcode.fromInt(num));
  }

  pushInt(num) {
    return this.push(Opcode.fromInt(num));
  }

  unshiftInt(num) {
    return this.unshift(Opcode.fromInt(num));
  }

  insertInt(index, num) {
    return this.insert(index, Opcode.fromInt(num));
  }

  /*
   * Bool
   */

  getBool(index) {
    const op = this.get(index);
    return op ? op.toBool() : false;
  }

  popBool() {
    const op = this.pop();
    return op ? op.toBool() : false;
  }

  shiftBool() {
    const op = this.shift();
    return op ? op.toBool() : false;
  }

  removeBool(index) {
    const op = this.remove(index);
    return op ? op.toBool() : false;
  }

  setBool(index, value) {
    return this.set(index, Opcode.fromBool(value));
  }

  pushBool(value) {
    return this.push(Opcode.fromBool(value));
  }

  unshiftBool(value) {
    return this.unshift(Opcode.fromBool(value));
  }

  insertBool(index, value) {
    return this.insert(index, Opcode.fromBool(value));
  }

  /*
   * Symbol
   */

  getSym(index) {
    const op = this.get(index);
    return op ? op.toSymbol() : null;
  }

  popSym() {
    const op = this.pop();
    return op ? op.toSymbol() : null;
  }

  shiftSym() {
    const op = this.shift();
    return op ? op.toSymbol() : null;
  }

  removeSym(index) {
    const op = this.remove(index);
    return op ? op.toSymbol() : null;
  }

  setSym(index, symbol) {
    return this.set(index, Opcode.fromSymbol(symbol));
  }

  pushSym(symbol) {
    return this.push(Opcode.fromSymbol(symbol));
  }

  unshiftSym(symbol) {
    return this.unshift(Opcode.fromSymbol(symbol));
  }

  insertSym(index, symbol) {
    return this.insert(index, Opcode.fromSymbol(symbol));
  }

  /**
   * Inject properties from buffer reader.
   * @private
   * @param {BufferReader} br
   */

  fromReader(br) {
    return this.fromRaw(br.readVarBytes());
  }

  /**
   * Inject properties from serialized data.
   * @private
   * @param {Buffer}
   */

  fromRaw(data) {
    const br = bio.read(data);

    this.raw = data;

    while (br.left())
      this.code.push(Opcode.fromReader(br));

    return this;
  }

  /**
   * Create a script from buffer reader.
   * @param {BufferReader} br
   * @param {String?} enc - Either `"hex"` or `null`.
   * @returns {Script}
   */

  static fromReader(br) {
    return new this().fromReader(br);
  }

  /**
   * Create a script from a serialized buffer.
   * @param {Buffer|String} data - Serialized script.
   * @param {String?} enc - Either `"hex"` or `null`.
   * @returns {Script}
   */

  static fromRaw(data, enc) {
    if (typeof data === 'string')
      data = Buffer.from(data, enc);
    return new this().fromRaw(data);
  }

  /**
   * Test whether an object a Script.
   * @param {Object} obj
   * @returns {Boolean}
   */

  static isScript(obj) {
    return obj instanceof Script;
  }
}

/**
 * Script opcodes.
 * @enum {Number}
 * @default
 */

Script.opcodes = common.opcodes;

/**
 * Opcodes by value.
 * @const {RevMap}
 */

Script.opcodesByVal = common.opcodesByVal;

/**
 * Script and locktime flags. See {@link VerifyFlags}.
 * @enum {Number}
 */

Script.flags = common.flags;

/**
 * Sighash Types.
 * @enum {SighashType}
 * @default
 */

Script.hashType = common.hashType;

/**
 * Sighash types by value.
 * @const {RevMap}
 */

Script.hashTypeByVal = common.hashTypeByVal;

/**
 * Output script types.
 * @enum {Number}
 */

Script.types = common.types;

/**
 * Output script types by value.
 * @const {RevMap}
 */

Script.typesByVal = common.typesByVal;

/*
 * Helpers
 */

function sortKeys(keys) {
  return keys.slice().sort((a, b) => {
    return a.compare(b);
  });
}

/*
 * Expose
 */

module.exports = Script;
