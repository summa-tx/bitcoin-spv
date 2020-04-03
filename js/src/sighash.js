/* global BigInt */

import * as utils from './utils';
import * as BTCUtils from './BTCUtils';

const NULL_HASH = new Uint8Array(32);
const U32_MAX = new Uint8Array([0xff, 0xff, 0xff, 0xff]);

export function validateFlag(flag) {
  if (flag !== 0x01 && flag !== 0x03 && flag !== 0x81 && flag !== 0x83) return false;
  return true;
}

// returns an array of uint8arrays.
export function parseVin(vin) {
  const { nIns } = BTCUtils.parseVarInt(vin);
  const inputs = [];
  for (let i = 0; i < nIns; i += 1) {
    inputs.push(BTCUtils.extractInputAtIndex(i));
  }
  return inputs;
}

// returns an array of uint8arrays.
export function parseVout(vout) {
  const { nOuts } = BTCUtils.parseVarInt(vout);
  const outputs = [];
  for (let i = 0; i < nOuts; i += 1) {
    outputs.push(BTCUtils.extractOutputAtIndex(i));
  }
  return outputs;
}

// inputs is an array of Uint8Arrays
export function hashPrevouts(inputs, flag) {
  if ((flag & 0x80) === 0x80) {
    return NULL_HASH;
  }

  const preimage = utils.concatUint8Arrays(
    inputs.map(BTCUtils.extractOutpoint)
  );
  return utils.hash256(preimage);
}

// inputs is an array of Uint8Arrays
export function hashSequence(inputs, flag) {
  if ((flag & 0x80) === 0x80 || (flag & 0x03) === 0x03) {
    return NULL_HASH;
  }
  const preimage = utils.concatUint8Arrays(
    inputs.map(BTCUtils.extractSequenceLELegacy)
  );
  return utils.hash256(preimage);
}

// outputs is an array of Uint8Arrays
export function hashOutputs(outputs) {
  if (outputs.length === 0) {
    return NULL_HASH;
  }
  return utils.hash256(utils.concatUint8Arrays(...outputs));
}

// Check if nSequence locks might be active
export function possibleAbsoluteLock(inputs, locktime, flag) {
  if ((flag && 0x80) === 0x80) return true;

  const sequences = inputs.map(BTCUtils.extractSequenceLegacy);
  if (sequences.filter(s => !utils.typedArraysAreEqual(s, U32_MAX)).length === 0) return false;

  const lock = utils.bytesToUint(locktime);
  if (lock > BigInt(1550000000) || (lock > BigInt(600000) && lock < BigInt(500000000))) {
    return false;
  }
  return true;
}

// Check if nLocktime might be active
export function possibleRelativeLock(inputs, version) {
  if (version[0] === 1) return false;

  const sequences = inputs.map(BTCUtils.extractSequenceLegacy);
  for (let i = 0; i < sequences.length; i += 1) {
    if (!(sequences[i][3] & 0x80) === 0x80) return true;
  }

  return false;
}

// args are all deserialized
export function sighash(tx, index, sighashFlag, prevoutScript, prevoutValue) {
  if (!BTCUtils.validateVin(tx.vin)) {
    throw Error('Malformatted vin');
  }
  if (!BTCUtils.validateVout(tx.vout)) {
    throw Error('Malformatted vout');
  }

  let inputs = parseVin(tx.vin);
  let outputs = parseVout(tx.vout);

  if ((sighashFlag & 0x80) === 0x80) {
    inputs = [inputs[index]]; // If ACP, just 1 input
  }
  if ((sighashFlag & 0x03) === 0x03) {
    outputs = [outputs[index]]; // If SINGLE, just 1 output
  }

  const preimage = utils.concatUint8Arrays(
    tx.version,
    hashPrevouts(inputs, sighashFlag),
    hashSequence(inputs, sighashFlag),
    BTCUtils.extractOutpoint(inputs[index]),
    prevoutScript,
    prevoutValue,
    BTCUtils.extractSequenceLegacy(inputs[index]),
    hashOutputs(outputs),
    tx.locktime,
    new Uint8Array([sighashFlag, 0, 0, 0]), // sighashFlag as LE u32
  );

  return {
    digest: utils.hash256(preimage),
    sighashFlag,
    possibleAbsoluteLock: possibleAbsoluteLock(inputs, tx.locktime, sighashFlag),
    possibleRelativeLock: possibleRelativeLock(inputs, tx.version),
    updateableOutputs: (sighashFlag & 0x03) === 0x03,
    updateableInputs: (sighashFlag & 0x80) === 0x80,
  };
}

// deserializes the args from hex
// serTx is { version, vin, vout, locktime } all as hex
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

// runs `deserSighashArgs` and then `sighash`
export function deserAndSighash(tx, index, sighashFlag, prevoutScript, prevoutValue) {
  const deser = deserSighashArgs(tx, prevoutScript, prevoutValue);
  return sighash(deser.tx, index, sighashFlag, deser.prevoutScript, deser.prevoutValue);
}
