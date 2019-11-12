#!/usr/bin/env node

/*!
 * bin/proof - bitcoin SES proofs
 * Copyright (c) 2019, Mark Tyneway (Apache-2.0 License).
 * https://github.com/summa-tx/agoric-bitcoin-spv
 */

'use strict';

const BcoinClient = require('./BcoinClient');
const Config = require('bcfg');
const pkg = require('./package.json');

const ports = {
  main: 8332,
  testnet: 18332,
  regtest: 48332,
  simnet: 18556
};

/**
 * Fetch proofs to create an SPVProof object
 * or a chain of headers.
 *
 * TODO: remove bcoin dep
 */
class CLI {
  constructor() {
    this.config = new Config('bitcoin-verifier-ses', {
      alias: {
        t: 'txid',
        c: 'currency',
        n: 'network',
        e: 'height',
        u: 'url',
        k: 'api-key',
        s: 'ssl',
        h: 'httphost',
        p: 'httpport'
      }
    });

    this.config.load({
      argv: true,
      env: true
    });

    if (this.config.has('help')) {
      this.log(this.help());
      process.exit(0);
    }

    this.argv = this.config.argv;
    this.network = this.config.str('network', 'main');

    this.oracle = {
      url: 'https://api.coinbase.com/v2/exchange-rates',
      query: {currency: 'BTC'}
    }

    this.client = new BcoinClient({
      url: this.config.str('url'),
      apiKey: this.config.str('api-key'),
      ssl: this.config.bool('ssl'),
      host: this.config.str('http-host'),
      port: this.config.uint('http-port')
        || ports[this.network]
        || ports.main
    });
  }

  async open() {
    this.cmd = this.argv.shift();
    switch (this.cmd) {
      case 'proof':
        await this.getProof();
        break;
      case 'headers':
        await this.getHeaders();
        break;
      case 'headersbywork':
        await this.getHeadersByWork();
        break;
      case 'headersbycurrency':
        await this.getHeadersByCurrency();
        break;
      case 'info':
        await this.getInfo();
        break;
      default:
        this.log(this.help(true));
    }
  }

  async destroy() {
    if (this.client && this.client.opened)
      await this.client.close();
  }

  log(json) {
    if (typeof json === 'string')
      return console.log.apply(console, arguments);
    return console.log(JSON.stringify(json, null, 2));
  }

  async getInfo() {
    const info = await this.client.getInfo();
    this.log(info);
  }

  async getProof() {
    const txid = this.config.str(0);

    if (!txid)
      throw new Error('Must pass txid');

    const proof = await this.client.getProof(txid, 'hex');

    this.log(proof);
  }

  // this one is broken!
  // needs to return a string, not json
  async getHeaders() {
    let height = this.config.uint('height');
    const count = this.config.uint(0, 0);

    if (!height) {
      const info = await this.client.getInfo();
      if (!info)
        throw new Error('Must pass --height');

      height = parseInt(info.chain.height);
    }

    const headers = await this.client.getHeaderChainByCount(height, count, 'hex');

    this.log(headers);
  }

  async getHeadersByWork() {
    let height = this.config.uint('height');
    const nwork = this.config.str(0, 0);

    if (!height) {
      const info = await this.client.getInfo();
      if (!info)
        throw new Error('Must pass --height');

      height = info.chain.height;
    }

    const headers = await this.client.getHeadersByWork(height, nwork, 'hex');

    this.log(headers);
  }

  // number of btc in coinbase * current btc price
  async getHeadersByCurrency() {
    const currency = this.config.str('currency', 'USD');
    const price = this.config.str(0, 0);
    let height = this.config.str('height');

    if (!height) {
      const info = await this.client.getInfo();
      if (!info)
        throw new Error('Must pass --height');

      height = info.chain.height;
    }

    const {url, query} = this.oracle;

    const client = new BcoinClient({
      url: this.oracle.url,
      query: query
    });

    // hack
    const info = await client.get('', query);

    if (!info)
      throw new Error('Cannot access prices');

    const rates = info.data.rates;
    let unit = rates[currency.toUpperCase()];
    unit = parseInt(unit, 10);

    if (!unit)
      throw new Error('Cannot access prices');

    const headers = await this.client.getHeadersByCurrency(height, price, unit, 'hex');

    this.log(headers);
  }

  help(err) {
    let str = ''
    if (err)
      str += `Unrecognized command: ${this.cmd}\n`;

    return str
    + 'bitcoin-verifier-ses proof builder\n'
    + `Version: ${pkg.version} Author: ${pkg.author}\n`
    + 'Commands:\n'
    + '  $ proof [txid]: Get SPV Proof\n'
    + '  $ headers [count]: Create Header By Count\n'
    + '  $ headersbywork [work]: Create Header Chain By Work\n'
    + '  $ headersbycurrency [dollars]: Create Header Chain By Dollar\n'
    + '  $ info: Get Node Info\n'
    + 'Flags:\n'
    + '  --network/-n {main|testnet|regtest}\n'
    + '  --url/u <node url>\n'
    + '  --api-key/-k <node api key>\n'
    + '  --ssl/-s {true|false}\n'
    + '  --http-host/-h <http host>\n'
    + '  --http-port/-p <http port>'
    + '  --height/-e <block height>\n'
    + '  --currency/-c <block height>\n';
  }
}

(async () => {
  const cli = new CLI();
  await cli.open();
  await cli.destroy();
})().catch((error) => {
  console.log(error);
  process.exit(1);
});

