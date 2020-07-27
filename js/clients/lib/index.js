/**
*
* @file Part of the [bitcoin-spv]{@link https://github.com/summa-tx/bitcoin-spv} project
*
* @title index
* @summary List of clients
* @author Mark Tyneway <mark.tyneway@gmail.com>
* @copyright (c) [Summa]{@link https://summa.one} 2019
* @module clients
*
*/

const BcoinClient = require('./BcoinClient');
const Block = require('./vendor/block');
const TX = require('./vendor/tx');

module.exports = {
  BcoinClient,
  Block,
  TX
};