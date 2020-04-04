/* global BigInt */
import * as utils from './utils';
import * as BTCUtils from './BTCUtils';

export const NULL_HASH = new Uint8Array(32);
export const U32_MAX = new Uint8Array([0xff, 0xff, 0xff, 0xff]);

/**
 * @typedef {Object} Sighash
 * @property {Uint8Array}   digest The sighash digest
 * @property {number}       sighashFlag The sighash flag
 * @property {boolean}      possibleAbsoluteLock If nSequence locks might be active
 * @property {boolean}      possibleRelativeLock If nLocktime might be active
 * @property {boolean}      updateableOutputs
 * @property {boolean}      updateableInputs
 */

/**
 * @typedef {Object} Tx
 * @property {Uint8Array}   version 4-byte version
 * @property {Uint8Array}   vin The vin
 * @property {Uint8Array}   vout The vout
 * @property {Uint8Array}   locktime 4-byte locktime
 */

/**
 * @typedef {Object} SerTx
 * @property {string}     version 4-byte version
 * @property {string}     vin The vin
 * @property {string}     vout The vout
 * @property {string}     locktime 4-byte locktime
 */

/**
 * @typedef {Object} RPC
 * @property {SerTx}       serTx The tx all as hex
 * @property {number}      index
 * @property {number}      sighashFlag The sighash flag
 * @property {string}      prevoutScript The prevout script in hex
 * @property {string}      prevoutValue The prevout value in hex
 */

/**
 *
 * Validates a flag
 *
 * @param {number}      flag The sighash flag
 * @returns {boolean}   True if the flag is valid
 */
export function validateFlag(flag) {
  if (flag !== 0x01 && flag !== 0x03 && flag !== 0x81 && flag !== 0x83) return false;
  return true;
}

/**
 *
 * Parses a vin into an array of inputs
 *
 * @param {Uint8Array}    vin The vin
 * @returns {array}       An array of inputs (type Uint8Array)
 */
export function parseVin(vin) {
  const { number: nIns } = BTCUtils.parseVarInt(vin);
  const inputs = [];
  for (let i = 0; i < nIns; i += 1) {
    inputs.push(BTCUtils.extractInputAtIndex(vin, i));
  }
  return inputs;
}

/**
 *
 * Parses a vout into an array of outputs
 *
 * @param {Uint8Array}    vout The vout
 * @returns {array}       An array of outputs (type Uint8Array)
 */
export function parseVout(vout) {
  const { number: nOuts } = BTCUtils.parseVarInt(vout);
  const outputs = [];
  for (let i = 0; i < nOuts; i += 1) {
    outputs.push(BTCUtils.extractOutputAtIndex(vout, i));
  }
  return outputs;
}

/**
 *
 * Hashes prevouts according to BIP143 semantics.
 *
 * For BIP143 (Witness and Compatibility sighash) documentation, see here:
 * - https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki
 *
 * @param {array}         inputs An array of inputs (type Uint8Array)
 * @param {number}        flag The sighash flag
 * @returns {Uint8Array}  BIP143 hashPrevouts
 */
export function hashPrevouts(inputs, flag) {
  if ((flag & 0x80) === 0x80) {
    return NULL_HASH;
  }

  const preimage = utils.concatUint8Arrays(
    ...inputs.map(BTCUtils.extractOutpoint)
  );
  return BTCUtils.hash256(preimage);
}

/**
 *
 * Hashes sequence according to BIP143 semantics.
 *
 * For BIP143 (Witness and Compatibility sighash) documentation, see here:
 * - https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki
 *
 * @param {array}         inputs An array of inputs (type Uint8Array)
 * @param {number}        flag The sighash flag
 * @returns {Uint8Array}  BIP143 hashSequence
 */
export function hashSequence(inputs, flag) {
  if ((flag & 0x80) === 0x80 || (flag & 0x03) === 0x03) {
    return NULL_HASH;
  }
  const preimage = utils.concatUint8Arrays(
    ...inputs.map(BTCUtils.extractSequenceLELegacy)
  );
  return BTCUtils.hash256(preimage);
}

/**
 *
 * Hashes outputs according to BIP143 semantics.
 *
 * For BIP143 (Witness and Compatibility sighash) documentation, see here:
 * - https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki
 *
 * @param {array}         outputs An array of outputs (type Uint8Array)
 * @returns {Uint8Array}  BIP143 hashOutputs
 */
export function hashOutputs(outputs) {
  if (outputs.length === 0) {
    return NULL_HASH;
  }
  return BTCUtils.hash256(utils.concatUint8Arrays(...outputs));
}

/**
 *
 * Checks if nSequence locks might be active
 *
 * @param {array}         inputs An array of inputs (type Uint8Array)
 * @param {Uint8Array}    locktime 4-byte tx locktime
 * @param {number}        flag The sighash flag
 * @returns {boolean}     True if there is a lock
 */
