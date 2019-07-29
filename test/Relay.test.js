/* global artifacts contract describe before it assert web3 */
const utils = require('./utils.js');
const REGULAR_CHAIN = require('./headers.json');
const RETARGET_CHAIN = require('./headersWithRetarget.json');
const REORG_AND_RETARGET_CHAIN = require('./headersReorgAndRetarget.json');

const constants = require('./constants.js');

const Relay = artifacts.require('Relay');

contract('Relay', async () => {
  let instance;

  describe('#constructor', async () => {
    const { genesis } = REGULAR_CHAIN;

    before(async () => {
      instance = await Relay.new(
        genesis.hex,
        genesis.height,
        `0x${'11'.repeat(32)}`
      );
    });

    it('errors if the caller is being an idiot', async () => {
      try {
        await Relay.new(
          '0x00',
          genesis.height,
          `0x${'11'.repeat(32)}`
        );
      } catch (e) {
        assert.include(e.message, 'Stop being dumb');
      }
    });

    it('stores genesis block info', async () => {
      let res = await instance.relayGenesis.call();
      assert.equal(res, genesis.digest_le);

      res = await instance.bestKnownDigest.call();
      assert.equal(res, genesis.digest_le);

      res = await instance.lastReorgCommonAncestor.call();
      assert.equal(res, genesis.digest_le);

      res = await instance.findAncestor.call(genesis.digest_le, 0);
      assert.equal(res, genesis.digest_le);

      res = await instance.findHeight.call(genesis.digest_le);
      assert(res.eqn(genesis.height));
    });
  });

  describe('#addHeaders', async () => {
    const { chain, genesis } = REGULAR_CHAIN;
    const headerHex = chain.map(header => header.hex);

    const headers = utils.concatenateHexStrings(headerHex.slice(0, 6));

    before(async () => {
      instance = await Relay.new(
        genesis.hex,
        genesis.height,
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
        await instance.addHeaders(genesis.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Unexpected retarget on external call');
      }
    });

    it('errors if the header array is not a multiple of 80 bytes', async () => {
      try {
        // 3 extra bytes on the end
        const badHeaders = headers.substring(0, 8 + 5 * 160);
        await instance.addHeaders(genesis.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Header array length must be divisible by 80');
      }
    });

    it('errors if the header bytestring is less than 5 headers', async () => {
      try {
        const badHeaders = headers.substring(0, 162);
        await instance.addHeaders(genesis.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Must supply at least 5 headers');
      }
    });

    it('errors if a header work is too low', async () => {
      try {
        const badHeaders = `${headers}${'00'.repeat(80)}`;
        await instance.addHeaders(genesis.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Header work is insufficient');
      }
    });

    it('errors if the target changes mid-chain', async () => {
      try {
        const badHeaders = utils.concatenateHexStrings([headers, REGULAR_CHAIN.badHeader.hex]);
        await instance.addHeaders(genesis.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Target changed unexpectedly');
      }
    });

    it('errors if a prevhash link is broken', async () => {
      try {
        const badHeaders = utils.concatenateHexStrings([headers, chain[15].hex]);
        await instance.addHeaders(genesis.hex, badHeaders);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Headers not a consistent chain');
      }
    });

    it('appends new links to the chain and fires an event', async () => {
      const blockNumber = await web3.eth.getBlock('latest').number;

      await instance.addHeaders(genesis.hex, headers);

      const res = await instance.findHeight.call(chain[0].digest_le);
      assert(res.eqn(genesis.height + 1));

      const eventList = await instance.getPastEvents(
        'Extension',
        { fromBlock: blockNumber, toBlock: 'latest' }
      );
      /* eslint-disable-next-line no-underscore-dangle */
      assert.equal(eventList[0].returnValues._last, chain[5].digest_le);
    });

    it('skips some validation steps for known blocks', async () => {
      const oneMoreHeader = utils.concatenateHexStrings([headers, headerHex[6]]);
      await instance.addHeaders(genesis.hex, oneMoreHeader);
    });
  });

  describe('#addHeadersWithRetarget', async () => {
    const { chain } = RETARGET_CHAIN;
    const headerHex = chain.map(header => header.hex);
    const genesis = chain[1];

    const firstHeader = RETARGET_CHAIN.oldPeriodStart;
    const lastHeader = chain[8];
    const preChange = utils.concatenateHexStrings(headerHex.slice(2, 9));
    const headers = utils.concatenateHexStrings(headerHex.slice(9, 15));

    // let btcutils

    before(async () => {
      // btcutils = await BTCUtils.new()
      instance = await Relay.new(
        genesis.hex,
        genesis.height,
        firstHeader.digest_le
      );
      await instance.addHeaders(genesis.hex, preChange);
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
        await instance.addHeadersWithRetarget(firstHeader.hex, chain[15].hex, headers);
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

    it('errors if the retarget is performed incorrectly', async () => {
      const tmpInstance = await Relay.new(
        genesis.hex,
        lastHeader.height, // This is a lie
        firstHeader.digest_le
      );
      try {
        await tmpInstance.addHeadersWithRetarget(firstHeader.hex, genesis.hex, headers);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Invalid retarget provided');
      }
    });

    it('appends new links to the chain', async () => {
      await instance.addHeadersWithRetarget(
        firstHeader.hex,
        lastHeader.hex,
        headers
      );

      const res = await instance.findHeight.call(chain[10].digest_le);
      assert(res.eqn(lastHeader.height + 2));
    });
  });

  describe('#findHeight', async () => {
    const { chain, genesis } = REGULAR_CHAIN;
    const headerHex = chain.map(header => header.hex);
    const headers = utils.concatenateHexStrings(headerHex.slice(0, 6));

    before(async () => {
      instance = await Relay.new(
        genesis.hex,
        genesis.height,
        `0x${'11'.repeat(32)}`
      );
      await instance.addHeaders(genesis.hex, headers);
    });

    it('errors on unknown blocks', async () => {
      try {
        await instance.findHeight(`0x${'00'.repeat(32)}`);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Unknown block');
      }
    });

    it('Finds height of known blocks', async () => {
      for (let i; i < chain.length; i += 1) {
        /* eslint-disable-next-line camelcase */
        const { digest_le, height } = chain[i];
        /* eslint-disable-next-line no-await-in-loop */
        const res = await instance.findHeight(digest_le);
        assert(res.eqn(height), `incorrect height returned ${height}`);
      }
    });
  });

  describe('#findAncestor', async () => {
    const { chain, genesis } = REGULAR_CHAIN;
    const headerHex = chain.map(header => header.hex);
    const headers = utils.concatenateHexStrings(headerHex.slice(0, 6));

    before(async () => {
      instance = await Relay.new(
        genesis.hex,
        genesis.height,
        `0x${'11'.repeat(32)}`
      );
      await instance.addHeaders(genesis.hex, headers);
    });

    it('errors on unknown blocks', async () => {
      try {
        await instance.findAncestor(`0x${'00'.repeat(32)}`, 3);
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Unknown ancestor');
      }
    });

    it('Finds known ancestors based on on offsets', async () => {
      for (let i; i < chain.length; i += 1) {
        /* eslint-disable-next-line camelcase */
        const { digest_le } = chain[i];
        /* eslint-disable-next-line no-await-in-loop */
        let res = await instance.findAncestor(digest_le, 0);
        assert.equal(res, digest_le);
        if (i > 0) {
          /* eslint-disable-next-line no-await-in-loop */
          res = await instance.findAncestor(digest_le, 1);
          assert.equal(res, chain[i - 1].digest_le);
        }
      }
    });
  });

  describe('#isAncestor', async () => {
    const { chain, genesis } = REGULAR_CHAIN;
    const headerHex = chain.map(header => header.hex);
    const headers = utils.concatenateHexStrings(headerHex.slice(0, 6));

    before(async () => {
      instance = await Relay.new(
        genesis.hex,
        genesis.height,
        `0x${'11'.repeat(32)}`
      );
      await instance.addHeaders(genesis.hex, headers);
    });

    it('returns false if it exceeds the limit', async () => {
      const res = await instance.isAncestor.call(genesis.digest_le, chain[3].digest_le, 1);
      assert.isFalse(res);
    });

    it('finds the ancestor if within the limit', async () => {
      const res = await instance.isAncestor.call(genesis.digest_le, chain[3].digest_le, 5);
      assert.isTrue(res);
    });
  });

  describe('#heaviestFromAncestor', async () => {
    const { chain, genesis } = REGULAR_CHAIN;
    const headerHex = chain.map(header => header.hex);
    const headers = utils.concatenateHexStrings(headerHex.slice(0, 8));
    const headersWithMain = utils.concatenateHexStrings([headers, chain[8].hex]);
    const headersWithOrphan = utils.concatenateHexStrings(
      [headers, REGULAR_CHAIN.orphan_562630.hex]
    );

    before(async () => {
      instance = await Relay.new(
        genesis.hex,
        genesis.height,
        `0x${'11'.repeat(32)}`
      );
      await instance.addHeaders(genesis.hex, headersWithMain);
      await instance.addHeaders(genesis.hex, headersWithOrphan);
    });

    it('errors if ancestor is unknown', async () => {
      try {
        await instance.heaviestFromAncestor(
          chain[10].digest_le,
          headerHex[3],
          headerHex[4]
        );
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Unknown block');
      }
    });

    it('errors if left is unknown', async () => {
      try {
        await instance.heaviestFromAncestor(
          chain[3].digest_le,
          chain[10].hex,
          headerHex[4]
        );
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Unknown block');
      }
    });

    it('errors if right is unknown', async () => {
      try {
        await instance.heaviestFromAncestor(
          chain[3].digest_le,
          headerHex[4],
          chain[10].hex
        );
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Unknown block');
      }
    });

    it('errors if either block is below the ancestor', async () => {
      try {
        await instance.heaviestFromAncestor(
          chain[3].digest_le,
          headerHex[2],
          headerHex[4]
        );
        assert(false);
      } catch (e) {
        assert.include(e.message, 'A descendant height is below the ancestor height');
      }

      try {
        await instance.heaviestFromAncestor(
          chain[3].digest_le,
          headerHex[4],
          headerHex[2]
        );
        assert(false);
      } catch (e) {
        assert.include(e.message, 'A descendant height is below the ancestor height');
      }
    });

    it('returns left if left is heavier', async () => {
      const res = await instance.heaviestFromAncestor(
        chain[3].digest_le,
        headerHex[5],
        headerHex[4]
      );
      assert.equal(res, chain[5].digest_le);
    });

    it('returns right if right is heavier', async () => {
      const res = await instance.heaviestFromAncestor(
        chain[3].digest_le,
        headerHex[4],
        headerHex[5]
      );
      assert.equal(res, chain[5].digest_le);
    });

    it('returns left if the weights are equal', async () => {
      let res = await instance.heaviestFromAncestor(
        chain[3].digest_le,
        chain[8].hex,
        REGULAR_CHAIN.orphan_562630.hex
      );
      assert.equal(res, chain[8].digest_le);

      res = await instance.heaviestFromAncestor(
        chain[3].digest_le,
        REGULAR_CHAIN.orphan_562630.hex,
        chain[8].hex
      );
      assert.equal(res, REGULAR_CHAIN.orphan_562630.digest_le);
    });
  });

  describe('#heaviestFromAncestor (with retarget)', async () => {
    const PRE_CHAIN = REORG_AND_RETARGET_CHAIN.preRetargetChain;
    const POST_CHAIN = REORG_AND_RETARGET_CHAIN.postRetargetChain;

    const orphan = REORG_AND_RETARGET_CHAIN.orphan_437478;
    const preHex = PRE_CHAIN.map(header => header.hex);
    const pre = utils.concatenateHexStrings(preHex);
    const postHex = POST_CHAIN.map(header => header.hex);
    const post = utils.concatenateHexStrings(postHex.slice(0, -2));
    const postWithOrphan = utils.concatenateHexStrings([post, orphan.hex]);
    const lastTwo = POST_CHAIN.slice(-2);
    const postWithoutOrphan = utils.concatenateHexStrings([post, lastTwo[0].hex, lastTwo[1].hex]);

    before(async () => {
      instance = await Relay.new(
        REORG_AND_RETARGET_CHAIN.genesis.hex,
        REORG_AND_RETARGET_CHAIN.genesis.height,
        REORG_AND_RETARGET_CHAIN.oldPeriodStart.digest_le
      );
      await instance.addHeaders(
        REORG_AND_RETARGET_CHAIN.genesis.hex,
        pre
      );
      await instance.addHeadersWithRetarget(
        REORG_AND_RETARGET_CHAIN.oldPeriodStart.hex,
        preHex.slice(-1)[0],
        postWithoutOrphan
      );
      await instance.addHeadersWithRetarget(
        REORG_AND_RETARGET_CHAIN.oldPeriodStart.hex,
        preHex.slice(-1)[0],
        postWithOrphan
      );
    });

    it('handles descendants in different difficulty periods', async () => {
      let res = await instance.heaviestFromAncestor.call(
        REORG_AND_RETARGET_CHAIN.genesis.digest_le,
        orphan.hex,
        preHex[3]
      );
      assert.equal(res, orphan.digest_le);

      res = await instance.heaviestFromAncestor.call(
        REORG_AND_RETARGET_CHAIN.genesis.digest_le,
        preHex[3],
        orphan.hex
      );
      assert.equal(res, orphan.digest_le);
    });

    it('handles descendants when both are in a new difficulty period', async () => {
      let res = await instance.heaviestFromAncestor.call(
        REORG_AND_RETARGET_CHAIN.genesis.digest_le,
        orphan.hex,
        postHex[3]
      );
      assert.equal(res, orphan.digest_le);

      res = await instance.heaviestFromAncestor.call(
        REORG_AND_RETARGET_CHAIN.genesis.digest_le,
        postHex[3],
        orphan.hex
      );
      assert.equal(res, orphan.digest_le);
    });
  });

  describe('#isMostRecentAncestor', async () => {
    const PRE_CHAIN = REORG_AND_RETARGET_CHAIN.preRetargetChain;
    const POST_CHAIN = REORG_AND_RETARGET_CHAIN.postRetargetChain;

    const orphan = REORG_AND_RETARGET_CHAIN.orphan_437478;
    const preHex = PRE_CHAIN.map(header => header.hex);
    const pre = utils.concatenateHexStrings(preHex);
    const postHex = POST_CHAIN.map(header => header.hex);
    const post = utils.concatenateHexStrings(postHex.slice(0, -2));
    const postWithOrphan = utils.concatenateHexStrings([post, orphan.hex]);
    const lastTwo = POST_CHAIN.slice(-2);
    const postWithoutOrphan = utils.concatenateHexStrings([post, lastTwo[0].hex, lastTwo[1].hex]);

    before(async () => {
      instance = await Relay.new(
        REORG_AND_RETARGET_CHAIN.genesis.hex,
        REORG_AND_RETARGET_CHAIN.genesis.height,
        REORG_AND_RETARGET_CHAIN.oldPeriodStart.digest_le
      );
      await instance.addHeaders(
        REORG_AND_RETARGET_CHAIN.genesis.hex,
        pre
      );
      await instance.addHeadersWithRetarget(
        REORG_AND_RETARGET_CHAIN.oldPeriodStart.hex,
        preHex.slice(-1)[0],
        postWithoutOrphan
      );
      await instance.addHeadersWithRetarget(
        REORG_AND_RETARGET_CHAIN.oldPeriodStart.hex,
        preHex.slice(-1)[0],
        postWithOrphan
      );
    });

    it('returns false if it found a more recent ancestor', async () => {
      const res = await instance.isMostRecentAncestor(
        POST_CHAIN[0].digest_le,
        POST_CHAIN[3].digest_le,
        POST_CHAIN[2].digest_le,
        5
      );
      assert.isFalse(res);
    });

    it('returns false if it did not find the specified common ancestor within the limit', async () => {
      const res = await instance.isMostRecentAncestor(
        POST_CHAIN[1].digest_le,
        POST_CHAIN[3].digest_le,
        POST_CHAIN[2].digest_le,
        1
      );
      assert.isFalse(res);
    });

    it('returns true if the provided digest is the most recent common ancestor', async () => {
      let res = await instance.isMostRecentAncestor(
        POST_CHAIN[2].digest_le,
        POST_CHAIN[3].digest_le,
        POST_CHAIN[2].digest_le,
        5
      );
      assert.isTrue(res);

      res = await instance.isMostRecentAncestor(
        POST_CHAIN[5].digest_le,
        POST_CHAIN[6].digest_le,
        orphan.digest_le,
        5
      );
      assert.isTrue(res);
    });

    it('shortcuts the trivial case (ancestor is left is right)', async () => {
      const res = await instance.isMostRecentAncestor(
        POST_CHAIN[3].digest_le,
        POST_CHAIN[3].digest_le,
        POST_CHAIN[3].digest_le,
        5
      );
      assert.isTrue(res);
    });
  });

  describe('#markNewHeaviest', async () => {
    const PRE_CHAIN = REORG_AND_RETARGET_CHAIN.preRetargetChain;
    const POST_CHAIN = REORG_AND_RETARGET_CHAIN.postRetargetChain;

    const orphan = REORG_AND_RETARGET_CHAIN.orphan_437478;
    const preHex = PRE_CHAIN.map(header => header.hex);
    const pre = utils.concatenateHexStrings(preHex);
    const postHex = POST_CHAIN.map(header => header.hex);
    const post = utils.concatenateHexStrings(postHex.slice(0, -2));
    const postWithOrphan = utils.concatenateHexStrings([post, orphan.hex]);
    const lastTwo = POST_CHAIN.slice(-2);
    const postWithoutOrphan = utils.concatenateHexStrings([post, lastTwo[0].hex, lastTwo[1].hex]);

    before(async () => {
      instance = await Relay.new(
        REORG_AND_RETARGET_CHAIN.genesis.hex,
        REORG_AND_RETARGET_CHAIN.genesis.height,
        REORG_AND_RETARGET_CHAIN.oldPeriodStart.digest_le
      );
      await instance.addHeaders(
        REORG_AND_RETARGET_CHAIN.genesis.hex,
        pre
      );
      await instance.addHeadersWithRetarget(
        REORG_AND_RETARGET_CHAIN.oldPeriodStart.hex,
        preHex.slice(-1)[0],
        postWithoutOrphan
      );
      await instance.addHeadersWithRetarget(
        REORG_AND_RETARGET_CHAIN.oldPeriodStart.hex,
        preHex.slice(-1)[0],
        postWithOrphan
      );
    });

    it('errors if the passed in best is not the best known', async () => {
      try {
        await instance.markNewHeaviest(
          REORG_AND_RETARGET_CHAIN.oldPeriodStart.digest_le,
          REORG_AND_RETARGET_CHAIN.oldPeriodStart.hex,
          REORG_AND_RETARGET_CHAIN.oldPeriodStart.hex,
          10
        );
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Passed in best is not best known');
      }
    });

    it('errors if the new best is not already known', async () => {
      try {
        await instance.markNewHeaviest(
          REORG_AND_RETARGET_CHAIN.genesis.digest_le,
          REORG_AND_RETARGET_CHAIN.genesis.hex,
          `0x${'99'.repeat(80)}`,
          10
        );
        assert(false);
      } catch (e) {
        assert.include(e.message, 'New best is unknown');
      }
    });

    it('errors if the ancestor is not the heaviest common ancestor', async () => {
      await instance.markNewHeaviest(
        REORG_AND_RETARGET_CHAIN.genesis.digest_le,
        REORG_AND_RETARGET_CHAIN.genesis.hex,
        PRE_CHAIN[0].hex,
        10
      );
      try {
        await instance.markNewHeaviest(
          REORG_AND_RETARGET_CHAIN.genesis.digest_le,
          PRE_CHAIN[0].hex,
          PRE_CHAIN[1].hex,
          10
        );
        assert(false);
      } catch (e) {
        assert.include(e.message, 'Ancestor must be heaviest common ancestor');
      }
    });

    it('updates the best known and emits a reorg event', async () => {
      const blockNumber = await web3.eth.getBlock('latest').number;
      await instance.markNewHeaviest(
        PRE_CHAIN[0].digest_le,
        PRE_CHAIN[0].hex,
        orphan.hex,
        20
      );
      const eventList = await instance.getPastEvents(
        'Reorg',
        { fromBlock: blockNumber, toBlock: 'latest' }
      );
      /* eslint-disable no-underscore-dangle */
      assert.equal(eventList[0].returnValues._to, orphan.digest_le);
      assert.equal(eventList[0].returnValues._from, PRE_CHAIN[0].digest_le);
      assert.equal(eventList[0].returnValues._gcd, PRE_CHAIN[0].digest_le);
      /* eslint-enable no-underscore-dangle */
    });

    it('errors if the new best hash is not better', async () => {
      try {
        await instance.markNewHeaviest(
          POST_CHAIN.slice(-3)[0].digest_le, // the main chain before the split
          orphan.hex,
          POST_CHAIN.slice(-2)[0].hex, // the main chain competing with the split
          10
        );
        assert(false);
      } catch (e) {
        assert.include(e.message, 'New best hash does not have more work than previous');
      }
    });
  });
});
