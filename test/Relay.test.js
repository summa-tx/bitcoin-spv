/* global artifacts contract describe before it assert */
const utils = require('./utils.js');
const REGULAR_CHAIN = require('./headers.json');
const RETARGET_CHAIN = require('./headersWithRetarget.json');
const constants = require('./constants.js');

const Relay = artifacts.require('Relay');

contract('Relay', async () => {
  let instance;


  describe('#constructor', async () => {
    const GENESIS = REGULAR_CHAIN.genesis;

    before(async () => {
      instance = await Relay.new(
        GENESIS.hex,
        GENESIS.height,
        `0x${'11'.repeat(32)}`
      );
    });

    it('stores genesis block info', async () => {
      let res = await instance.relayGenesis.call();
      assert.equal(res, GENESIS.digest_le);

      res = await instance.bestKnownDigest.call();
      assert.equal(res, GENESIS.digest_le);

      res = await instance.lastReorgCommonAncestor.call();
      assert.equal(res, GENESIS.digest_le);

      res = await instance.findAncestor.call(GENESIS.digest_le, 0);
      assert.equal(res, GENESIS.digest_le);

      res = await instance.findHeight.call(GENESIS.digest_le);
      assert(res.eqn(GENESIS.height));
    });
  });

  describe('#addHeaders', async () => {
    const CHAIN = REGULAR_CHAIN.chain;
    const GENESIS = REGULAR_CHAIN.genesis;
    const HEADER_HEX = CHAIN.map(header => header.hex);

    const headers = utils.concatenateHexStrings(HEADER_HEX.slice(0, 6));

    before(async () => {
      instance = await Relay.new(
        GENESIS.hex,
        GENESIS.height,
        `0x${'11'.repeat(32)}`
      );
    });

    it('errors if the anchor is unknown', async () => {
      try {
        await instance.addHeaders('0x00', headers);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Unknown block');
      }
    });

    it('errors if it encounters a retarget on an external call', async () => {
      try {
        const badHeaders = constants.HEADER_ERR.HEADER_CHAIN_INVALID_PREVHASH;
        await instance.addHeaders(GENESIS.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Unexpected retarget on external call');
      }
    });

    it('errors if the header array is not a multiple of 80 bytes', async () => {
      try {
        // 3 extra bytes on the end
        const badHeaders = headers.substring(0, 8 + 5 * 160);
        await instance.addHeaders(GENESIS.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Header array length must be divisible by 80');
      }
    });

    it('errors if the header bytestring is less than 5 headers', async () => {
      try {
        const badHeaders = headers.substring(0, 162);
        await instance.addHeaders(GENESIS.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Must supply at least 5 headers');
      }
    });

    it('errors if a header work is too low', async () => {
      try {
        const badHeaders = `${headers}${'00'.repeat(80)}`;
        await instance.addHeaders(GENESIS.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Header work is insufficient');
      }
    });

    it('errors if the target changes mid-chain', async () => {
      try {
        const badHeaders = utils.concatenateHexStrings([headers, REGULAR_CHAIN.badHeader.hex]);
        await instance.addHeaders(GENESIS.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Target changed unexpectedly');
      }
    });

    it('errors if a prevhash link is broken', async () => {
      try {
        const badHeaders = utils.concatenateHexStrings([headers, CHAIN[15].hex]);
        await instance.addHeaders(GENESIS.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Headers not a consistent chain');
      }
    });

    it('appends new links to the chain', async () => {
      await instance.addHeaders(GENESIS.hex, headers);

      const res = await instance.findHeight.call(CHAIN[0].digest_le);
      assert(res.eqn(GENESIS.height + 1));
    });
  });

  describe('#addHeadersWithRetarget', async () => {
    const CHAIN = RETARGET_CHAIN.chain;
    const HEADER_HEX = CHAIN.map(header => header.hex);
    const GENESIS = CHAIN[1];

    const firstHeader = RETARGET_CHAIN.oldPeriodStart;
    const lastHeader = CHAIN[8];
    const preChange = utils.concatenateHexStrings(HEADER_HEX.slice(2, 9));
    const headers = utils.concatenateHexStrings(HEADER_HEX.slice(9, 15));

    // let btcutils

    before(async () => {
      // btcutils = await BTCUtils.new()
      instance = await Relay.new(
        GENESIS.hex,
        GENESIS.height,
        firstHeader.digest_le
      );
      await instance.addHeaders(GENESIS.hex, preChange);
    });

    it('errors if the old period start header is unknown', async () => {
      try {
        await instance.addHeadersWithRetarget('0x00', lastHeader.hex, headers);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Unknown block');
      }
    });

    it('errors if the old period end header is unknown', async () => {
      try {
        await instance.addHeadersWithRetarget(firstHeader.hex, CHAIN[15].hex, headers);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Unknown block');
      }
    });

    it('errors if the provided last header does not match records', async () => {
      try {
        await instance.addHeadersWithRetarget(firstHeader.hex, firstHeader.hex, headers);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Must provide the last header of the closing difficulty period');
      }
    });

    it('errors if the start and end headers are not exactly 2015 blocks apart', async () => {
      try {
        await instance.addHeadersWithRetarget(lastHeader.hex, lastHeader.hex, headers);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Must provide exactly 1 difficulty period');
      }
    });

    it.skip('errors if the retarget is performed incorrectly', async () => {
      // very hard to test
    });

    it('appends new links to the chain', async () => {
      await instance.addHeadersWithRetarget(
        firstHeader.hex,
        lastHeader.hex,
        headers
      );

      const res = await instance.findHeight.call(CHAIN[10].digest_le);
      assert(res.eqn(lastHeader.height + 2));
    });
  });

  describe('#', async () => {
    it.skip('', async () => {

    });
  });
});