export function possibleAbsoluteLock(inputs, locktime, flag) {
  if ((flag & 0x80) === 0x80) return true;

  const sequences = inputs.map(BTCUtils.extractSequenceLegacy);

  // if all sequences are UINT_MAX, no locktime is possible
  if (sequences.filter(s => s !== BigInt(0xffffffff)).length === 0) return false;

  const lock = utils.bytesToUint(utils.reverseEndianness(locktime));
  if (lock > BigInt(1550000000) || (lock > BigInt(600000) && lock < BigInt(500000000))) {
    return true;
  }
  return false;
}

/**
 *
 * Checks if nLocktime might be active
 *
 * @param {array}         inputs An array of inputs (type Uint8Array)
 * @param {Uint8Array}    version 4-byte version
 * @returns {boolean}     True if there is a lock
 */
export function possibleRelativeLock(inputs, version) {
  if (version[0] === 1) return false;

  const sequences = inputs.map(BTCUtils.extractSequenceLegacy);
  for (let i = 0; i < sequences.length; i += 1) {
    const disableFlag = (sequences[i] & BigInt(0x80)) === BigInt(0x80);
    if (!disableFlag) return true;
  }
  return false;
}

/**
 *
 * Calculates sighash
 *
 * @dev All args are deserialized
 *
 * @param {tx}            tx The tx
 * @param {number}        index The index
 * @param {number}        sighashFlag The sighash flag
 * @param {Uint8Array}    prevoutScript
 * @param {Uint8Array}    prevoutValue
 * @returns {Sighash}     Data regarding the sighash
 */
export function sighash(tx, index, sighashFlag, prevoutScript, prevoutValue) {
  if (!validateFlag(sighashFlag)) throw Error(`Invalid sighash flag: ${sighashFlag}`);

  if (!BTCUtils.validateVin(tx.vin)) {
    throw Error('Malformatted vin');
  }
  if (!BTCUtils.validateVout(tx.vout)) {
    throw Error('Malformatted vout');
  }

  let inputs = parseVin(tx.vin);
  let outputs = parseVout(tx.vout);

  const currentInput = inputs[index];
  const currentOutput = outputs[index];

  if ((sighashFlag & 0x80) === 0x80) {
    inputs = [currentInput]; // If ACP, just 1 input
  }
  if ((sighashFlag & 0x03) === 0x03) {
    outputs = [currentOutput]; // If SINGLE, just 1 output
  }

  const preimage = utils.concatUint8Arrays(
    tx.version,
    hashPrevouts(inputs, sighashFlag),
    hashSequence(inputs, sighashFlag),
    BTCUtils.extractOutpoint(currentInput),
    prevoutScript,
    prevoutValue,
    BTCUtils.extractSequenceLELegacy(currentInput),
    hashOutputs(outputs),
    tx.locktime,
    new Uint8Array([sighashFlag, 0, 0, 0]), // sighashFlag as LE u32
  );

  return {
    digest: BTCUtils.hash256(preimage),
    sighashFlag,
    possibleAbsoluteLock: possibleAbsoluteLock(inputs, tx.locktime, sighashFlag),
    possibleRelativeLock: possibleRelativeLock(inputs, tx.version),
    updateableOutputs: (sighashFlag & 0x03) === 0x03,
    updateableInputs: (sighashFlag & 0x80) === 0x80,
  };
}

/**
 *
 * Deserializes the args for `sighash` from hex
 *
 * @param {SerTx}         serTx The tx all as hex
 * @param {string}        serPrevoutScript The prevout script as hex
 * @param {string}        serPrevoutValue The prevout value as hex
 * @returns {object}      The tx object (deserialized version, vin, vout and locktime),
 *                        prevoutScript and prevoutValue
 */
export function deserSighashArgs(serTx, serPrevoutScript, serPrevoutValue) {
  const tx = {};
  const txKeys = ['version', 'vin', 'vout', 'locktime'];
  txKeys.forEach((k) => {
    tx[k] = utils.deserializeHex(serTx[k]);
  });

  const prevoutScript = utils.deserializeHex(serPrevoutScript);
  const prevoutValue = utils.deserializeHex(serPrevoutValue);
  return { tx, prevoutScript, prevoutValue };
}

/**
 *
 * Serializes the digest in a sighash object
 *
 * @param {Sighash}       sighashObj Data regarding the sighash
 * @returns {object}      The same sighash object with a serialized digest
 */
export function serSighashObj(sighashObj) {
  return {
    digest: utils.serializeHex(sighashObj.digest),
    sighashFlag: sighashObj.sighashFlag,
    possibleAbsoluteLock: sighashObj.possibleAbsoluteLock,
    possibleRelativeLock: sighashObj.possibleRelativeLock,
    updateableOutputs: sighashObj.updateableOutputs,
    updateableInputs: sighashObj.updateableInputs
  };
}

/**
 *
 * Runs `deserSighashArgs` and then`sighash`
 *
 * @param {RPC}           rpcObj The RPC object
 * @returns {Sighash}     Data regarding the sighash
 */
export function rpcSighash(rpcObj) {
  const {
    tx, index, sighashFlag, prevoutScript, prevoutValue
  } = rpcObj;
  const deser = deserSighashArgs(tx, prevoutScript, prevoutValue);
  const sig = sighash(deser.tx, index, sighashFlag, deser.prevoutScript, deser.prevoutValue);
  return serSighashObj(sig);
}
