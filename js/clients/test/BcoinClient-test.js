import * as chai from 'chai';
const { assert } = chai;

const BcoinClient = require('../lib/BcoinClient');

describe('BcoinClient', () => {
  it('needs tests. this is a placeholder', () => {
    const client = new BcoinClient({});

    assert.strictEqual(typeof client, 'object');
  });
});
