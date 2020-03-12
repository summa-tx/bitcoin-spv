/*!
 * bclient@0.1.7 - Bcoin node and wallet client
 * Copyright (c) 2019, Christopher Jeffrey (MIT)
 * https://github.com/bcoin-org/bclient
 *
 * License for bclient@0.1.7:
 *
 * This software is licensed under the MIT License.
 *
 * Copyright (c) 2017, Christopher Jeffrey (https://github.com/chjj)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * License for bsert@0.0.10:
 *
 * This software is licensed under the MIT License.
 *
 * Copyright (c) 2018, Christopher Jeffrey (https://github.com/chjj)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * License for bcurl@0.1.6:
 *
 * This software is licensed under the MIT License.
 *
 * Copyright (c) 2017, Christopher Jeffrey (https://github.com/chjj)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * License for bsock@0.1.9:
 *
 * This software is licensed under the MIT License.
 *
 * Copyright (c) 2017, Christopher Jeffrey (https://github.com/chjj)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * License for brq@0.1.8:
 *
 * This software is licensed under the MIT License.
 *
 * Copyright (c) 2017, Christopher Jeffrey (https://github.com/chjj)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

const __node_modules__ = [
  ['bclient', '/lib/bclient.js', function (exports, module, __filename, __dirname, __meta) {
    /*!
 * bclient.js - http clients for bcoin
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */


    exports.NodeClient = __node_require__(1 /* './node' */);
    exports.WalletClient = __node_require__(19 /* './wallet' */);
  }],
  ['bclient', '/lib/node.js', function (exports, module, __filename, __dirname, __meta) {
    /*!
 * client.js - http client for wallets
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */


    const assert = __node_require__(2 /* 'bsert' */);
    const { Client } = __node_require__(3 /* 'bcurl' */);

    /**
 * Node Client
 * @extends {bcurl.Client}
 */

    class NodeClient extends Client {
      /**
   * Creat a node client.
   * @param {Object?} options
   */

      constructor(options) {
        super(options);
      }

      /**
   * Auth with server.
   * @returns {Promise}
   */

      async auth() {
        await this.call('auth', this.password);
        await this.watchChain();
        await this.watchMempool();
      }

      /**
   * Make an RPC call.
   * @returns {Promise}
   */

      execute(name, params) {
        return super.execute('/', name, params);
      }

      /**
   * Get a mempool snapshot.
   * @returns {Promise}
   */

      getMempool() {
        return this.get('/mempool');
      }

      /**
   * Get some info about the server (network and version).
   * @returns {Promise}
   */

      getInfo() {
        return this.get('/');
      }

      /**
   * Get coins that pertain to an address from the mempool or chain database.
   * Takes into account spent coins in the mempool.
   * @param {String} address
   * @returns {Promise}
   */

      getCoinsByAddress(address) {
        assert(typeof address === 'string');
        return this.get(`/coin/address/${address}`);
      }

      /**
   * Get coins that pertain to addresses from the mempool or chain database.
   * Takes into account spent coins in the mempool.
   * @param {String[]} addresses
   * @returns {Promise}
   */

      getCoinsByAddresses(addresses) {
        assert(Array.isArray(addresses));
        return this.post('/coin/address', { addresses });
      }

      /**
   * Retrieve a coin from the mempool or chain database.
   * Takes into account spent coins in the mempool.
   * @param {Hash} hash
   * @param {Number} index
   * @returns {Promise}
   */

      getCoin(hash, index) {
        assert(typeof hash === 'string');
        assert((index >>> 0) === index);
        return this.get(`/coin/${hash}/${index}`);
      }

      /**
   * Retrieve transactions pertaining to an
   * address from the mempool or chain database.
   * @param {String} address
   * @returns {Promise}
   */

      getTXByAddress(address) {
        assert(typeof address === 'string');
        return this.get(`/tx/address/${address}`);
      }

      /**
   * Retrieve transactions pertaining to
   * addresses from the mempool or chain database.
   * @param {String[]} addresses
   * @returns {Promise}
   */

      getTXByAddresses(addresses) {
        assert(Array.isArray(addresses));
        return this.post('/tx/address', { addresses });
      }

      /**
   * Retrieve a transaction from the mempool or chain database.
   * @param {Hash} hash
   * @returns {Promise}
   */

      getTX(hash) {
        assert(typeof hash === 'string');
        return this.get(`/tx/${hash}`);
      }

      /**
   * Retrieve a block from the chain database.
   * @param {Hash|Number} block
   * @returns {Promise}
   */

      getBlock(block) {
        assert(typeof block === 'string' || typeof block === 'number');
        return this.get(`/block/${block}`);
      }

      /**
   * Add a transaction to the mempool and broadcast it.
   * @param {TX} tx
   * @returns {Promise}
   */

      broadcast(tx) {
        assert(typeof tx === 'string');
        return this.post('/broadcast', { tx });
      }

      /**
   * Reset the chain.
   * @param {Number} height
   * @returns {Promise}
   */

      reset(height) {
        return this.post('/reset', { height });
      }

      /**
   * Watch the blockchain.
   * @private
   * @returns {Promise}
   */

      watchChain() {
        return this.call('watch chain');
      }

      /**
   * Watch the blockchain.
   * @private
   * @returns {Promise}
   */

      watchMempool() {
        return this.call('watch mempool');
      }

      /**
   * Get chain tip.
   * @returns {Promise}
   */

      getTip() {
        return this.call('get tip');
      }

      /**
   * Get chain entry.
   * @param {Hash} hash
   * @returns {Promise}
   */

      getEntry(block) {
        return this.call('get entry', block);
      }

      /**
   * Get hashes.
   * @param {Number} [start=-1]
   * @param {Number} [end=-1]
   * @returns {Promise}
   */

      getHashes(start, end) {
        return this.call('get hashes', start, end);
      }

      /**
   * Send a transaction. Do not wait for promise.
   * @param {TX} tx
   * @returns {Promise}
   */

      send(tx) {
        assert(Buffer.isBuffer(tx));
        return this.call('send', tx);
      }

      /**
   * Set bloom filter.
   * @param {Bloom} filter
   * @returns {Promise}
   */

      setFilter(filter) {
        assert(Buffer.isBuffer(filter));
        return this.call('set filter', filter);
      }

      /**
   * Add data to filter.
   * @param {Buffer} data
   * @returns {Promise}
   */

      addFilter(chunks) {
        if (!Array.isArray(chunks)) { chunks = [chunks]; }

        return this.call('add filter', chunks);
      }

      /**
   * Reset filter.
   * @returns {Promise}
   */

      resetFilter() {
        return this.call('reset filter');
      }

      /**
   * Esimate smart fee.
   * @param {Number?} blocks
   * @returns {Promise}
   */

      estimateFee(blocks) {
        assert(blocks == null || typeof blocks === 'number');
        return this.call('estimate fee', blocks);
      }

      /**
   * Rescan for any missed transactions.
   * @param {Number|Hash} start - Start block.
   * @returns {Promise}
   */

      rescan(start) {
        if (start == null) { start = 0; }

        assert(typeof start === 'number' || typeof start === 'string');

        return this.call('rescan', start);
      }
    }

    /*
 * Expose
 */

    module.exports = NodeClient;
  }],
  ['bsert', '/lib/assert.js', function (exports, module, __filename, __dirname, __meta) {
    /*!
 * assert.js - assertions for javascript
 * Copyright (c) 2018, Christopher Jeffrey (MIT License).
 * https://github.com/chjj/bsert
 */


    /**
 * AssertionError
 */

    class AssertionError extends Error {
      constructor(options) {
        if (typeof options === 'string') { options = { message: options }; }

        if (options === null || typeof options !== 'object') { options = {}; }

        let message = null;
        let operator = 'fail';
        let generatedMessage = Boolean(options.generatedMessage);

        if (options.message != null) { message = toString(options.message); }

        if (typeof options.operator === 'string') { operator = options.operator; }

        if (message == null) {
          if (operator === 'fail') {
            message = 'Assertion failed.';
          } else {
            const a = stringify(options.actual);
            const b = stringify(options.expected);

            message = `${a} ${operator} ${b}`;
          }

          generatedMessage = true;
        }

        super(message);

        let start = this.constructor;

        if (typeof options.stackStartFunction === 'function') { start = options.stackStartFunction; } else if (typeof options.stackStartFn === 'function') { start = options.stackStartFn; }

        this.type = 'AssertionError';
        this.name = 'AssertionError [ERR_ASSERTION]';
        this.code = 'ERR_ASSERTION';
        this.generatedMessage = generatedMessage;
        this.actual = options.actual;
        this.expected = options.expected;
        this.operator = operator;

        if (Error.captureStackTrace) { Error.captureStackTrace(this, start); }
      }
    }

    /*
 * Assert
 */

    function assert(value, message) {
      if (!value) {
        let generatedMessage = false;

        if (arguments.length === 0) {
          message = 'No value argument passed to `assert()`.';
          generatedMessage = true;
        } else if (message == null) {
          message = 'Assertion failed.';
          generatedMessage = true;
        } else if (isError(message)) {
          throw message;
        }

        throw new AssertionError({
          message,
          actual: value,
          expected: true,
          operator: '==',
          generatedMessage,
          stackStartFn: assert
        });
      }
    }

    function equal(actual, expected, message) {
      if (!Object.is(actual, expected)) {
        if (isError(message)) { throw message; }

        throw new AssertionError({
          message,
          actual,
          expected,
          operator: 'strictEqual',
          stackStartFn: equal
        });
      }
    }

    function notEqual(actual, expected, message) {
      if (Object.is(actual, expected)) {
        if (isError(message)) { throw message; }

        throw new AssertionError({
          message,
          actual,
          expected,
          operator: 'notStrictEqual',
          stackStartFn: notEqual
        });
      }
    }

    function fail(message) {
      let generatedMessage = false;

      if (isError(message)) { throw message; }

      if (message == null) {
        message = 'Assertion failed.';
        generatedMessage = true;
      }

      throw new AssertionError({
        message,
        actual: false,
        expected: true,
        operator: 'fail',
        generatedMessage,
        stackStartFn: fail
      });
    }

    function throws(func, expected, message) {
      if (typeof expected === 'string') {
        message = expected;
        expected = undefined;
      }

      let thrown = false;
      let err = null;

      enforce(typeof func === 'function', 'func', 'function');

      try {
        func();
      } catch (e) {
        thrown = true;
        err = e;
      }

      if (!thrown) {
        let generatedMessage = false;

        if (message == null) {
          message = 'Missing expected exception.';
          generatedMessage = true;
        }

        throw new AssertionError({
          message,
          actual: undefined,
          expected,
          operator: 'throws',
          generatedMessage,
          stackStartFn: throws
        });
      }

      if (!testError(err, expected, message, throws)) { throw err; }
    }

    function doesNotThrow(func, expected, message) {
      if (typeof expected === 'string') {
        message = expected;
        expected = undefined;
      }

      let thrown = false;
      let err = null;

      enforce(typeof func === 'function', 'func', 'function');

      try {
        func();
      } catch (e) {
        thrown = true;
        err = e;
      }

      if (!thrown) { return; }

      if (testError(err, expected, message, doesNotThrow)) {
        let generatedMessage = false;

        if (message == null) {
          message = 'Got unwanted exception.';
          generatedMessage = true;
        }

        throw new AssertionError({
          message,
          actual: err,
          expected,
          operator: 'doesNotThrow',
          generatedMessage,
          stackStartFn: doesNotThrow
        });
      }

      throw err;
    }

    async function rejects(func, expected, message) {
      if (typeof expected === 'string') {
        message = expected;
        expected = undefined;
      }

      let thrown = false;
      let err = null;

      if (typeof func !== 'function') { enforce(isPromise(func), 'func', 'promise'); }

      try {
        if (isPromise(func)) { await func; } else { await func(); }
      } catch (e) {
        thrown = true;
        err = e;
      }

      if (!thrown) {
        let generatedMessage = false;

        if (message == null) {
          message = 'Missing expected rejection.';
          generatedMessage = true;
        }

        throw new AssertionError({
          message,
          actual: undefined,
          expected,
          operator: 'rejects',
          generatedMessage,
          stackStartFn: rejects
        });
      }

      if (!testError(err, expected, message, rejects)) { throw err; }
    }

    async function doesNotReject(func, expected, message) {
      if (typeof expected === 'string') {
        message = expected;
        expected = undefined;
      }

      let thrown = false;
      let err = null;

      if (typeof func !== 'function') { enforce(isPromise(func), 'func', 'promise'); }

      try {
        if (isPromise(func)) { await func; } else { await func(); }
      } catch (e) {
        thrown = true;
        err = e;
      }

      if (!thrown) { return; }

      if (testError(err, expected, message, doesNotReject)) {
        let generatedMessage = false;

        if (message == null) {
          message = 'Got unwanted rejection.';
          generatedMessage = true;
        }

        throw new AssertionError({
          message,
          actual: undefined,
          expected,
          operator: 'doesNotReject',
          generatedMessage,
          stackStartFn: doesNotReject
        });
      }

      throw err;
    }

    function ifError(err) {
      if (err != null) {
        let message = 'ifError got unwanted exception: ';

        if (typeof err === 'object' && typeof err.message === 'string') {
          if (err.message.length === 0 && err.constructor) { message += err.constructor.name; } else { message += err.message; }
        } else {
          message += stringify(err);
        }

        throw new AssertionError({
          message,
          actual: err,
          expected: null,
          operator: 'ifError',
          generatedMessage: true,
          stackStartFn: ifError
        });
      }
    }

    function deepEqual(actual, expected, message) {
      if (!isDeepEqual(actual, expected, false)) {
        if (isError(message)) { throw message; }

        throw new AssertionError({
          message,
          actual,
          expected,
          operator: 'deepStrictEqual',
          stackStartFn: deepEqual
        });
      }
    }

    function notDeepEqual(actual, expected, message) {
      if (isDeepEqual(actual, expected, true)) {
        if (isError(message)) { throw message; }

        throw new AssertionError({
          message,
          actual,
          expected,
          operator: 'notDeepStrictEqual',
          stackStartFn: notDeepEqual
        });
      }
    }

    function bufferEqual(actual, expected, enc, message) {
      if (!isEncoding(enc)) {
        message = enc;
        enc = null;
      }

      if (enc == null) { enc = 'hex'; }

      expected = bufferize(actual, expected, enc);

      enforce(isBuffer(actual), 'actual', 'buffer');
      enforce(isBuffer(expected), 'expected', 'buffer');

      if (actual !== expected && !actual.equals(expected)) {
        if (isError(message)) { throw message; }

        throw new AssertionError({
          message,
          actual: actual.toString(enc),
          expected: expected.toString(enc),
          operator: 'bufferEqual',
          stackStartFn: bufferEqual
        });
      }
    }

    function notBufferEqual(actual, expected, enc, message) {
      if (!isEncoding(enc)) {
        message = enc;
        enc = null;
      }

      if (enc == null) { enc = 'hex'; }

      expected = bufferize(actual, expected, enc);

      enforce(isBuffer(actual), 'actual', 'buffer');
      enforce(isBuffer(expected), 'expected', 'buffer');

      if (actual === expected || actual.equals(expected)) {
        if (isError(message)) { throw message; }

        throw new AssertionError({
          message,
          actual: actual.toString(enc),
          expected: expected.toString(enc),
          operator: 'notBufferEqual',
          stackStartFn: notBufferEqual
        });
      }
    }

    function enforce(value, name, type) {
      if (!value) {
        let msg;

        if (name == null) {
          msg = 'Invalid type for parameter.';
        } else if (type == null) { msg = `Invalid type for "${name}".`; } else { msg = `"${name}" must be a(n) ${type}.`; }

        const err = new TypeError(msg);

        if (Error.captureStackTrace) { Error.captureStackTrace(err, enforce); }

        throw err;
      }
    }

    function range(value, name) {
      if (!value) {
        const msg = name != null
          ? `"${name}" is out of range.`
          : 'Parameter is out of range.';

        const err = new RangeError(msg);

        if (Error.captureStackTrace) { Error.captureStackTrace(err, range); }

        throw err;
      }
    }

    /*
 * Stringification
 */

    function stringify(value) {
      switch (typeof value) {
        case 'undefined':
          return 'undefined';
        case 'object':
          if (value === null) { return 'null'; }
          return `[${objectName(value)}]`;
        case 'boolean':
          return `${value}`;
        case 'number':
          return `${value}`;
        case 'string':
          if (value.length > 80) { value = `${value.substring(0, 77)}...`; }
          return JSON.stringify(value);
        case 'symbol':
          return tryString(value);
        case 'function':
          return `[${funcName(value)}]`;
        case 'bigint':
          return `${value}n`;
        default:
          return `[${typeof value}]`;
      }
    }

    function toString(value) {
      if (typeof value === 'string') { return value; }

      if (isError(value)) { return tryString(value); }

      return stringify(value);
    }

    function tryString(value) {
      try {
        return String(value);
      } catch (e) {
        return 'Object';
      }
    }

    /*
 * Error Testing
 */

    function testError(err, expected, message, func) {
      if (expected == null) { return true; }

      if (isRegExp(expected)) { return expected.test(err); }

      if (typeof expected !== 'function') {
        if (func === doesNotThrow || func === doesNotReject) { throw new TypeError('"expected" must not be an object.'); }

        if (typeof expected !== 'object') { throw new TypeError('"expected" must be an object.'); }

        let generatedMessage = false;

        if (message == null) {
          const name = func === rejects ? 'rejection' : 'exception';
          message = `Missing expected ${name}.`;
          generatedMessage = true;
        }

        if (err == null || typeof err !== 'object') {
          throw new AssertionError({
            actual: err,
            expected,
            message,
            operator: func.name,
            generatedMessage,
            stackStartFn: func
          });
        }

        const keys = Object.keys(expected);

        if (isError(expected)) { keys.push('name', 'message'); }

        if (keys.length === 0) { throw new TypeError('"expected" may not be an empty object.'); }

        for (const key of keys) {
          const expect = expected[key];
          const value = err[key];

          if (typeof value === 'string'
          && isRegExp(expect)
          && expect.test(value)) {
            continue;
          }

          if ((key in err) && isDeepEqual(value, expect, false)) { continue; }

          throw new AssertionError({
            actual: err,
            expected,
            message,
            operator: func.name,
            generatedMessage,
            stackStartFn: func
          });
        }

        return true;
      }

      if (expected.prototype !== undefined && (err instanceof expected)) { return true; }

      if (Error.isPrototypeOf(expected)) { return false; }

      return expected.call({}, err) === true;
    }

    /*
 * Comparisons
 */

    function isDeepEqual(x, y, fail) {
      try {
        return compare(x, y, null);
      } catch (e) {
        return fail;
      }
    }

    function compare(a, b, cache) {
      // Primitives.
      if (Object.is(a, b)) { return true; }

      if (!isObject(a) || !isObject(b)) { return false; }

      // Semi-primitives.
      if (objectString(a) !== objectString(b)) { return false; }

      if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) { return false; }

      if (isBuffer(a) && isBuffer(b)) { return a.equals(b); }

      if (isDate(a)) { return Object.is(a.getTime(), b.getTime()); }

      if (isRegExp(a)) {
        return a.source === b.source
        && a.global === b.global
        && a.multiline === b.multiline
        && a.lastIndex === b.lastIndex
        && a.ignoreCase === b.ignoreCase;
      }

      if (isError(a)) {
        if (a.message !== b.message) { return false; }
      }

      if (isArrayBuffer(a)) {
        a = new Uint8Array(a);
        b = new Uint8Array(b);
      }

      if (isView(a) && !isBuffer(a)) {
        if (isBuffer(b)) { return false; }

        const x = new Uint8Array(a.buffer);
        const y = new Uint8Array(b.buffer);

        if (x.length !== y.length) { return false; }

        for (let i = 0; i < x.length; i++) {
          if (x[i] !== y[i]) { return false; }
        }

        return true;
      }

      if (isSet(a)) {
        if (a.size !== b.size) { return false; }

        const keys = new Set([...a, ...b]);

        return keys.size === a.size;
      }

      // Recursive.
      if (!cache) {
        cache = {
          a: new Map(),
          b: new Map(),
          p: 0
        };
      } else {
        const aa = cache.a.get(a);

        if (aa != null) {
          const bb = cache.b.get(b);
          if (bb != null) { return aa === bb; }
        }

        cache.p += 1;
      }

      cache.a.set(a, cache.p);
      cache.b.set(b, cache.p);

      const ret = recurse(a, b, cache);

      cache.a.delete(a);
      cache.b.delete(b);

      return ret;
    }

    function recurse(a, b, cache) {
      if (isMap(a)) {
        if (a.size !== b.size) { return false; }

        const keys = new Set([...a.keys(), ...b.keys()]);

        if (keys.size !== a.size) { return false; }

        for (const key of keys) {
          if (!compare(a.get(key), b.get(key), cache)) { return false; }
        }

        return true;
      }

      if (isArray(a)) {
        if (a.length !== b.length) { return false; }

        for (let i = 0; i < a.length; i++) {
          if (!compare(a[i], b[i], cache)) { return false; }
        }

        return true;
      }

      const ak = ownKeys(a);
      const bk = ownKeys(b);

      if (ak.length !== bk.length) { return false; }

      const keys = new Set([...ak, ...bk]);

      if (keys.size !== ak.length) { return false; }

      for (const key of keys) {
        if (!compare(a[key], b[key], cache)) { return false; }
      }

      return true;
    }

    function ownKeys(obj) {
      const keys = Object.keys(obj);

      if (!Object.getOwnPropertySymbols) { return keys; }

      if (!Object.getOwnPropertyDescriptor) { return keys; }

      const symbols = Object.getOwnPropertySymbols(obj);

      for (const symbol of symbols) {
        const desc = Object.getOwnPropertyDescriptor(obj, symbol);

        if (desc && desc.enumerable) { keys.push(symbol); }
      }

      return keys;
    }

    /*
 * Helpers
 */

    function objectString(obj) {
      if (obj === undefined) { return '[object Undefined]'; }

      if (obj === null) { return '[object Null]'; }

      try {
        return Object.prototype.toString.call(obj);
      } catch (e) {
        return '[object Object]';
      }
    }

    function objectType(obj) {
      return objectString(obj).slice(8, -1);
    }

    function objectName(obj) {
      const type = objectType(obj);

      if (obj == null) { return type; }

      if (type !== 'Object' && type !== 'Error') { return type; }

      let ctor; let
        name;

      try {
        ctor = obj.constructor;
      } catch (e) {

      }

      if (ctor == null) { return type; }

      try {
        name = ctor.name;
      } catch (e) {
        return type;
      }

      if (typeof name !== 'string' || name.length === 0) { return type; }

      return name;
    }

    function funcName(func) {
      let name;

      try {
        name = func.name;
      } catch (e) {

      }

      if (typeof name !== 'string' || name.length === 0) { return 'Function'; }

      return `Function: ${name}`;
    }

    function isArray(obj) {
      return Array.isArray(obj);
    }

    function isArrayBuffer(obj) {
      return obj instanceof ArrayBuffer;
    }

    function isBuffer(obj) {
      return isObject(obj)
      && typeof obj.writeUInt32LE === 'function'
      && typeof obj.equals === 'function';
    }

    function isDate(obj) {
      return obj instanceof Date;
    }

    function isError(obj) {
      return obj instanceof Error;
    }

    function isMap(obj) {
      return obj instanceof Map;
    }

    function isObject(obj) {
      return obj && typeof obj === 'object';
    }

    function isPromise(obj) {
      return obj instanceof Promise;
    }

    function isRegExp(obj) {
      return obj instanceof RegExp;
    }

    function isSet(obj) {
      return obj instanceof Set;
    }

    function isView(obj) {
      return ArrayBuffer.isView(obj);
    }

    function isEncoding(enc) {
      if (typeof enc !== 'string') { return false; }

      switch (enc) {
        case 'ascii':
        case 'binary':
        case 'base64':
        case 'hex':
        case 'latin1':
        case 'ucs2':
        case 'utf8':
        case 'utf16le':
          return true;
      }

      return false;
    }

    function bufferize(actual, expected, enc) {
      if (typeof expected === 'string') {
        if (!isBuffer(actual)) { return null; }

        const { constructor } = actual;

        if (!constructor || typeof constructor.from !== 'function') { return null; }

        if (!isEncoding(enc)) { return null; }

        if (enc === 'hex' && (expected.length & 1)) { return null; }

        const raw = constructor.from(expected, enc);

        if (enc === 'hex' && raw.length !== (expected.length >>> 1)) { return null; }

        return raw;
      }

      return expected;
    }

    /*
 * API
 */

    assert.AssertionError = AssertionError;
    assert.assert = assert;
    assert.strict = assert;
    assert.ok = assert;
    assert.equal = equal;
    assert.notEqual = notEqual;
    assert.strictEqual = equal;
    assert.notStrictEqual = notEqual;
    assert.fail = fail;
    assert.throws = throws;
    assert.doesNotThrow = doesNotThrow;
    assert.rejects = rejects;
    assert.doesNotReject = doesNotReject;
    assert.ifError = ifError;
    assert.deepEqual = deepEqual;
    assert.notDeepEqual = notDeepEqual;
    assert.deepStrictEqual = deepEqual;
    assert.notDeepStrictEqual = notDeepEqual;
    assert.bufferEqual = bufferEqual;
    assert.notBufferEqual = notBufferEqual;
    assert.enforce = enforce;
    assert.range = range;

    /*
 * Expose
 */

    module.exports = assert;
  }],
  ['bcurl', '/lib/bcurl.js', function (exports, module, __filename, __dirname, __meta) {
    /*!
 * bcurl.js - simple http client
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcurl
 */


    const Client = __node_require__(4 /* './client' */);

    exports.Client = Client;
    exports.client = options => new Client(options);
  }],
  ['bcurl', '/lib/client.js', function (exports, module, __filename, __dirname, __meta) {
    /*!
 * client.js - http client for bcurl
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcurl
 */


    const assert = __node_require__(2 /* 'bsert' */);
    const EventEmitter = require('events');
    const URL = require('url');
    const bsock = __node_require__(5 /* 'bsock' */);
    const brq = __node_require__(16 /* 'brq' */);

    /**
 * HTTP Client
 */

    class Client extends EventEmitter {
      /**
   * Create an HTTP client.
   * @constructor
   * @param {Object?} options
   */

      constructor(options) {
        super();

        const opt = new ClientOptions(options);

        this.ssl = opt.ssl;
        this.host = opt.host;
        this.port = opt.port;
        this.path = opt.path;
        this.headers = opt.headers;
        this.username = opt.username;
        this.password = opt.password;
        this.id = opt.id;
        this.token = opt.token;
        this.timeout = opt.timeout;
        this.limit = opt.limit;
        this.sequence = 0;
        this.opened = false;
        this.socket = bsock.socket();
      }

      /**
   * Clone client.
   * @returns {Client}
   */

      clone() {
        const copy = new this.constructor();
        copy.ssl = this.ssl;
        copy.host = this.host;
        copy.port = this.port;
        copy.path = this.path;
        copy.headers = this.headers;
        copy.username = this.username;
        copy.password = this.password;
        copy.id = this.id;
        copy.token = this.token;
        copy.sequence = this.sequence;
        copy.timeout = this.timeout;
        copy.limit = this.limit;
        copy.opened = this.opened;
        copy.socket = this.socket;
        return copy;
      }

      /**
   * Open client.
   * @returns {Promise}
   */

      async open() {
        const { port, host, ssl } = this;

        assert(!this.opened, 'Already opened.');
        this.opened = true;

        this.socket.on('connect', async () => {
          try {
            await this.auth();
          } catch (e) {
            this.emit('error', e);
            return;
          }
          this.emit('connect');
        });

        this.socket.on('error', (err) => {
          this.emit('error', err);
        });

        this.socket.on('disconnect', () => {
          this.emit('disconnect');
        });

        this.socket.connect(port, host, ssl);
      }

      /**
   * Close client.
   * @returns {Promise}
   */

      async close() {
        assert(this.opened, 'Not opened.');
        this.opened = false;
        this.socket.destroy();
        this.socket = bsock.socket();
      }

      /**
   * Auth (abstract).
   */

      async auth() {}

      /**
   * Add a hook.
   */

      hook(...args) {
        return this.socket.hook(...args);
      }

      /**
   * Call a hook.
   * @returns {Promise}
   */

      async call(...args) {
        return this.socket.call(...args);
      }

      /**
   * Add an event listener.
   */

      bind(...args) {
        return this.socket.bind(...args);
      }

      /**
   * Fire an event.
   */

      fire(...args) {
        return this.socket.fire(...args);
      }

      /**
   * Make an http request to endpoint.
   * @param {String} method
   * @param {String} endpoint - Path.
   * @param {Object} params - Body or query depending on method.
   * @returns {Promise}
   */

      async request(method, endpoint, params) {
        assert(typeof method === 'string');
        assert(typeof endpoint === 'string');

        let query = null;

        if (params == null) { params = {}; }

        assert(params && typeof params === 'object');

        if (this.token) { params.token = this.token; }

        if (method === 'GET') {
          query = params;
          params = null;
        }

        const res = await brq({
          method,
          ssl: this.ssl,
          host: this.host,
          port: this.port,
          path: this.path + endpoint,
          username: this.username,
          password: this.password,
          headers: this.headers,
          timeout: this.timeout,
          limit: this.limit,
          query,
          pool: true,
          json: params
        });

        if (res.statusCode === 404) { return null; }

        if (res.statusCode === 401) { throw new Error('Unauthorized (bad API key).'); }

        if (res.type !== 'json') { throw new Error('Bad response (wrong content-type).'); }

        const json = res.json();

        if (!json) { throw new Error('Bad response (no body).'); }

        if (json.error) {
          const { error } = json;
          const err = new Error(error.message);
          err.type = String(error.type);
          err.code = error.code;
          throw err;
        }

        if (res.statusCode !== 200) { throw new Error(`Status code: ${res.statusCode}.`); }

        return json;
      }

      /**
   * Make a GET http request to endpoint.
   * @param {String} endpoint - Path.
   * @param {Object} params - Querystring.
   * @returns {Promise}
   */

      get(endpoint, params) {
        return this.request('GET', endpoint, params);
      }

      /**
   * Make a POST http request to endpoint.
   * @param {String} endpoint - Path.
   * @param {Object} params - Body.
   * @returns {Promise}
   */

      post(endpoint, params) {
        return this.request('POST', endpoint, params);
      }

      /**
   * Make a PUT http request to endpoint.
   * @param {String} endpoint - Path.
   * @param {Object} params - Body.
   * @returns {Promise}
   */

      put(endpoint, params) {
        return this.request('PUT', endpoint, params);
      }

      /**
   * Make a DELETE http request to endpoint.
   * @param {String} endpoint - Path.
   * @param {Object} params - Body.
   * @returns {Promise}
   */

      del(endpoint, params) {
        return this.request('DELETE', endpoint, params);
      }

      /**
   * Make a json rpc request.
   * @param {String} endpoint - Path.
   * @param {String} method - RPC method name.
   * @param {Array} params - RPC parameters.
   * @returns {Promise} - Returns Object?.
   */

      async execute(endpoint, method, params) {
        assert(typeof endpoint === 'string');
        assert(typeof method === 'string');

        if (params == null) { params = null; }

        this.sequence += 1;

        const res = await brq({
          method: 'POST',
          ssl: this.ssl,
          host: this.host,
          port: this.port,
          path: this.path + endpoint,
          username: this.username,
          password: this.password,
          headers: this.headers,
          timeout: this.timeout,
          limit: this.limit,
          pool: true,
          query: this.token
            ? { token: this.token }
            : undefined,
          json: {
            method,
            params,
            id: this.sequence
          }
        });

        if (res.statusCode === 401) { throw new RPCError('Unauthorized (bad API key).', -1); }

        if (res.type !== 'json') { throw new Error('Bad response (wrong content-type).'); }

        const json = res.json();

        if (!json) { throw new Error('No body for JSON-RPC response.'); }

        if (json.error) {
          const { message, code } = json.error;
          throw new RPCError(message, code);
        }

        if (res.statusCode !== 200) { throw new Error(`Status code: ${res.statusCode}.`); }

        return json.result;
      }
    }

    /**
 * Client Options
 */

    class ClientOptions {
      constructor(options) {
        this.ssl = false;
        this.host = 'localhost';
        this.port = 80;
        this.path = '/';
        this.headers = null;
        this.username = null;
        this.password = null;
        this.id = null;
        this.token = null;
        this.timeout = 5000;
        this.limit = null;

        if (options) { this.fromOptions(options); }
      }

      fromOptions(options) {
        if (typeof options === 'string') { options = { url: options }; }

        assert(options && typeof options === 'object');

        if (options.ssl != null) {
          assert(typeof options.ssl === 'boolean');
          this.ssl = options.ssl;
          this.port = 443;
        }

        if (options.host != null) {
          assert(typeof options.host === 'string');
          this.host = options.host;
        }

        if (options.port != null) {
          assert((options.port & 0xffff) === options.port);
          assert(options.port !== 0);
          this.port = options.port;
        }

        if (options.path != null) {
          assert(typeof options.path === 'string');
          this.path = options.path;
        }

        if (options.headers != null) {
          assert(typeof options.headers === 'object');
          this.headers = options.headers;
        }

        if (options.apiKey != null) {
          assert(typeof options.apiKey === 'string');
          this.password = options.apiKey;
        }

        if (options.key != null) {
          assert(typeof options.key === 'string');
          this.password = options.key;
        }

        if (options.username != null) {
          assert(typeof options.username === 'string');
          this.username = options.username;
        }

        if (options.password != null) {
          assert(typeof options.password === 'string');
          this.password = options.password;
        }

        if (options.url != null) {
          assert(typeof options.url === 'string');

          let { url } = options;

          if (url.indexOf('://') === -1) { url = `http://${url}`; }

          const data = URL.parse(url);

          if (data.protocol !== 'http:'
          && data.protocol !== 'https:') {
            throw new Error('Malformed URL.');
          }

          if (!data.hostname) { throw new Error('Malformed URL.'); }

          if (data.protocol === 'https:') {
            this.ssl = true;
            this.port = 443;
          }

          this.host = data.hostname;

          if (data.port) {
            const port = parseInt(data.port, 10);
            assert((port & 0xffff) === port);
            assert(port !== 0);
            this.port = port;
          }

          this.path = data.pathname;

          if (data.auth) {
            const parts = data.auth.split(':');
            this.username = parts.shift();
            this.password = parts.join(':');
          }
        }

        if (options.id != null) {
          assert(typeof options.id === 'string');
          this.id = options.id;
        }

        if (options.token != null) {
          assert(typeof options.token === 'string');
          this.token = options.token;
        }

        if (options.timeout != null) {
          assert(typeof options.timeout === 'number');
          this.timeout = options.timeout;
        }

        if (options.limit != null) {
          assert(typeof options.limit === 'number');
          this.limit = options.limit;
        }

        return this;
      }
    }

    /**
 * RPC Error
 */

    class RPCError extends Error {
      constructor(msg, code) {
        super();

        this.type = 'RPCError';
        this.message = String(msg);
        this.code = code >>> 0;

        if (Error.captureStackTrace) { Error.captureStackTrace(this, RPCError); }
      }
    }

    /*
 * Expose
 */

    module.exports = Client;
  }],
  ['bsock', '/lib/bsock.js', function (exports, module, __filename, __dirname, __meta) {
    const WebSocket = __node_require__(6 /* './backend' */);
    const Server = __node_require__(8 /* './server' */);
    const Socket = __node_require__(10 /* './socket' */);

    exports.WebSocket = WebSocket;
    exports.Server = Server;
    exports.server = () => new Server();
    exports.createServer = Server.createServer.bind(Server);
    exports.attach = Server.attach.bind(Server);
    exports.Socket = Socket;
    exports.socket = () => new Socket();
    exports.connect = Socket.connect.bind(Socket);
  }],
  ['bsock', '/lib/backend.js', function (exports, module, __filename, __dirname, __meta) {
    module.exports = __node_require__(7 /* '../vendor/faye-websocket' */);
  }],
  ['bsock', '/vendor/faye-websocket.js', function (exports, module, __filename, __dirname, __meta) {
    /*!
 * faye-websocket@0.11.1 - Standards-compliant WebSocket server and client
 * Copyright (c) 2019, James Coglan (MIT)
 * https://github.com/faye/faye-websocket-node
 *
 * License for websocket-driver@0.7.0:
 *
 * # The MIT License
 *
 * Copyright (c) 2010-2017 James Coglan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * License for http-parser-js@0.5.0:
 *
 * Copyright (c) 2015 Tim Caswell (https://github.com/creationix) and other
 * contributors. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Some files from the tests folder are from joyent/node and mscedex/io.js, a
 * fork of nodejs/io.js:
 *
 * - tests/iojs/test-http-parser-durability.js
 *
 * This file is from
 * https://github.com/mscdex/io.js/blob/js-http-parser/test/pummel/test-http-parser-durability.js
 * with modifications by Jan Schär (jscissr).
 *
 * """ Copyright io.js contributors. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE. """
 *
 * - tests/fixtures/* tests/parallel/* tests/testpy/* tests/common.js
 * tests/test.py tests/utils.py
 *
 * These files are from https://github.com/nodejs/node with changes by Jan Schär
 * (jscissr).
 *
 * Node.js is licensed for use as follows:
 *
 * """ Copyright Node.js contributors. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE. """
 *
 * This license applies to parts of Node.js originating from the
 * https://github.com/joyent/node repository:
 *
 * """ Copyright Joyent, Inc. and other Node contributors. All rights reserved.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE. """
 *
 * License for websocket-extensions@0.1.3:
 *
 * # The MIT License
 *
 * Copyright (c) 2014-2017 James Coglan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

    const __node_modules__ = [
      ['faye-websocket', '/lib/faye/websocket.js', function (exports, module, __filename, __dirname, __meta) {
        // API references:
        //
        // * https://html.spec.whatwg.org/multipage/comms.html#network
        // * https://dom.spec.whatwg.org/#interface-eventtarget
        // * https://dom.spec.whatwg.org/#interface-event

        const util = require('util');
        const driver = __node_require__(1 /* 'websocket-driver' */);
        const API = __node_require__(23 /* './websocket/api' */);

        const WebSocket = function (request, socket, body, protocols, options) {
          options = options || {};

          this._stream = socket;
          this._driver = driver.http(request, { maxLength: options.maxLength, protocols });

          const self = this;
          if (!this._stream || !this._stream.writable) { return; }
          if (!this._stream.readable) { return this._stream.end(); }

          var catchup = function () { self._stream.removeListener('data', catchup); };
          this._stream.on('data', catchup);

          API.call(this, options);

          process.nextTick(() => {
            self._driver.start();
            self._driver.io.write(body);
          });
        };
        util.inherits(WebSocket, API);

        WebSocket.isWebSocket = function (request) {
          return driver.isWebSocket(request);
        };

        WebSocket.validateOptions = function (options, validKeys) {
          driver.validateOptions(options, validKeys);
        };

        WebSocket.WebSocket = WebSocket;
        WebSocket.Client = __node_require__(26 /* './websocket/client' */);
        WebSocket.EventSource = __node_require__(27 /* './eventsource' */);

        module.exports = WebSocket;
      }],
      ['websocket-driver', '/lib/websocket/driver.js', function (exports, module, __filename, __dirname, __meta) {
        // Protocol references:
        //
        // * http://tools.ietf.org/html/draft-hixie-thewebsocketprotocol-75
        // * http://tools.ietf.org/html/draft-hixie-thewebsocketprotocol-76
        // * http://tools.ietf.org/html/draft-ietf-hybi-thewebsocketprotocol-17

        const Base = __node_require__(2 /* './driver/base' */);
        const Client = __node_require__(6 /* './driver/client' */);
        const Server = __node_require__(20 /* './driver/server' */);

        const Driver = {
          client(url, options) {
            options = options || {};
            if (options.masking === undefined) { options.masking = true; }
            return new Client(url, options);
          },

          server(options) {
            options = options || {};
            if (options.requireMasking === undefined) { options.requireMasking = true; }
            return new Server(options);
          },

          http() {
            return Server.http.apply(Server, arguments);
          },

          isSecureRequest(request) {
            return Server.isSecureRequest(request);
          },

          isWebSocket(request) {
            if (request.method !== 'GET') { return false; }

            const connection = request.headers.connection || '';
            const upgrade = request.headers.upgrade || '';

            return request.method === 'GET'
           && connection.toLowerCase().split(/ *, */).indexOf('upgrade') >= 0
           && upgrade.toLowerCase() === 'websocket';
          },

          validateOptions(options, validKeys) {
            Base.validateOptions(options, validKeys);
          }
        };

        module.exports = Driver;
      }],
      ['websocket-driver', '/lib/websocket/driver/base.js', function (exports, module, __filename, __dirname, __meta) {
        const Emitter = require('events').EventEmitter;
        const util = require('util');
        const streams = __node_require__(3 /* '../streams' */);
        const Headers = __node_require__(4 /* './headers' */);
        const Reader = __node_require__(5 /* './stream_reader' */);

        var Base = function (request, url, options) {
          Emitter.call(this);
          Base.validateOptions(options || {}, ['maxLength', 'masking', 'requireMasking', 'protocols']);

          this._request = request;
          this._reader = new Reader();
          this._options = options || {};
          this._maxLength = this._options.maxLength || this.MAX_LENGTH;
          this._headers = new Headers();
          this.__queue = [];
          this.readyState = 0;
          this.url = url;

          this.io = new streams.IO(this);
          this.messages = new streams.Messages(this);
          this._bindEventListeners();
        };
        util.inherits(Base, Emitter);

        Base.validateOptions = function (options, validKeys) {
          for (const key in options) {
            if (validKeys.indexOf(key) < 0) { throw new Error(`Unrecognized option: ${key}`); }
          }
        };

        const instance = {
          // This is 64MB, small enough for an average VPS to handle without
          // crashing from process out of memory
          MAX_LENGTH: 0x3ffffff,

          STATES: ['connecting', 'open', 'closing', 'closed'],

          _bindEventListeners() {
            const self = this;

            // Protocol errors are informational and do not have to be handled
            this.messages.on('error', () => {});

            this.on('message', (event) => {
              const { messages } = self;
              if (messages.readable) { messages.emit('data', event.data); }
            });

            this.on('error', (error) => {
              const { messages } = self;
              if (messages.readable) { messages.emit('error', error); }
            });

            this.on('close', () => {
              const { messages } = self;
              if (!messages.readable) { return; }
              messages.readable = messages.writable = false;
              messages.emit('end');
            });
          },

          getState() {
            return this.STATES[this.readyState] || null;
          },

          addExtension(extension) {
            return false;
          },

          setHeader(name, value) {
            if (this.readyState > 0) { return false; }
            this._headers.set(name, value);
            return true;
          },

          start() {
            if (this.readyState !== 0) { return false; }
            const response = this._handshakeResponse();
            if (!response) { return false; }
            this._write(response);
            if (this._stage !== -1) { this._open(); }
            return true;
          },

          text(message) {
            return this.frame(message);
          },

          binary(message) {
            return false;
          },

          ping() {
            return false;
          },

          pong() {
            return false;
          },

          close(reason, code) {
            if (this.readyState !== 1) { return false; }
            this.readyState = 3;
            this.emit('close', new Base.CloseEvent(null, null));
            return true;
          },

          _open() {
            this.readyState = 1;
            this.__queue.forEach(function (args) { this.frame.apply(this, args); }, this);
            this.__queue = [];
            this.emit('open', new Base.OpenEvent());
          },

          _queue(message) {
            this.__queue.push(message);
            return true;
          },

          _write(chunk) {
            const { io } = this;
            if (io.readable) { io.emit('data', chunk); }
          }
        };

        for (const key in instance) { Base.prototype[key] = instance[key]; }


        Base.ConnectEvent = function () {};

        Base.OpenEvent = function () {};

        Base.CloseEvent = function (code, reason) {
          this.code = code;
          this.reason = reason;
        };

        Base.MessageEvent = function (data) {
          this.data = data;
        };

        Base.PingEvent = function (data) {
          this.data = data;
        };

        Base.PongEvent = function (data) {
          this.data = data;
        };

        module.exports = Base;
      }],
      ['websocket-driver', '/lib/websocket/streams.js', function (exports, module, __filename, __dirname, __meta) {
        /**

Streams in a WebSocket connection
---------------------------------

We model a WebSocket as two duplex streams: one stream is for the wire protocol
over an I/O socket, and the other is for incoming/outgoing messages.


                        +----------+      +---------+      +----------+
    [1] write(chunk) -->| ~~~~~~~~ +----->| parse() +----->| ~~~~~~~~ +--> emit('data') [2]
                        |          |      +----+----+      |          |
                        |          |           |           |          |
                        |    IO    |           | [5]       | Messages |
                        |          |           V           |          |
                        |          |      +---------+      |          |
    [4] emit('data') <--+ ~~~~~~~~ |<-----+ frame() |<-----+ ~~~~~~~~ |<-- write(chunk) [3]
                        +----------+      +---------+      +----------+


Message transfer in each direction is simple: IO receives a byte stream [1] and
sends this stream for parsing. The parser will periodically emit a complete
message text on the Messages stream [2]. Similarly, when messages are written
to the Messages stream [3], they are framed using the WebSocket wire format and
emitted via IO [4].

There is a feedback loop via [5] since some input from [1] will be things like
ping, pong and close frames. In these cases the protocol responds by emitting
responses directly back to [4] rather than emitting messages via [2].

For the purposes of flow control, we consider the sources of each Readable
stream to be as follows:

* [2] receives input from [1]
* [4] receives input from [1] and [3]

The classes below express the relationships described above without prescribing
anything about how parse() and frame() work, other than assuming they emit
'data' events to the IO and Messages streams. They will work with any protocol
driver having these two methods.
* */


        const { Stream } = require('stream');
        const util = require('util');


        const IO = function (driver) {
          this.readable = this.writable = true;
          this._paused = false;
          this._driver = driver;
        };
        util.inherits(IO, Stream);

        // The IO pause() and resume() methods will be called when the socket we are
        // piping to gets backed up and drains. Since IO output [4] comes from IO input
        // [1] and Messages input [3], we need to tell both of those to return false
        // from write() when this stream is paused.

        IO.prototype.pause = function () {
          this._paused = true;
          this._driver.messages._paused = true;
        };

        IO.prototype.resume = function () {
          this._paused = false;
          this.emit('drain');

          const { messages } = this._driver;
          messages._paused = false;
          messages.emit('drain');
        };

        // When we receive input from a socket, send it to the parser and tell the
        // source whether to back off.
        IO.prototype.write = function (chunk) {
          if (!this.writable) { return false; }
          this._driver.parse(chunk);
          return !this._paused;
        };

        // The IO end() method will be called when the socket piping into it emits
        // 'close' or 'end', i.e. the socket is closed. In this situation the Messages
        // stream will not emit any more data so we emit 'end'.
        IO.prototype.end = function (chunk) {
          if (!this.writable) { return; }
          if (chunk !== undefined) { this.write(chunk); }
          this.writable = false;

          const { messages } = this._driver;
          if (messages.readable) {
            messages.readable = messages.writable = false;
            messages.emit('end');
          }
        };

        IO.prototype.destroy = function () {
          this.end();
        };


        const Messages = function (driver) {
          this.readable = this.writable = true;
          this._paused = false;
          this._driver = driver;
        };
        util.inherits(Messages, Stream);

        // The Messages pause() and resume() methods will be called when the app that's
        // processing the messages gets backed up and drains. If we're emitting
        // messages too fast we should tell the source to slow down. Message output [2]
        // comes from IO input [1].

        Messages.prototype.pause = function () {
          this._driver.io._paused = true;
        };

        Messages.prototype.resume = function () {
          this._driver.io._paused = false;
          this._driver.io.emit('drain');
        };

        // When we receive messages from the user, send them to the formatter and tell
        // the source whether to back off.
        Messages.prototype.write = function (message) {
          if (!this.writable) { return false; }
          if (typeof message === 'string') { this._driver.text(message); } else { this._driver.binary(message); }
          return !this._paused;
        };

        // The Messages end() method will be called when a stream piping into it emits
        // 'end'. Many streams may be piped into the WebSocket and one of them ending
        // does not mean the whole socket is done, so just process the input and move
        // on leaving the socket open.
        Messages.prototype.end = function (message) {
          if (message !== undefined) { this.write(message); }
        };

        Messages.prototype.destroy = function () {};


        exports.IO = IO;
        exports.Messages = Messages;
      }],
      ['websocket-driver', '/lib/websocket/driver/headers.js', function (exports, module, __filename, __dirname, __meta) {
        const Headers = function () {
          this.clear();
        };

        Headers.prototype.ALLOWED_DUPLICATES = ['set-cookie', 'set-cookie2', 'warning', 'www-authenticate'];

        Headers.prototype.clear = function () {
          this._sent = {};
          this._lines = [];
        };

        Headers.prototype.set = function (name, value) {
          if (value === undefined) { return; }

          name = this._strip(name);
          value = this._strip(value);

          const key = name.toLowerCase();
          if (!this._sent.hasOwnProperty(key) || this.ALLOWED_DUPLICATES.indexOf(key) >= 0) {
            this._sent[key] = true;
            this._lines.push(`${name}: ${value}\r\n`);
          }
        };

        Headers.prototype.toString = function () {
          return this._lines.join('');
        };

        Headers.prototype._strip = function (string) {
          return string.toString().replace(/^ */, '').replace(/ *$/, '');
        };

        module.exports = Headers;
      }],
      ['websocket-driver', '/lib/websocket/driver/stream_reader.js', function (exports, module, __filename, __dirname, __meta) {
        const StreamReader = function () {
          this._queue = [];
          this._queueSize = 0;
          this._offset = 0;
        };

        StreamReader.prototype.put = function (buffer) {
          if (!buffer || buffer.length === 0) { return; }
          if (!buffer.copy) { buffer = new Buffer(buffer); }
          this._queue.push(buffer);
          this._queueSize += buffer.length;
        };

        StreamReader.prototype.read = function (length) {
          if (length > this._queueSize) { return null; }
          if (length === 0) { return new Buffer(0); }

          this._queueSize -= length;

          const queue = this._queue;
          let remain = length;
          const first = queue[0];
          let buffers; let
            buffer;

          if (first.length >= length) {
            if (first.length === length) {
              return queue.shift();
            }
            buffer = first.slice(0, length);
            queue[0] = first.slice(length);
            return buffer;
          }

          for (var i = 0, n = queue.length; i < n; i++) {
            if (remain < queue[i].length) { break; }
            remain -= queue[i].length;
          }
          buffers = queue.splice(0, i);

          if (remain > 0 && queue.length > 0) {
            buffers.push(queue[0].slice(0, remain));
            queue[0] = queue[0].slice(remain);
          }
          return this._concat(buffers, length);
        };

        StreamReader.prototype.eachByte = function (callback, context) {
          let buffer; let n; let
            index;

          while (this._queue.length > 0) {
            buffer = this._queue[0];
            n = buffer.length;

            while (this._offset < n) {
              index = this._offset;
              this._offset += 1;
              callback.call(context, buffer[index]);
            }
            this._offset = 0;
            this._queue.shift();
          }
        };

        StreamReader.prototype._concat = function (buffers, length) {
          if (Buffer.concat) { return Buffer.concat(buffers, length); }

          const buffer = new Buffer(length);
          let offset = 0;

          for (let i = 0, n = buffers.length; i < n; i++) {
            buffers[i].copy(buffer, offset);
            offset += buffers[i].length;
          }
          return buffer;
        };

        module.exports = StreamReader;
      }],
      ['websocket-driver', '/lib/websocket/driver/client.js', function (exports, module, __filename, __dirname, __meta) {
        const crypto = require('crypto');
        const url = require('url');
        const util = require('util');
        const HttpParser = __node_require__(7 /* '../http_parser' */);
        const Base = __node_require__(2 /* './base' */);
        const Hybi = __node_require__(9 /* './hybi' */);
        const Proxy = __node_require__(19 /* './proxy' */);

        var Client = function (_url, options) {
          this.version = 'hybi-13';
          Hybi.call(this, null, _url, options);

          this.readyState = -1;
          this._key = Client.generateKey();
          this._accept = Hybi.generateAccept(this._key);
          this._http = new HttpParser('response');

          const uri = url.parse(this.url);
          const auth = uri.auth && new Buffer(uri.auth, 'utf8').toString('base64');

          if (this.VALID_PROTOCOLS.indexOf(uri.protocol) < 0) { throw new Error(`${this.url} is not a valid WebSocket URL`); }

          this._pathname = (uri.pathname || '/') + (uri.search || '');

          this._headers.set('Host', uri.host);
          this._headers.set('Upgrade', 'websocket');
          this._headers.set('Connection', 'Upgrade');
          this._headers.set('Sec-WebSocket-Key', this._key);
          this._headers.set('Sec-WebSocket-Version', '13');

          if (this._protocols.length > 0) { this._headers.set('Sec-WebSocket-Protocol', this._protocols.join(', ')); }

          if (auth) { this._headers.set('Authorization', `Basic ${auth}`); }
        };
        util.inherits(Client, Hybi);

        Client.generateKey = function () {
          return crypto.randomBytes(16).toString('base64');
        };

        const instance = {
          VALID_PROTOCOLS: ['ws:', 'wss:'],

          proxy(origin, options) {
            return new Proxy(this, origin, options);
          },

          start() {
            if (this.readyState !== -1) { return false; }
            this._write(this._handshakeRequest());
            this.readyState = 0;
            return true;
          },

          parse(chunk) {
            if (this.readyState === 3) { return; }
            if (this.readyState > 0) { return Hybi.prototype.parse.call(this, chunk); }

            this._http.parse(chunk);
            if (!this._http.isComplete()) { return; }

            this._validateHandshake();
            if (this.readyState === 3) { return; }

            this._open();
            this.parse(this._http.body);
          },

          _handshakeRequest() {
            const extensions = this._extensions.generateOffer();
            if (extensions) { this._headers.set('Sec-WebSocket-Extensions', extensions); }

            const start = `GET ${this._pathname} HTTP/1.1`;
            const headers = [start, this._headers.toString(), ''];

            return new Buffer(headers.join('\r\n'), 'utf8');
          },

          _failHandshake(message) {
            message = `Error during WebSocket handshake: ${message}`;
            this.readyState = 3;
            this.emit('error', new Error(message));
            this.emit('close', new Base.CloseEvent(this.ERRORS.protocol_error, message));
          },

          _validateHandshake() {
            this.statusCode = this._http.statusCode;
            this.headers = this._http.headers;

            if (this._http.error) { return this._failHandshake(this._http.error.message); }

            if (this._http.statusCode !== 101) { return this._failHandshake(`Unexpected response code: ${this._http.statusCode}`); }

            const { headers } = this._http;
            const upgrade = headers.upgrade || '';
            const connection = headers.connection || '';
            const accept = headers['sec-websocket-accept'] || '';
            const protocol = headers['sec-websocket-protocol'] || '';

            if (upgrade === '') { return this._failHandshake("'Upgrade' header is missing"); }
            if (upgrade.toLowerCase() !== 'websocket') { return this._failHandshake("'Upgrade' header value is not 'WebSocket'"); }

            if (connection === '') { return this._failHandshake("'Connection' header is missing"); }
            if (connection.toLowerCase() !== 'upgrade') { return this._failHandshake("'Connection' header value is not 'Upgrade'"); }

            if (accept !== this._accept) { return this._failHandshake('Sec-WebSocket-Accept mismatch'); }

            this.protocol = null;

            if (protocol !== '') {
              if (this._protocols.indexOf(protocol) < 0) { return this._failHandshake('Sec-WebSocket-Protocol mismatch'); }
              this.protocol = protocol;
            }

            try {
              this._extensions.activate(this.headers['sec-websocket-extensions']);
            } catch (e) {
              return this._failHandshake(e.message);
            }
          }
        };

        for (const key in instance) { Client.prototype[key] = instance[key]; }

        module.exports = Client;
      }],
      ['websocket-driver', '/lib/websocket/http_parser.js', function (exports, module, __filename, __dirname, __meta) {
        const NodeHTTPParser = __node_require__(8 /* 'http-parser-js' */).HTTPParser;

        const VERSION = process.version.match(/[0-9]+/g).map(n => parseInt(n, 10));

        const TYPES = {
          request: NodeHTTPParser.REQUEST || 'request',
          response: NodeHTTPParser.RESPONSE || 'response'
        };

        var HttpParser = function (type) {
          this._type = type;
          this._parser = new NodeHTTPParser(TYPES[type]);
          this._complete = false;
          this.headers = {};

          let current = null;
          const self = this;

          this._parser.onHeaderField = function (b, start, length) {
            current = b.toString('utf8', start, start + length).toLowerCase();
          };

          this._parser.onHeaderValue = function (b, start, length) {
            const value = b.toString('utf8', start, start + length);

            if (self.headers.hasOwnProperty(current)) { self.headers[current] += `, ${value}`; } else { self.headers[current] = value; }
          };

          this._parser.onHeadersComplete = this._parser[NodeHTTPParser.kOnHeadersComplete] = function (majorVersion, minorVersion, headers, method, pathname, statusCode) {
            const info = arguments[0];

            if (typeof info === 'object') {
              method = info.method;
              pathname = info.url;
              statusCode = info.statusCode;
              headers = info.headers;
            }

            self.method = (typeof method === 'number') ? HttpParser.METHODS[method] : method;
            self.statusCode = statusCode;
            self.url = pathname;

            if (!headers) { return; }

            for (var i = 0, n = headers.length, key, value; i < n; i += 2) {
              key = headers[i].toLowerCase();
              value = headers[i + 1];
              if (self.headers.hasOwnProperty(key)) { self.headers[key] += `, ${value}`; } else { self.headers[key] = value; }
            }

            self._complete = true;
          };
        };

        HttpParser.METHODS = {
          0: 'DELETE',
          1: 'GET',
          2: 'HEAD',
          3: 'POST',
          4: 'PUT',
          5: 'CONNECT',
          6: 'OPTIONS',
          7: 'TRACE',
          8: 'COPY',
          9: 'LOCK',
          10: 'MKCOL',
          11: 'MOVE',
          12: 'PROPFIND',
          13: 'PROPPATCH',
          14: 'SEARCH',
          15: 'UNLOCK',
          16: 'BIND',
          17: 'REBIND',
          18: 'UNBIND',
          19: 'ACL',
          20: 'REPORT',
          21: 'MKACTIVITY',
          22: 'CHECKOUT',
          23: 'MERGE',
          24: 'M-SEARCH',
          25: 'NOTIFY',
          26: 'SUBSCRIBE',
          27: 'UNSUBSCRIBE',
          28: 'PATCH',
          29: 'PURGE',
          30: 'MKCALENDAR',
          31: 'LINK',
          32: 'UNLINK'
        };

        if (VERSION[0] === 0 && VERSION[1] === 12) {
          HttpParser.METHODS[16] = 'REPORT';
          HttpParser.METHODS[17] = 'MKACTIVITY';
          HttpParser.METHODS[18] = 'CHECKOUT';
          HttpParser.METHODS[19] = 'MERGE';
          HttpParser.METHODS[20] = 'M-SEARCH';
          HttpParser.METHODS[21] = 'NOTIFY';
          HttpParser.METHODS[22] = 'SUBSCRIBE';
          HttpParser.METHODS[23] = 'UNSUBSCRIBE';
          HttpParser.METHODS[24] = 'PATCH';
          HttpParser.METHODS[25] = 'PURGE';
        }

        HttpParser.prototype.isComplete = function () {
          return this._complete;
        };

        HttpParser.prototype.parse = function (chunk) {
          let consumed = this._parser.execute(chunk, 0, chunk.length);

          if (typeof consumed !== 'number') {
            this.error = consumed;
            this._complete = true;
            return;
          }

          if (VERSION[0] === 0 && VERSION[1] < 6) { consumed += 1; }

          if (this._complete) {
            this.body = (consumed < chunk.length)
              ? chunk.slice(consumed)
              : new Buffer(0);
          }
        };

        module.exports = HttpParser;
      }],
      ['http-parser-js', '/http-parser.js', function (exports, module, __filename, __dirname, __meta) {
        /* jshint node:true */

        const assert = require('assert');

        exports.HTTPParser = HTTPParser;
        function HTTPParser(type) {
          assert.ok(type === HTTPParser.REQUEST || type === HTTPParser.RESPONSE);
          this.type = type;
          this.state = `${type}_LINE`;
          this.info = {
            headers: [],
            upgrade: false
          };
          this.trailers = [];
          this.line = '';
          this.isChunked = false;
          this.connection = '';
          this.headerSize = 0; // for preventing too big headers
          this.body_bytes = null;
          this.isUserCall = false;
          this.hadError = false;
        }
        HTTPParser.encoding = 'ascii';
        HTTPParser.maxHeaderSize = 80 * 1024; // maxHeaderSize (in bytes) is configurable, but 80kb by default;
        HTTPParser.REQUEST = 'REQUEST';
        HTTPParser.RESPONSE = 'RESPONSE';
        const kOnHeaders = HTTPParser.kOnHeaders = 0;
        const kOnHeadersComplete = HTTPParser.kOnHeadersComplete = 1;
        const kOnBody = HTTPParser.kOnBody = 2;
        const kOnMessageComplete = HTTPParser.kOnMessageComplete = 3;

        // Some handler stubs, needed for compatibility
        HTTPParser.prototype[kOnHeaders] = HTTPParser.prototype[kOnHeadersComplete] = HTTPParser.prototype[kOnBody] = HTTPParser.prototype[kOnMessageComplete] = function () {};

        let compatMode0_12 = true;
        Object.defineProperty(HTTPParser, 'kOnExecute', {
          get() {
            // hack for backward compatibility
            compatMode0_12 = false;
            return 4;
          }
        });

        const methods = exports.methods = HTTPParser.methods = [
          'DELETE',
          'GET',
          'HEAD',
          'POST',
          'PUT',
          'CONNECT',
          'OPTIONS',
          'TRACE',
          'COPY',
          'LOCK',
          'MKCOL',
          'MOVE',
          'PROPFIND',
          'PROPPATCH',
          'SEARCH',
          'UNLOCK',
          'BIND',
          'REBIND',
          'UNBIND',
          'ACL',
          'REPORT',
          'MKACTIVITY',
          'CHECKOUT',
          'MERGE',
          'M-SEARCH',
          'NOTIFY',
          'SUBSCRIBE',
          'UNSUBSCRIBE',
          'PATCH',
          'PURGE',
          'MKCALENDAR',
          'LINK',
          'UNLINK'
        ];
        let method_connect = methods.indexOf('CONNECT');
        HTTPParser.prototype.reinitialize = HTTPParser;
        HTTPParser.prototype.close = HTTPParser.prototype.pause = HTTPParser.prototype.resume = HTTPParser.prototype.free = function () {};
        HTTPParser.prototype._compatMode0_11 = false;
        HTTPParser.prototype.getAsyncId = function () { return 0; };

        const headerState = {
          REQUEST_LINE: true,
          RESPONSE_LINE: true,
          HEADER: true
        };
        HTTPParser.prototype.execute = function (chunk, start, length) {
          if (!(this instanceof HTTPParser)) {
            throw new TypeError('not a HTTPParser');
          }

          // backward compat to node < 0.11.4
          // Note: the start and length params were removed in newer version
          start = start || 0;
          length = typeof length === 'number' ? length : chunk.length;

          this.chunk = chunk;
          this.offset = start;
          const end = this.end = start + length;
          try {
            while (this.offset < end) {
              if (this[this.state]()) {
                break;
              }
            }
          } catch (err) {
            if (this.isUserCall) {
              throw err;
            }
            this.hadError = true;
            return err;
          }
          this.chunk = null;
          length = this.offset - start;
          if (headerState[this.state]) {
            this.headerSize += length;
            if (this.headerSize > HTTPParser.maxHeaderSize) {
              return new Error('max header size exceeded');
            }
          }
          return length;
        };

        const stateFinishAllowed = {
          REQUEST_LINE: true,
          RESPONSE_LINE: true,
          BODY_RAW: true
        };
        HTTPParser.prototype.finish = function () {
          if (this.hadError) {
            return;
          }
          if (!stateFinishAllowed[this.state]) {
            return new Error('invalid state for EOF');
          }
          if (this.state === 'BODY_RAW') {
            this.userCall()(this[kOnMessageComplete]());
          }
        };

        // These three methods are used for an internal speed optimization, and it also
        // works if theses are noops. Basically consume() asks us to read the bytes
        // ourselves, but if we don't do it we get them through execute().
        HTTPParser.prototype.consume = HTTPParser.prototype.unconsume = HTTPParser.prototype.getCurrentBuffer = function () {};

        // For correct error handling - see HTTPParser#execute
        // Usage: this.userCall()(userFunction('arg'));
        HTTPParser.prototype.userCall = function () {
          this.isUserCall = true;
          const self = this;
          return function (ret) {
            self.isUserCall = false;
            return ret;
          };
        };

        HTTPParser.prototype.nextRequest = function () {
          this.userCall()(this[kOnMessageComplete]());
          this.reinitialize(this.type);
        };

        HTTPParser.prototype.consumeLine = function () {
          const { end } = this;
          const { chunk } = this;
          for (let i = this.offset; i < end; i++) {
            if (chunk[i] === 0x0a) { // \n
              let line = this.line + chunk.toString(HTTPParser.encoding, this.offset, i);
              if (line.charAt(line.length - 1) === '\r') {
                line = line.substr(0, line.length - 1);
              }
              this.line = '';
              this.offset = i + 1;
              return line;
            }
          }
          // line split over multiple chunks
          this.line += chunk.toString(HTTPParser.encoding, this.offset, this.end);
          this.offset = this.end;
        };

        const headerExp = /^([^: \t]+):[ \t]*((?:.*[^ \t])|)/;
        const headerContinueExp = /^[ \t]+(.*[^ \t])/;
        HTTPParser.prototype.parseHeader = function (line, headers) {
          if (line.indexOf('\r') !== -1) {
            throw parseErrorCode('HPE_LF_EXPECTED');
          }

          const match = headerExp.exec(line);
          const k = match && match[1];
          if (k) { // skip empty string (malformed header)
            headers.push(k);
            headers.push(match[2]);
          } else {
            const matchContinue = headerContinueExp.exec(line);
            if (matchContinue && headers.length) {
              if (headers[headers.length - 1]) {
                headers[headers.length - 1] += ' ';
              }
              headers[headers.length - 1] += matchContinue[1];
            }
          }
        };

        const requestExp = /^([A-Z-]+) ([^ ]+) HTTP\/(\d)\.(\d)$/;
        HTTPParser.prototype.REQUEST_LINE = function () {
          const line = this.consumeLine();
          if (!line) {
            return;
          }
          const match = requestExp.exec(line);
          if (match === null) {
            throw parseErrorCode('HPE_INVALID_CONSTANT');
          }
          this.info.method = this._compatMode0_11 ? match[1] : methods.indexOf(match[1]);
          if (this.info.method === -1) {
            throw new Error('invalid request method');
          }
          this.info.url = match[2];
          this.info.versionMajor = +match[3];
          this.info.versionMinor = +match[4];
          this.body_bytes = 0;
          this.state = 'HEADER';
        };

        const responseExp = /^HTTP\/(\d)\.(\d) (\d{3}) ?(.*)$/;
        HTTPParser.prototype.RESPONSE_LINE = function () {
          const line = this.consumeLine();
          if (!line) {
            return;
          }
          const match = responseExp.exec(line);
          if (match === null) {
            throw parseErrorCode('HPE_INVALID_CONSTANT');
          }
          this.info.versionMajor = +match[1];
          this.info.versionMinor = +match[2];
          const statusCode = this.info.statusCode = +match[3];
          this.info.statusMessage = match[4];
          // Implied zero length.
          if ((statusCode / 100 | 0) === 1 || statusCode === 204 || statusCode === 304) {
            this.body_bytes = 0;
          }
          this.state = 'HEADER';
        };

        HTTPParser.prototype.shouldKeepAlive = function () {
          if (this.info.versionMajor > 0 && this.info.versionMinor > 0) {
            if (this.connection.indexOf('close') !== -1) {
              return false;
            }
          } else if (this.connection.indexOf('keep-alive') === -1) {
            return false;
          }
          if (this.body_bytes !== null || this.isChunked) { // || skipBody
            return true;
          }
          return false;
        };

        HTTPParser.prototype.HEADER = function () {
          const line = this.consumeLine();
          if (line === undefined) {
            return;
          }
          const { info } = this;
          if (line) {
            this.parseHeader(line, info.headers);
          } else {
            const { headers } = info;
            let hasContentLength = false;
            let currentContentLengthValue;
            let hasUpgradeHeader = false;
            for (let i = 0; i < headers.length; i += 2) {
              switch (headers[i].toLowerCase()) {
                case 'transfer-encoding':
                  this.isChunked = headers[i + 1].toLowerCase() === 'chunked';
                  break;
                case 'content-length':
                  currentContentLengthValue = +headers[i + 1];
                  if (hasContentLength) {
                    // Fix duplicate Content-Length header with same values.
                    // Throw error only if values are different.
                    // Known issues:
                    // https://github.com/request/request/issues/2091#issuecomment-328715113
                    // https://github.com/nodejs/node/issues/6517#issuecomment-216263771
                    if (currentContentLengthValue !== this.body_bytes) {
                      throw parseErrorCode('HPE_UNEXPECTED_CONTENT_LENGTH');
                    }
                  } else {
                    hasContentLength = true;
                    this.body_bytes = currentContentLengthValue;
                  }
                  break;
                case 'connection':
                  this.connection += headers[i + 1].toLowerCase();
                  break;
                case 'upgrade':
                  hasUpgradeHeader = true;
                  break;
              }
            }

            // if both isChunked and hasContentLength, isChunked wins
            // This is required so the body is parsed using the chunked method, and matches
            // Chrome's behavior.  We could, maybe, ignore them both (would get chunked
            // encoding into the body), and/or disable shouldKeepAlive to be more
            // resilient.
            if (this.isChunked && hasContentLength) {
              hasContentLength = false;
              this.body_bytes = null;
            }

            // Logic from https://github.com/nodejs/http-parser/blob/921d5585515a153fa00e411cf144280c59b41f90/http_parser.c#L1727-L1737
            // "For responses, "Upgrade: foo" and "Connection: upgrade" are
            //   mandatory only when it is a 101 Switching Protocols response,
            //   otherwise it is purely informational, to announce support.
            if (hasUpgradeHeader && this.connection.indexOf('upgrade') != -1) {
              info.upgrade = this.type === HTTPParser.REQUEST || info.statusCode === 101;
            } else {
              info.upgrade = info.method === method_connect;
            }

            info.shouldKeepAlive = this.shouldKeepAlive();
            // problem which also exists in original node: we should know skipBody before calling onHeadersComplete
            let skipBody;
            if (compatMode0_12) {
              skipBody = this.userCall()(this[kOnHeadersComplete](info));
            } else {
              skipBody = this.userCall()(this[kOnHeadersComplete](info.versionMajor,
                info.versionMinor, info.headers, info.method, info.url, info.statusCode,
                info.statusMessage, info.upgrade, info.shouldKeepAlive));
            }
            if (skipBody === 2) {
              this.nextRequest();
              return true;
            } if (this.isChunked && !skipBody) {
              this.state = 'BODY_CHUNKHEAD';
            } else if (skipBody || this.body_bytes === 0) {
              this.nextRequest();
              // For older versions of node (v6.x and older?), that return skipBody=1 or skipBody=true,
              //   need this "return true;" if it's an upgrade request.
              return info.upgrade;
            } else if (this.body_bytes === null) {
              this.state = 'BODY_RAW';
            } else {
              this.state = 'BODY_SIZED';
            }
          }
        };

        HTTPParser.prototype.BODY_CHUNKHEAD = function () {
          const line = this.consumeLine();
          if (line === undefined) {
            return;
          }
          this.body_bytes = parseInt(line, 16);
          if (!this.body_bytes) {
            this.state = 'BODY_CHUNKTRAILERS';
          } else {
            this.state = 'BODY_CHUNK';
          }
        };

        HTTPParser.prototype.BODY_CHUNK = function () {
          const length = Math.min(this.end - this.offset, this.body_bytes);
          this.userCall()(this[kOnBody](this.chunk, this.offset, length));
          this.offset += length;
          this.body_bytes -= length;
          if (!this.body_bytes) {
            this.state = 'BODY_CHUNKEMPTYLINE';
          }
        };

        HTTPParser.prototype.BODY_CHUNKEMPTYLINE = function () {
          const line = this.consumeLine();
          if (line === undefined) {
            return;
          }
          assert.equal(line, '');
          this.state = 'BODY_CHUNKHEAD';
        };

        HTTPParser.prototype.BODY_CHUNKTRAILERS = function () {
          const line = this.consumeLine();
          if (line === undefined) {
            return;
          }
          if (line) {
            this.parseHeader(line, this.trailers);
          } else {
            if (this.trailers.length) {
              this.userCall()(this[kOnHeaders](this.trailers, ''));
            }
            this.nextRequest();
          }
        };

        HTTPParser.prototype.BODY_RAW = function () {
          const length = this.end - this.offset;
          this.userCall()(this[kOnBody](this.chunk, this.offset, length));
          this.offset = this.end;
        };

        HTTPParser.prototype.BODY_SIZED = function () {
          const length = Math.min(this.end - this.offset, this.body_bytes);
          this.userCall()(this[kOnBody](this.chunk, this.offset, length));
          this.offset += length;
          this.body_bytes -= length;
          if (!this.body_bytes) {
            this.nextRequest();
          }
        };

        // backward compat to node < 0.11.6
        ['Headers', 'HeadersComplete', 'Body', 'MessageComplete'].forEach((name) => {
          const k = HTTPParser[`kOn${name}`];
          Object.defineProperty(HTTPParser.prototype, `on${name}`, {
            get() {
              return this[k];
            },
            set(to) {
              // hack for backward compatibility
              this._compatMode0_11 = true;
              method_connect = 'CONNECT';
              return (this[k] = to);
            }
          });
        });

        function parseErrorCode(code) {
          const err = new Error('Parse Error');
          err.code = code;
          return err;
        }
      }],
      ['websocket-driver', '/lib/websocket/driver/hybi.js', function (exports, module, __filename, __dirname, __meta) {
        const crypto = require('crypto');
        const util = require('util');
        const Extensions = __node_require__(10 /* 'websocket-extensions' */);
        const Base = __node_require__(2 /* './base' */);
        const Frame = __node_require__(17 /* './hybi/frame' */);
        const Message = __node_require__(18 /* './hybi/message' */);

        var Hybi = function (request, url, options) {
          Base.apply(this, arguments);

          this._extensions = new Extensions();
          this._stage = 0;
          this._masking = this._options.masking;
          this._protocols = this._options.protocols || [];
          this._requireMasking = this._options.requireMasking;
          this._pingCallbacks = {};

          if (typeof this._protocols === 'string') { this._protocols = this._protocols.split(/ *, */); }

          if (!this._request) { return; }

          const secKey = this._request.headers['sec-websocket-key'];
          let protos = this._request.headers['sec-websocket-protocol'];
          const version = this._request.headers['sec-websocket-version'];
          const supported = this._protocols;

          this._headers.set('Upgrade', 'websocket');
          this._headers.set('Connection', 'Upgrade');
          this._headers.set('Sec-WebSocket-Accept', Hybi.generateAccept(secKey));

          if (protos !== undefined) {
            if (typeof protos === 'string') { protos = protos.split(/ *, */); }
            this.protocol = protos.filter(p => supported.indexOf(p) >= 0)[0];
            if (this.protocol) { this._headers.set('Sec-WebSocket-Protocol', this.protocol); }
          }

          this.version = `hybi-${version}`;
        };
        util.inherits(Hybi, Base);

        Hybi.mask = function (payload, mask, offset) {
          if (!mask || mask.length === 0) { return payload; }
          offset = offset || 0;

          for (let i = 0, n = payload.length - offset; i < n; i++) {
            payload[offset + i] = payload[offset + i] ^ mask[i % 4];
          }
          return payload;
        };

        Hybi.generateAccept = function (key) {
          const sha1 = crypto.createHash('sha1');
          sha1.update(key + Hybi.GUID);
          return sha1.digest('base64');
        };

        Hybi.GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

        const instance = {
          FIN: 0x80,
          MASK: 0x80,
          RSV1: 0x40,
          RSV2: 0x20,
          RSV3: 0x10,
          OPCODE: 0x0F,
          LENGTH: 0x7F,

          OPCODES: {
            continuation: 0,
            text: 1,
            binary: 2,
            close: 8,
            ping: 9,
            pong: 10
          },

          OPCODE_CODES: [0, 1, 2, 8, 9, 10],
          MESSAGE_OPCODES: [0, 1, 2],
          OPENING_OPCODES: [1, 2],

          ERRORS: {
            normal_closure: 1000,
            going_away: 1001,
            protocol_error: 1002,
            unacceptable: 1003,
            encoding_error: 1007,
            policy_violation: 1008,
            too_large: 1009,
            extension_error: 1010,
            unexpected_condition: 1011
          },

          ERROR_CODES: [1000, 1001, 1002, 1003, 1007, 1008, 1009, 1010, 1011],
          DEFAULT_ERROR_CODE: 1000,
          MIN_RESERVED_ERROR: 3000,
          MAX_RESERVED_ERROR: 4999,

          // http://www.w3.org/International/questions/qa-forms-utf-8.en.php
          UTF8_MATCH: /^([\x00-\x7F]|[\xC2-\xDF][\x80-\xBF]|\xE0[\xA0-\xBF][\x80-\xBF]|[\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}|\xED[\x80-\x9F][\x80-\xBF]|\xF0[\x90-\xBF][\x80-\xBF]{2}|[\xF1-\xF3][\x80-\xBF]{3}|\xF4[\x80-\x8F][\x80-\xBF]{2})*$/,

          addExtension(extension) {
            this._extensions.add(extension);
            return true;
          },

          parse(chunk) {
            this._reader.put(chunk);
            let buffer = true;
            while (buffer) {
              switch (this._stage) {
                case 0:
                  buffer = this._reader.read(1);
                  if (buffer) { this._parseOpcode(buffer[0]); }
                  break;

                case 1:
                  buffer = this._reader.read(1);
                  if (buffer) { this._parseLength(buffer[0]); }
                  break;

                case 2:
                  buffer = this._reader.read(this._frame.lengthBytes);
                  if (buffer) { this._parseExtendedLength(buffer); }
                  break;

                case 3:
                  buffer = this._reader.read(4);
                  if (buffer) {
                    this._stage = 4;
                    this._frame.maskingKey = buffer;
                  }
                  break;

                case 4:
                  buffer = this._reader.read(this._frame.length);
                  if (buffer) {
                    this._stage = 0;
                    this._emitFrame(buffer);
                  }
                  break;

                default:
                  buffer = null;
              }
            }
          },

          text(message) {
            if (this.readyState > 1) { return false; }
            return this.frame(message, 'text');
          },

          binary(message) {
            if (this.readyState > 1) { return false; }
            return this.frame(message, 'binary');
          },

          ping(message, callback) {
            if (this.readyState > 1) { return false; }
            message = message || '';
            if (callback) { this._pingCallbacks[message] = callback; }
            return this.frame(message, 'ping');
          },

          pong(message) {
            if (this.readyState > 1) { return false; }
            message = message || '';
            return this.frame(message, 'pong');
          },

          close(reason, code) {
            reason = reason || '';
            code = code || this.ERRORS.normal_closure;

            if (this.readyState <= 0) {
              this.readyState = 3;
              this.emit('close', new Base.CloseEvent(code, reason));
              return true;
            } if (this.readyState === 1) {
              this.readyState = 2;
              this._extensions.close(function () { this.frame(reason, 'close', code); }, this);
              return true;
            }
            return false;
          },

          frame(buffer, type, code) {
            if (this.readyState <= 0) { return this._queue([buffer, type, code]); }
            if (this.readyState > 2) { return false; }

            if (buffer instanceof Array) { buffer = new Buffer(buffer); }
            if (typeof buffer === 'number') { buffer = buffer.toString(); }

            const message = new Message();
            const isText = (typeof buffer === 'string');
            let payload; let
              copy;

            message.rsv1 = message.rsv2 = message.rsv3 = false;
            message.opcode = this.OPCODES[type || (isText ? 'text' : 'binary')];

            payload = isText ? new Buffer(buffer, 'utf8') : buffer;

            if (code) {
              copy = payload;
              payload = new Buffer(2 + copy.length);
              payload.writeUInt16BE(code, 0);
              copy.copy(payload, 2);
            }
            message.data = payload;

            const onMessageReady = function (message) {
              const frame = new Frame();

              frame.final = true;
              frame.rsv1 = message.rsv1;
              frame.rsv2 = message.rsv2;
              frame.rsv3 = message.rsv3;
              frame.opcode = message.opcode;
              frame.masked = !!this._masking;
              frame.length = message.data.length;
              frame.payload = message.data;

              if (frame.masked) { frame.maskingKey = crypto.randomBytes(4); }

              this._sendFrame(frame);
            };

            if (this.MESSAGE_OPCODES.indexOf(message.opcode) >= 0) {
              this._extensions.processOutgoingMessage(message, function (error, message) {
                if (error) { return this._fail('extension_error', error.message); }
                onMessageReady.call(this, message);
              }, this);
            } else { onMessageReady.call(this, message); }

            return true;
          },

          _sendFrame(frame) {
            const { length } = frame;
            const header = (length <= 125) ? 2 : (length <= 65535 ? 4 : 10);
            const offset = header + (frame.masked ? 4 : 0);
            const buffer = new Buffer(offset + length);
            const masked = frame.masked ? this.MASK : 0;

            buffer[0] = (frame.final ? this.FIN : 0)
                | (frame.rsv1 ? this.RSV1 : 0)
                | (frame.rsv2 ? this.RSV2 : 0)
                | (frame.rsv3 ? this.RSV3 : 0)
                | frame.opcode;

            if (length <= 125) {
              buffer[1] = masked | length;
            } else if (length <= 65535) {
              buffer[1] = masked | 126;
              buffer.writeUInt16BE(length, 2);
            } else {
              buffer[1] = masked | 127;
              buffer.writeUInt32BE(Math.floor(length / 0x100000000), 2);
              buffer.writeUInt32BE(length % 0x100000000, 6);
            }

            frame.payload.copy(buffer, offset);

            if (frame.masked) {
              frame.maskingKey.copy(buffer, header);
              Hybi.mask(buffer, frame.maskingKey, offset);
            }

            this._write(buffer);
          },

          _handshakeResponse() {
            try {
              var extensions = this._extensions.generateResponse(this._request.headers['sec-websocket-extensions']);
            } catch (e) {
              return this._fail('protocol_error', e.message);
            }

            if (extensions) { this._headers.set('Sec-WebSocket-Extensions', extensions); }

            const start = 'HTTP/1.1 101 Switching Protocols';
            const headers = [start, this._headers.toString(), ''];

            return new Buffer(headers.join('\r\n'), 'utf8');
          },

          _shutdown(code, reason, error) {
            delete this._frame;
            delete this._message;
            this._stage = 5;

            const sendCloseFrame = (this.readyState === 1);
            this.readyState = 2;

            this._extensions.close(function () {
              if (sendCloseFrame) { this.frame(reason, 'close', code); }
              this.readyState = 3;
              if (error) { this.emit('error', new Error(reason)); }
              this.emit('close', new Base.CloseEvent(code, reason));
            }, this);
          },

          _fail(type, message) {
            if (this.readyState > 1) { return; }
            this._shutdown(this.ERRORS[type], message, true);
          },

          _parseOpcode(octet) {
            const rsvs = [this.RSV1, this.RSV2, this.RSV3].map(rsv => (octet & rsv) === rsv);

            const frame = this._frame = new Frame();

            frame.final = (octet & this.FIN) === this.FIN;
            frame.rsv1 = rsvs[0];
            frame.rsv2 = rsvs[1];
            frame.rsv3 = rsvs[2];
            frame.opcode = (octet & this.OPCODE);

            this._stage = 1;

            if (!this._extensions.validFrameRsv(frame)) {
              return this._fail('protocol_error',
                `One or more reserved bits are on: reserved1 = ${frame.rsv1 ? 1 : 0
                }, reserved2 = ${frame.rsv2 ? 1 : 0
                }, reserved3 = ${frame.rsv3 ? 1 : 0}`);
            }

            if (this.OPCODE_CODES.indexOf(frame.opcode) < 0) { return this._fail('protocol_error', `Unrecognized frame opcode: ${frame.opcode}`); }

            if (this.MESSAGE_OPCODES.indexOf(frame.opcode) < 0 && !frame.final) { return this._fail('protocol_error', `Received fragmented control frame: opcode = ${frame.opcode}`); }

            if (this._message && this.OPENING_OPCODES.indexOf(frame.opcode) >= 0) { return this._fail('protocol_error', 'Received new data frame but previous continuous frame is unfinished'); }
          },

          _parseLength(octet) {
            const frame = this._frame;
            frame.masked = (octet & this.MASK) === this.MASK;
            frame.length = (octet & this.LENGTH);

            if (frame.length >= 0 && frame.length <= 125) {
              this._stage = frame.masked ? 3 : 4;
              if (!this._checkFrameLength()) { return; }
            } else {
              this._stage = 2;
              frame.lengthBytes = (frame.length === 126 ? 2 : 8);
            }

            if (this._requireMasking && !frame.masked) { return this._fail('unacceptable', 'Received unmasked frame but masking is required'); }
          },

          _parseExtendedLength(buffer) {
            const frame = this._frame;
            frame.length = this._readUInt(buffer);

            this._stage = frame.masked ? 3 : 4;

            if (this.MESSAGE_OPCODES.indexOf(frame.opcode) < 0 && frame.length > 125) { return this._fail('protocol_error', `Received control frame having too long payload: ${frame.length}`); }

            if (!this._checkFrameLength()) { }
          },

          _checkFrameLength() {
            const length = this._message ? this._message.length : 0;

            if (length + this._frame.length > this._maxLength) {
              this._fail('too_large', 'WebSocket frame length too large');
              return false;
            }
            return true;
          },

          _emitFrame(buffer) {
            const frame = this._frame;
            const payload = frame.payload = Hybi.mask(buffer, frame.maskingKey);
            const { opcode } = frame;
            let message;
            let code; let reason;
            let callbacks; let
              callback;

            delete this._frame;

            if (opcode === this.OPCODES.continuation) {
              if (!this._message) { return this._fail('protocol_error', 'Received unexpected continuation frame'); }
              this._message.pushFrame(frame);
            }

            if (opcode === this.OPCODES.text || opcode === this.OPCODES.binary) {
              this._message = new Message();
              this._message.pushFrame(frame);
            }

            if (frame.final && this.MESSAGE_OPCODES.indexOf(opcode) >= 0) { return this._emitMessage(this._message); }

            if (opcode === this.OPCODES.close) {
              code = (payload.length >= 2) ? payload.readUInt16BE(0) : null;
              reason = (payload.length > 2) ? this._encode(payload.slice(2)) : null;

              if (!(payload.length === 0)
          && !(code !== null && code >= this.MIN_RESERVED_ERROR && code <= this.MAX_RESERVED_ERROR)
          && this.ERROR_CODES.indexOf(code) < 0) { code = this.ERRORS.protocol_error; }

              if (payload.length > 125 || (payload.length > 2 && !reason)) { code = this.ERRORS.protocol_error; }

              this._shutdown(code || this.DEFAULT_ERROR_CODE, reason || '');
            }

            if (opcode === this.OPCODES.ping) {
              this.frame(payload, 'pong');
              this.emit('ping', new Base.PingEvent(payload.toString()));
            }

            if (opcode === this.OPCODES.pong) {
              callbacks = this._pingCallbacks;
              message = this._encode(payload);
              callback = callbacks[message];

              delete callbacks[message];
              if (callback) { callback(); }

              this.emit('pong', new Base.PongEvent(payload.toString()));
            }
          },

          _emitMessage(message) {
            var message = this._message;
            message.read();

            delete this._message;

            this._extensions.processIncomingMessage(message, function (error, message) {
              if (error) { return this._fail('extension_error', error.message); }

              let payload = message.data;
              if (message.opcode === this.OPCODES.text) { payload = this._encode(payload); }

              if (payload === null) { return this._fail('encoding_error', 'Could not decode a text frame as UTF-8'); }
              this.emit('message', new Base.MessageEvent(payload));
            }, this);
          },

          _encode(buffer) {
            try {
              const string = buffer.toString('binary', 0, buffer.length);
              if (!this.UTF8_MATCH.test(string)) { return null; }
            } catch (e) {}
            return buffer.toString('utf8', 0, buffer.length);
          },

          _readUInt(buffer) {
            if (buffer.length === 2) { return buffer.readUInt16BE(0); }

            return buffer.readUInt32BE(0) * 0x100000000
           + buffer.readUInt32BE(4);
          }
        };

        for (const key in instance) { Hybi.prototype[key] = instance[key]; }

        module.exports = Hybi;
      }],
      ['websocket-extensions', '/lib/websocket_extensions.js', function (exports, module, __filename, __dirname, __meta) {
        const Parser = __node_require__(11 /* './parser' */);
        const Pipeline = __node_require__(12 /* './pipeline' */);

        const Extensions = function () {
          this._rsv1 = this._rsv2 = this._rsv3 = null;

          this._byName = {};
          this._inOrder = [];
          this._sessions = [];
          this._index = {};
        };

        Extensions.MESSAGE_OPCODES = [1, 2];

        const instance = {
          add(ext) {
            if (typeof ext.name !== 'string') { throw new TypeError('extension.name must be a string'); }
            if (ext.type !== 'permessage') { throw new TypeError('extension.type must be "permessage"'); }

            if (typeof ext.rsv1 !== 'boolean') { throw new TypeError('extension.rsv1 must be true or false'); }
            if (typeof ext.rsv2 !== 'boolean') { throw new TypeError('extension.rsv2 must be true or false'); }
            if (typeof ext.rsv3 !== 'boolean') { throw new TypeError('extension.rsv3 must be true or false'); }

            if (this._byName.hasOwnProperty(ext.name)) { throw new TypeError(`An extension with name "${ext.name}" is already registered`); }

            this._byName[ext.name] = ext;
            this._inOrder.push(ext);
          },

          generateOffer() {
            const sessions = [];
            const offer = [];
            const index = {};

            this._inOrder.forEach(function (ext) {
              const session = ext.createClientSession();
              if (!session) { return; }

              const record = [ext, session];
              sessions.push(record);
              index[ext.name] = record;

              let offers = session.generateOffer();
              offers = offers ? [].concat(offers) : [];

              offers.forEach((off) => {
                offer.push(Parser.serializeParams(ext.name, off));
              }, this);
            }, this);

            this._sessions = sessions;
            this._index = index;

            return offer.length > 0 ? offer.join(', ') : null;
          },

          activate(header) {
            const responses = Parser.parseHeader(header);
            const sessions = [];

            responses.eachOffer(function (name, params) {
              const record = this._index[name];

              if (!record) { throw new Error(`Server sent an extension response for unknown extension "${name}"`); }

              const ext = record[0];
              const session = record[1];
              const reserved = this._reserved(ext);

              if (reserved) {
                throw new Error(`Server sent two extension responses that use the RSV${
                  reserved[0]} bit: "${
                  reserved[1]}" and "${ext.name}"`);
              }

              if (session.activate(params) !== true) {
                throw new Error(`Server sent unacceptable extension parameters: ${
                  Parser.serializeParams(name, params)}`);
              }

              this._reserve(ext);
              sessions.push(record);
            }, this);

            this._sessions = sessions;
            this._pipeline = new Pipeline(sessions);
          },

          generateResponse(header) {
            const sessions = [];
            const response = [];
            const offers = Parser.parseHeader(header);

            this._inOrder.forEach(function (ext) {
              const offer = offers.byName(ext.name);
              if (offer.length === 0 || this._reserved(ext)) { return; }

              const session = ext.createServerSession(offer);
              if (!session) { return; }

              this._reserve(ext);
              sessions.push([ext, session]);
              response.push(Parser.serializeParams(ext.name, session.generateResponse()));
            }, this);

            this._sessions = sessions;
            this._pipeline = new Pipeline(sessions);

            return response.length > 0 ? response.join(', ') : null;
          },

          validFrameRsv(frame) {
            const allowed = { rsv1: false, rsv2: false, rsv3: false };
            let ext;

            if (Extensions.MESSAGE_OPCODES.indexOf(frame.opcode) >= 0) {
              for (let i = 0, n = this._sessions.length; i < n; i++) {
                ext = this._sessions[i][0];
                allowed.rsv1 = allowed.rsv1 || ext.rsv1;
                allowed.rsv2 = allowed.rsv2 || ext.rsv2;
                allowed.rsv3 = allowed.rsv3 || ext.rsv3;
              }
            }

            return (allowed.rsv1 || !frame.rsv1)
           && (allowed.rsv2 || !frame.rsv2)
           && (allowed.rsv3 || !frame.rsv3);
          },

          processIncomingMessage(message, callback, context) {
            this._pipeline.processIncomingMessage(message, callback, context);
          },

          processOutgoingMessage(message, callback, context) {
            this._pipeline.processOutgoingMessage(message, callback, context);
          },

          close(callback, context) {
            if (!this._pipeline) { return callback.call(context); }
            this._pipeline.close(callback, context);
          },

          _reserve(ext) {
            this._rsv1 = this._rsv1 || (ext.rsv1 && ext.name);
            this._rsv2 = this._rsv2 || (ext.rsv2 && ext.name);
            this._rsv3 = this._rsv3 || (ext.rsv3 && ext.name);
          },

          _reserved(ext) {
            if (this._rsv1 && ext.rsv1) { return [1, this._rsv1]; }
            if (this._rsv2 && ext.rsv2) { return [2, this._rsv2]; }
            if (this._rsv3 && ext.rsv3) { return [3, this._rsv3]; }
            return false;
          }
        };

        for (const key in instance) { Extensions.prototype[key] = instance[key]; }

        module.exports = Extensions;
      }],
      ['websocket-extensions', '/lib/parser.js', function (exports, module, __filename, __dirname, __meta) {
        const TOKEN = /([!#\$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+)/;
        const NOTOKEN = /([^!#\$%&'\*\+\-\.\^_`\|~0-9A-Za-z])/g;
        const QUOTED = /"((?:\\[\x00-\x7f]|[^\x00-\x08\x0a-\x1f\x7f"])*)"/;
        const PARAM = new RegExp(`${TOKEN.source}(?:=(?:${TOKEN.source}|${QUOTED.source}))?`);
        const EXT = new RegExp(`${TOKEN.source}(?: *; *${PARAM.source})*`, 'g');
        const EXT_LIST = new RegExp(`^${EXT.source}(?: *, *${EXT.source})*$`);
        const NUMBER = /^-?(0|[1-9][0-9]*)(\.[0-9]+)?$/;

        const { hasOwnProperty } = Object.prototype;

        const Parser = {
          parseHeader(header) {
            const offers = new Offers();
            if (header === '' || header === undefined) { return offers; }

            if (!EXT_LIST.test(header)) { throw new SyntaxError(`Invalid Sec-WebSocket-Extensions header: ${header}`); }

            const values = header.match(EXT);

            values.forEach(function (value) {
              const params = value.match(new RegExp(PARAM.source, 'g'));
              const name = params.shift();
              const offer = {};

              params.forEach((param) => {
                const args = param.match(PARAM); const key = args[1]; let
                  data;

                if (args[2] !== undefined) {
                  data = args[2];
                } else if (args[3] !== undefined) {
                  data = args[3].replace(/\\/g, '');
                } else {
                  data = true;
                }
                if (NUMBER.test(data)) { data = parseFloat(data); }

                if (hasOwnProperty.call(offer, key)) {
                  offer[key] = [].concat(offer[key]);
                  offer[key].push(data);
                } else {
                  offer[key] = data;
                }
              }, this);
              offers.push(name, offer);
            }, this);

            return offers;
          },

          serializeParams(name, params) {
            const values = [];

            var print = function (key, value) {
              if (value instanceof Array) {
                value.forEach((v) => { print(key, v); });
              } else if (value === true) {
                values.push(key);
              } else if (typeof value === 'number') {
                values.push(`${key}=${value}`);
              } else if (NOTOKEN.test(value)) {
                values.push(`${key}="${value.replace(/"/g, '\\"')}"`);
              } else {
                values.push(`${key}=${value}`);
              }
            };

            for (const key in params) { print(key, params[key]); }

            return [name].concat(values).join('; ');
          }
        };

        var Offers = function () {
          this._byName = {};
          this._inOrder = [];
        };

        Offers.prototype.push = function (name, params) {
          if (!hasOwnProperty.call(this._byName, name)) { this._byName[name] = []; }

          this._byName[name].push(params);
          this._inOrder.push({ name, params });
        };

        Offers.prototype.eachOffer = function (callback, context) {
          const list = this._inOrder;
          for (let i = 0, n = list.length; i < n; i++) { callback.call(context, list[i].name, list[i].params); }
        };

        Offers.prototype.byName = function (name) {
          return this._byName[name] || [];
        };

        Offers.prototype.toArray = function () {
          return this._inOrder.slice();
        };

        module.exports = Parser;
      }],
      ['websocket-extensions', '/lib/pipeline/index.js', function (exports, module, __filename, __dirname, __meta) {
        const Cell = __node_require__(13 /* './cell' */);
        const Pledge = __node_require__(16 /* './pledge' */);

        const Pipeline = function (sessions) {
          this._cells = sessions.map(session => new Cell(session));
          this._stopped = { incoming: false, outgoing: false };
        };

        Pipeline.prototype.processIncomingMessage = function (message, callback, context) {
          if (this._stopped.incoming) { return; }
          this._loop('incoming', this._cells.length - 1, -1, -1, message, callback, context);
        };

        Pipeline.prototype.processOutgoingMessage = function (message, callback, context) {
          if (this._stopped.outgoing) { return; }
          this._loop('outgoing', 0, this._cells.length, 1, message, callback, context);
        };

        Pipeline.prototype.close = function (callback, context) {
          this._stopped = { incoming: true, outgoing: true };

          const closed = this._cells.map(a => a.close());
          if (callback) { Pledge.all(closed).then(() => { callback.call(context); }); }
        };

        Pipeline.prototype._loop = function (direction, start, end, step, message, callback, context) {
          const cells = this._cells;
          let n = cells.length;
          const self = this;

          while (n--) { cells[n].pending(direction); }

          var pipe = function (index, error, msg) {
            if (index === end) { return callback.call(context, error, msg); }

            cells[index][direction](error, msg, (err, m) => {
              if (err) { self._stopped[direction] = true; }
              pipe(index + step, err, m);
            });
          };
          pipe(start, null, message);
        };

        module.exports = Pipeline;
      }],
      ['websocket-extensions', '/lib/pipeline/cell.js', function (exports, module, __filename, __dirname, __meta) {
        const Functor = __node_require__(14 /* './functor' */);
        const Pledge = __node_require__(16 /* './pledge' */);

        const Cell = function (tuple) {
          this._ext = tuple[0];
          this._session = tuple[1];

          this._functors = {
            incoming: new Functor(this._session, 'processIncomingMessage'),
            outgoing: new Functor(this._session, 'processOutgoingMessage')
          };
        };

        Cell.prototype.pending = function (direction) {
          const functor = this._functors[direction];
          if (!functor._stopped) { functor.pending += 1; }
        };

        Cell.prototype.incoming = function (error, message, callback, context) {
          this._exec('incoming', error, message, callback, context);
        };

        Cell.prototype.outgoing = function (error, message, callback, context) {
          this._exec('outgoing', error, message, callback, context);
        };

        Cell.prototype.close = function () {
          this._closed = this._closed || new Pledge();
          this._doClose();
          return this._closed;
        };

        Cell.prototype._exec = function (direction, error, message, callback, context) {
          this._functors[direction].call(error, message, function (err, msg) {
            if (err) { err.message = `${this._ext.name}: ${err.message}`; }
            callback.call(context, err, msg);
            this._doClose();
          }, this);
        };

        Cell.prototype._doClose = function () {
          const fin = this._functors.incoming;
          const fout = this._functors.outgoing;

          if (!this._closed || fin.pending + fout.pending !== 0) { return; }
          if (this._session) { this._session.close(); }
          this._session = null;
          this._closed.done();
        };

        module.exports = Cell;
      }],
      ['websocket-extensions', '/lib/pipeline/functor.js', function (exports, module, __filename, __dirname, __meta) {
        const RingBuffer = __node_require__(15 /* './ring_buffer' */);

        var Functor = function (session, method) {
          this._session = session;
          this._method = method;
          this._queue = new RingBuffer(Functor.QUEUE_SIZE);
          this._stopped = false;
          this.pending = 0;
        };

        Functor.QUEUE_SIZE = 8;

        Functor.prototype.call = function (error, message, callback, context) {
          if (this._stopped) { return; }

          const record = {
            error, message, callback, context, done: false
          };
          let called = false;
          const self = this;

          this._queue.push(record);

          if (record.error) {
            record.done = true;
            this._stop();
            return this._flushQueue();
          }

          const handler = function (err, msg) {
            if (!(called ^ (called = true))) { return; }

            if (err) {
              self._stop();
              record.error = err;
              record.message = null;
            } else {
              record.message = msg;
            }

            record.done = true;
            self._flushQueue();
          };

          try {
            this._session[this._method](message, handler);
          } catch (err) {
            handler(err);
          }
        };

        Functor.prototype._stop = function () {
          this.pending = this._queue.length;
          this._stopped = true;
        };

        Functor.prototype._flushQueue = function () {
          const queue = this._queue; let
            record;

          while (queue.length > 0 && queue.peek().done) {
            record = queue.shift();
            if (record.error) {
              this.pending = 0;
              queue.clear();
            } else {
              this.pending -= 1;
            }
            record.callback.call(record.context, record.error, record.message);
          }
        };

        module.exports = Functor;
      }],
      ['websocket-extensions', '/lib/pipeline/ring_buffer.js', function (exports, module, __filename, __dirname, __meta) {
        const RingBuffer = function (bufferSize) {
          this._bufferSize = bufferSize;
          this.clear();
        };

        RingBuffer.prototype.clear = function () {
          this._buffer = new Array(this._bufferSize);
          this._ringOffset = 0;
          this._ringSize = this._bufferSize;
          this._head = 0;
          this._tail = 0;
          this.length = 0;
        };

        RingBuffer.prototype.push = function (value) {
          let expandBuffer = false;
          let expandRing = false;

          if (this._ringSize < this._bufferSize) {
            expandBuffer = (this._tail === 0);
          } else if (this._ringOffset === this._ringSize) {
            expandBuffer = true;
            expandRing = (this._tail === 0);
          }

          if (expandBuffer) {
            this._tail = this._bufferSize;
            this._buffer = this._buffer.concat(new Array(this._bufferSize));
            this._bufferSize = this._buffer.length;

            if (expandRing) { this._ringSize = this._bufferSize; }
          }

          this._buffer[this._tail] = value;
          this.length += 1;
          if (this._tail < this._ringSize) { this._ringOffset += 1; }
          this._tail = (this._tail + 1) % this._bufferSize;
        };

        RingBuffer.prototype.peek = function () {
          if (this.length === 0) { return void 0; }
          return this._buffer[this._head];
        };

        RingBuffer.prototype.shift = function () {
          if (this.length === 0) { return void 0; }

          const value = this._buffer[this._head];
          this._buffer[this._head] = void 0;
          this.length -= 1;
          this._ringOffset -= 1;

          if (this._ringOffset === 0 && this.length > 0) {
            this._head = this._ringSize;
            this._ringOffset = this.length;
            this._ringSize = this._bufferSize;
          } else {
            this._head = (this._head + 1) % this._ringSize;
          }
          return value;
        };

        module.exports = RingBuffer;
      }],
      ['websocket-extensions', '/lib/pipeline/pledge.js', function (exports, module, __filename, __dirname, __meta) {
        const RingBuffer = __node_require__(15 /* './ring_buffer' */);

        var Pledge = function () {
          this._complete = false;
          this._callbacks = new RingBuffer(Pledge.QUEUE_SIZE);
        };

        Pledge.QUEUE_SIZE = 4;

        Pledge.all = function (list) {
          const pledge = new Pledge();
          let pending = list.length;
          let n = pending;

          if (pending === 0) { pledge.done(); }

          while (n--) {
            list[n].then(() => {
              pending -= 1;
              if (pending === 0) { pledge.done(); }
            });
          }
          return pledge;
        };

        Pledge.prototype.then = function (callback) {
          if (this._complete) { callback(); } else { this._callbacks.push(callback); }
        };

        Pledge.prototype.done = function () {
          this._complete = true;
          const callbacks = this._callbacks; let
            callback;
          while (callback = callbacks.shift()) { callback(); }
        };

        module.exports = Pledge;
      }],
      ['websocket-driver', '/lib/websocket/driver/hybi/frame.js', function (exports, module, __filename, __dirname, __meta) {
        const Frame = function () {};

        const instance = {
          final: false,
          rsv1: false,
          rsv2: false,
          rsv3: false,
          opcode: null,
          masked: false,
          maskingKey: null,
          lengthBytes: 1,
          length: 0,
          payload: null
        };

        for (const key in instance) { Frame.prototype[key] = instance[key]; }

        module.exports = Frame;
      }],
      ['websocket-driver', '/lib/websocket/driver/hybi/message.js', function (exports, module, __filename, __dirname, __meta) {
        const Message = function () {
          this.rsv1 = false;
          this.rsv2 = false;
          this.rsv3 = false;
          this.opcode = null;
          this.length = 0;
          this._chunks = [];
        };

        const instance = {
          read() {
            if (this.data) { return this.data; }

            this.data = new Buffer(this.length);
            let offset = 0;

            for (let i = 0, n = this._chunks.length; i < n; i++) {
              this._chunks[i].copy(this.data, offset);
              offset += this._chunks[i].length;
            }
            return this.data;
          },

          pushFrame(frame) {
            this.rsv1 = this.rsv1 || frame.rsv1;
            this.rsv2 = this.rsv2 || frame.rsv2;
            this.rsv3 = this.rsv3 || frame.rsv3;

            if (this.opcode === null) { this.opcode = frame.opcode; }

            this._chunks.push(frame.payload);
            this.length += frame.length;
          }
        };

        for (const key in instance) { Message.prototype[key] = instance[key]; }

        module.exports = Message;
      }],
      ['websocket-driver', '/lib/websocket/driver/proxy.js', function (exports, module, __filename, __dirname, __meta) {
        const { Stream } = require('stream');
        const url = require('url');
        const util = require('util');
        const Base = __node_require__(2 /* './base' */);
        const Headers = __node_require__(4 /* './headers' */);
        const HttpParser = __node_require__(7 /* '../http_parser' */);

        const PORTS = { 'ws:': 80, 'wss:': 443 };

        const Proxy = function (client, origin, options) {
          this._client = client;
          this._http = new HttpParser('response');
          this._origin = (typeof client.url === 'object') ? client.url : url.parse(client.url);
          this._url = (typeof origin === 'object') ? origin : url.parse(origin);
          this._options = options || {};
          this._state = 0;

          this.readable = this.writable = true;
          this._paused = false;

          this._headers = new Headers();
          this._headers.set('Host', this._origin.host);
          this._headers.set('Connection', 'keep-alive');
          this._headers.set('Proxy-Connection', 'keep-alive');

          const auth = this._url.auth && new Buffer(this._url.auth, 'utf8').toString('base64');
          if (auth) { this._headers.set('Proxy-Authorization', `Basic ${auth}`); }
        };
        util.inherits(Proxy, Stream);

        const instance = {
          setHeader(name, value) {
            if (this._state !== 0) { return false; }
            this._headers.set(name, value);
            return true;
          },

          start() {
            if (this._state !== 0) { return false; }
            this._state = 1;

            const origin = this._origin;
            const port = origin.port || PORTS[origin.protocol];
            const start = `CONNECT ${origin.hostname}:${port} HTTP/1.1`;

            const headers = [start, this._headers.toString(), ''];

            this.emit('data', new Buffer(headers.join('\r\n'), 'utf8'));
            return true;
          },

          pause() {
            this._paused = true;
          },

          resume() {
            this._paused = false;
            this.emit('drain');
          },

          write(chunk) {
            if (!this.writable) { return false; }

            this._http.parse(chunk);
            if (!this._http.isComplete()) { return !this._paused; }

            this.statusCode = this._http.statusCode;
            this.headers = this._http.headers;

            if (this.statusCode === 200) {
              this.emit('connect', new Base.ConnectEvent());
            } else {
              const message = `Can't establish a connection to the server at ${this._origin.href}`;
              this.emit('error', new Error(message));
            }
            this.end();
            return !this._paused;
          },

          end(chunk) {
            if (!this.writable) { return; }
            if (chunk !== undefined) { this.write(chunk); }
            this.readable = this.writable = false;
            this.emit('close');
            this.emit('end');
          },

          destroy() {
            this.end();
          }
        };

        for (const key in instance) { Proxy.prototype[key] = instance[key]; }

        module.exports = Proxy;
      }],
      ['websocket-driver', '/lib/websocket/driver/server.js', function (exports, module, __filename, __dirname, __meta) {
        const util = require('util');
        const HttpParser = __node_require__(7 /* '../http_parser' */);
        const Base = __node_require__(2 /* './base' */);
        const Draft75 = __node_require__(21 /* './draft75' */);
        const Draft76 = __node_require__(22 /* './draft76' */);
        const Hybi = __node_require__(9 /* './hybi' */);

        const Server = function (options) {
          Base.call(this, null, null, options);
          this._http = new HttpParser('request');
        };
        util.inherits(Server, Base);

        const instance = {
          EVENTS: ['open', 'message', 'error', 'close'],

          _bindEventListeners() {
            this.messages.on('error', () => {});
            this.on('error', () => {});
          },

          parse(chunk) {
            if (this._delegate) { return this._delegate.parse(chunk); }

            this._http.parse(chunk);
            if (!this._http.isComplete()) { return; }

            this.method = this._http.method;
            this.url = this._http.url;
            this.headers = this._http.headers;
            this.body = this._http.body;

            const self = this;
            this._delegate = Server.http(this, this._options);
            this._delegate.messages = this.messages;
            this._delegate.io = this.io;
            this._open();

            this.EVENTS.forEach(function (event) {
              this._delegate.on(event, (e) => { self.emit(event, e); });
            }, this);

            this.protocol = this._delegate.protocol;
            this.version = this._delegate.version;

            this.parse(this._http.body);
            this.emit('connect', new Base.ConnectEvent());
          },

          _open() {
            this.__queue.forEach(function (msg) {
              this._delegate[msg[0]].apply(this._delegate, msg[1]);
            }, this);
            this.__queue = [];
          }
        };

        ['addExtension', 'setHeader', 'start', 'frame', 'text', 'binary', 'ping', 'close'].forEach((method) => {
          instance[method] = function () {
            if (this._delegate) {
              return this._delegate[method].apply(this._delegate, arguments);
            }
            this.__queue.push([method, arguments]);
            return true;
          };
        });

        for (const key in instance) { Server.prototype[key] = instance[key]; }

        Server.isSecureRequest = function (request) {
          if (request.connection && request.connection.authorized !== undefined) { return true; }
          if (request.socket && request.socket.secure) { return true; }

          const { headers } = request;
          if (!headers) { return false; }
          if (headers.https === 'on') { return true; }
          if (headers['x-forwarded-ssl'] === 'on') { return true; }
          if (headers['x-forwarded-scheme'] === 'https') { return true; }
          if (headers['x-forwarded-proto'] === 'https') { return true; }

          return false;
        };

        Server.determineUrl = function (request) {
          const scheme = this.isSecureRequest(request) ? 'wss:' : 'ws:';
          return `${scheme}//${request.headers.host}${request.url}`;
        };

        Server.http = function (request, options) {
          options = options || {};
          if (options.requireMasking === undefined) { options.requireMasking = true; }

          const { headers } = request;
          const url = this.determineUrl(request);

          if (headers['sec-websocket-version']) { return new Hybi(request, url, options); }
          if (headers['sec-websocket-key1']) { return new Draft76(request, url, options); }
          return new Draft75(request, url, options);
        };

        module.exports = Server;
      }],
      ['websocket-driver', '/lib/websocket/driver/draft75.js', function (exports, module, __filename, __dirname, __meta) {
        const Base = __node_require__(2 /* './base' */);
        const util = require('util');

        const Draft75 = function (request, url, options) {
          Base.apply(this, arguments);
          this._stage = 0;
          this.version = 'hixie-75';

          this._headers.set('Upgrade', 'WebSocket');
          this._headers.set('Connection', 'Upgrade');
          this._headers.set('WebSocket-Origin', this._request.headers.origin);
          this._headers.set('WebSocket-Location', this.url);
        };
        util.inherits(Draft75, Base);

        const instance = {
          close() {
            if (this.readyState === 3) { return false; }
            this.readyState = 3;
            this.emit('close', new Base.CloseEvent(null, null));
            return true;
          },

          parse(chunk) {
            if (this.readyState > 1) { return; }

            this._reader.put(chunk);

            this._reader.eachByte(function (octet) {
              let message;

              switch (this._stage) {
                case -1:
                  this._body.push(octet);
                  this._sendHandshakeBody();
                  break;

                case 0:
                  this._parseLeadingByte(octet);
                  break;

                case 1:
                  this._length = (octet & 0x7F) + 128 * this._length;

                  if (this._closing && this._length === 0) {
                    return this.close();
                  }
                  if ((octet & 0x80) !== 0x80) {
                    if (this._length === 0) {
                      this._stage = 0;
                    } else {
                      this._skipped = 0;
                      this._stage = 2;
                    }
                  }
                  break;

                case 2:
                  if (octet === 0xFF) {
                    this._stage = 0;
                    message = new Buffer(this._buffer).toString('utf8', 0, this._buffer.length);
                    this.emit('message', new Base.MessageEvent(message));
                  } else if (this._length) {
                    this._skipped += 1;
                    if (this._skipped === this._length) { this._stage = 0; }
                  } else {
                    this._buffer.push(octet);
                    if (this._buffer.length > this._maxLength) { return this.close(); }
                  }
                  break;
              }
            }, this);
          },

          frame(buffer) {
            if (this.readyState === 0) { return this._queue([buffer]); }
            if (this.readyState > 1) { return false; }

            if (typeof buffer !== 'string') { buffer = buffer.toString(); }

            const payload = new Buffer(buffer, 'utf8');
            const frame = new Buffer(payload.length + 2);

            frame[0] = 0x00;
            frame[payload.length + 1] = 0xFF;
            payload.copy(frame, 1);

            this._write(frame);
            return true;
          },

          _handshakeResponse() {
            const start = 'HTTP/1.1 101 Web Socket Protocol Handshake';
            const headers = [start, this._headers.toString(), ''];

            return new Buffer(headers.join('\r\n'), 'utf8');
          },

          _parseLeadingByte(octet) {
            if ((octet & 0x80) === 0x80) {
              this._length = 0;
              this._stage = 1;
            } else {
              delete this._length;
              delete this._skipped;
              this._buffer = [];
              this._stage = 2;
            }
          }
        };

        for (const key in instance) { Draft75.prototype[key] = instance[key]; }

        module.exports = Draft75;
      }],
      ['websocket-driver', '/lib/websocket/driver/draft76.js', function (exports, module, __filename, __dirname, __meta) {
        const Base = __node_require__(2 /* './base' */);
        const Draft75 = __node_require__(21 /* './draft75' */);
        const crypto = require('crypto');
        const util = require('util');


        const numberFromKey = function (key) {
          return parseInt(key.match(/[0-9]/g).join(''), 10);
        };

        const spacesInKey = function (key) {
          return key.match(/ /g).length;
        };


        const Draft76 = function (request, url, options) {
          Draft75.apply(this, arguments);
          this._stage = -1;
          this._body = [];
          this.version = 'hixie-76';

          this._headers.clear();

          this._headers.set('Upgrade', 'WebSocket');
          this._headers.set('Connection', 'Upgrade');
          this._headers.set('Sec-WebSocket-Origin', this._request.headers.origin);
          this._headers.set('Sec-WebSocket-Location', this.url);
        };
        util.inherits(Draft76, Draft75);

        const instance = {
          BODY_SIZE: 8,

          start() {
            if (!Draft75.prototype.start.call(this)) { return false; }
            this._started = true;
            this._sendHandshakeBody();
            return true;
          },

          close() {
            if (this.readyState === 3) { return false; }
            this._write(new Buffer([0xFF, 0x00]));
            this.readyState = 3;
            this.emit('close', new Base.CloseEvent(null, null));
            return true;
          },

          _handshakeResponse() {
            var { headers } = this._request;

            const key1 = headers['sec-websocket-key1'];
            const number1 = numberFromKey(key1);
            const spaces1 = spacesInKey(key1);

            const key2 = headers['sec-websocket-key2'];
            const number2 = numberFromKey(key2);
            const spaces2 = spacesInKey(key2);

            if (number1 % spaces1 !== 0 || number2 % spaces2 !== 0) {
              this.emit('error', new Error('Client sent invalid Sec-WebSocket-Key headers'));
              this.close();
              return null;
            }

            this._keyValues = [number1 / spaces1, number2 / spaces2];

            const start = 'HTTP/1.1 101 WebSocket Protocol Handshake';
            var headers = [start, this._headers.toString(), ''];

            return new Buffer(headers.join('\r\n'), 'binary');
          },

          _handshakeSignature() {
            if (this._body.length < this.BODY_SIZE) { return null; }

            const md5 = crypto.createHash('md5');
            const buffer = new Buffer(8 + this.BODY_SIZE);

            buffer.writeUInt32BE(this._keyValues[0], 0);
            buffer.writeUInt32BE(this._keyValues[1], 4);
            new Buffer(this._body).copy(buffer, 8, 0, this.BODY_SIZE);

            md5.update(buffer);
            return new Buffer(md5.digest('binary'), 'binary');
          },

          _sendHandshakeBody() {
            if (!this._started) { return; }
            const signature = this._handshakeSignature();
            if (!signature) { return; }

            this._write(signature);
            this._stage = 0;
            this._open();

            if (this._body.length > this.BODY_SIZE) { this.parse(this._body.slice(this.BODY_SIZE)); }
          },

          _parseLeadingByte(octet) {
            if (octet !== 0xFF) { return Draft75.prototype._parseLeadingByte.call(this, octet); }

            this._closing = true;
            this._length = 0;
            this._stage = 1;
          }
        };

        for (const key in instance) { Draft76.prototype[key] = instance[key]; }

        module.exports = Draft76;
      }],
      ['faye-websocket', '/lib/faye/websocket/api.js', function (exports, module, __filename, __dirname, __meta) {
        const { Stream } = require('stream');
        const util = require('util');
        const driver = __node_require__(1 /* 'websocket-driver' */);
        const EventTarget = __node_require__(24 /* './api/event_target' */);
        const Event = __node_require__(25 /* './api/event' */);

        var API = function (options) {
          options = options || {};
          driver.validateOptions(options, ['headers', 'extensions', 'maxLength', 'ping', 'proxy', 'tls', 'ca']);

          this.readable = this.writable = true;

          const { headers } = options;
          if (headers) {
            for (const name in headers) { this._driver.setHeader(name, headers[name]); }
          }

          const { extensions } = options;
          if (extensions) {
            [].concat(extensions).forEach(this._driver.addExtension, this._driver);
          }

          this._ping = options.ping;
          this._pingId = 0;
          this.readyState = API.CONNECTING;
          this.bufferedAmount = 0;
          this.protocol = '';
          this.url = this._driver.url;
          this.version = this._driver.version;

          const self = this;

          this._driver.on('open', (e) => { self._open(); });
          this._driver.on('message', (e) => { self._receiveMessage(e.data); });
          this._driver.on('close', (e) => { self._beginClose(e.reason, e.code); });

          this._driver.on('error', (error) => {
            self._emitError(error.message);
          });
          this.on('error', () => {});

          this._driver.messages.on('drain', () => {
            self.emit('drain');
          });

          if (this._ping) {
            this._pingTimer = setInterval(() => {
              self._pingId += 1;
              self.ping(self._pingId.toString());
            }, this._ping * 1000);
          }

          this._configureStream();

          if (!this._proxy) {
            this._stream.pipe(this._driver.io);
            this._driver.io.pipe(this._stream);
          }
        };
        util.inherits(API, Stream);

        API.CONNECTING = 0;
        API.OPEN = 1;
        API.CLOSING = 2;
        API.CLOSED = 3;

        API.CLOSE_TIMEOUT = 30000;

        const instance = {
          write(data) {
            return this.send(data);
          },

          end(data) {
            if (data !== undefined) { this.send(data); }
            this.close();
          },

          pause() {
            return this._driver.messages.pause();
          },

          resume() {
            return this._driver.messages.resume();
          },

          send(data) {
            if (this.readyState > API.OPEN) { return false; }
            if (!(data instanceof Buffer)) { data = String(data); }
            return this._driver.messages.write(data);
          },

          ping(message, callback) {
            if (this.readyState > API.OPEN) { return false; }
            return this._driver.ping(message, callback);
          },

          close(code, reason) {
            if (code === undefined) { code = 1000; }
            if (reason === undefined) { reason = ''; }

            if (code !== 1000 && (code < 3000 || code > 4999)) {
              throw new Error(`${"Failed to execute 'close' on WebSocket: "
                      + 'The code must be either 1000, or between 3000 and 4999. '}${
                code} is neither.`);
            }

            if (this.readyState !== API.CLOSED) { this.readyState = API.CLOSING; }

            const self = this;

            this._closeTimer = setTimeout(() => {
              self._beginClose('', 1006);
            }, API.CLOSE_TIMEOUT);

            this._driver.close(reason, code);
          },

          _configureStream() {
            const self = this;

            this._stream.setTimeout(0);
            this._stream.setNoDelay(true);

            ['close', 'end'].forEach(function (event) {
              this._stream.on(event, () => { self._finalizeClose(); });
            }, this);

            this._stream.on('error', (error) => {
              self._emitError(`Network error: ${self.url}: ${error.message}`);
              self._finalizeClose();
            });
          },

          _open() {
            if (this.readyState !== API.CONNECTING) { return; }

            this.readyState = API.OPEN;
            this.protocol = this._driver.protocol || '';

            const event = new Event('open');
            event.initEvent('open', false, false);
            this.dispatchEvent(event);
          },

          _receiveMessage(data) {
            if (this.readyState > API.OPEN) { return false; }

            if (this.readable) { this.emit('data', data); }

            const event = new Event('message', { data });
            event.initEvent('message', false, false);
            this.dispatchEvent(event);
          },

          _emitError(message) {
            if (this.readyState >= API.CLOSING) { return; }

            const event = new Event('error', { message });
            event.initEvent('error', false, false);
            this.dispatchEvent(event);
          },

          _beginClose(reason, code) {
            if (this.readyState === API.CLOSED) { return; }
            this.readyState = API.CLOSING;
            this._closeParams = [reason, code];

            if (this._stream) {
              this._stream.destroy();
              if (!this._stream.readable) { this._finalizeClose(); }
            }
          },

          _finalizeClose() {
            if (this._closeTimer) { clearTimeout(this._closeTimer); }

            if (this.readyState === API.CLOSED) { return; }
            this.readyState = API.CLOSED;

            if (this._pingTimer) { clearInterval(this._pingTimer); }
            if (this._stream) { this._stream.end(); }

            if (this.readable) { this.emit('end'); }
            this.readable = this.writable = false;

            const reason = this._closeParams ? this._closeParams[0] : '';
            const code = this._closeParams ? this._closeParams[1] : 1006;

            const event = new Event('close', { code, reason });
            event.initEvent('close', false, false);
            this.dispatchEvent(event);
          }
        };

        for (const method in instance) { API.prototype[method] = instance[method]; }
        for (const key in EventTarget) { API.prototype[key] = EventTarget[key]; }

        module.exports = API;
      }],
      ['faye-websocket', '/lib/faye/websocket/api/event_target.js', function (exports, module, __filename, __dirname, __meta) {
        const Event = __node_require__(25 /* './event' */);

        const EventTarget = {
          onopen: null,
          onmessage: null,
          onerror: null,
          onclose: null,

          addEventListener(eventType, listener, useCapture) {
            this.on(eventType, listener);
          },

          removeEventListener(eventType, listener, useCapture) {
            this.removeListener(eventType, listener);
          },

          dispatchEvent(event) {
            event.target = event.currentTarget = this;
            event.eventPhase = Event.AT_TARGET;

            if (this[`on${event.type}`]) { this[`on${event.type}`](event); }

            this.emit(event.type, event);
          }
        };

        module.exports = EventTarget;
      }],
      ['faye-websocket', '/lib/faye/websocket/api/event.js', function (exports, module, __filename, __dirname, __meta) {
        const Event = function (eventType, options) {
          this.type = eventType;
          for (const key in options) { this[key] = options[key]; }
        };

        Event.prototype.initEvent = function (eventType, canBubble, cancelable) {
          this.type = eventType;
          this.bubbles = canBubble;
          this.cancelable = cancelable;
        };

        Event.prototype.stopPropagation = function () {};
        Event.prototype.preventDefault = function () {};

        Event.CAPTURING_PHASE = 1;
        Event.AT_TARGET = 2;
        Event.BUBBLING_PHASE = 3;

        module.exports = Event;
      }],
      ['faye-websocket', '/lib/faye/websocket/client.js', function (exports, module, __filename, __dirname, __meta) {
        const util = require('util');
        const net = require('net');
        const tls = require('tls');
        const url = require('url');
        const driver = __node_require__(1 /* 'websocket-driver' */);
        const API = __node_require__(23 /* './api' */);
        const Event = __node_require__(25 /* './api/event' */);

        const DEFAULT_PORTS = {
          'http:': 80, 'https:': 443, 'ws:': 80, 'wss:': 443
        };
        const SECURE_PROTOCOLS = ['https:', 'wss:'];

        const Client = function (_url, protocols, options) {
          options = options || {};

          this.url = _url;
          this._driver = driver.client(this.url, { maxLength: options.maxLength, protocols });

          ['open', 'error'].forEach(function (event) {
            this._driver.on(event, () => {
              self.headers = self._driver.headers;
              self.statusCode = self._driver.statusCode;
            });
          }, this);

          const proxy = options.proxy || {};
          const endpoint = url.parse(proxy.origin || this.url);
          const port = endpoint.port || DEFAULT_PORTS[endpoint.protocol];
          const secure = SECURE_PROTOCOLS.indexOf(endpoint.protocol) >= 0;
          const onConnect = function () { self._onConnect(); };
          const netOptions = options.net || {};
          const originTLS = options.tls || {};
          const socketTLS = proxy.origin ? (proxy.tls || {}) : originTLS;
          var self = this;

          netOptions.host = socketTLS.host = endpoint.hostname;
          netOptions.port = socketTLS.port = port;

          originTLS.ca = originTLS.ca || options.ca;
          socketTLS.servername = socketTLS.servername || endpoint.hostname;

          this._stream = secure
            ? tls.connect(socketTLS, onConnect)
            : net.connect(netOptions, onConnect);

          if (proxy.origin) { this._configureProxy(proxy, originTLS); }

          API.call(this, options);
        };
        util.inherits(Client, API);

        Client.prototype._onConnect = function () {
          const worker = this._proxy || this._driver;
          worker.start();
        };

        Client.prototype._configureProxy = function (proxy, originTLS) {
          const uri = url.parse(this.url);
          const secure = SECURE_PROTOCOLS.indexOf(uri.protocol) >= 0;
          const self = this;
          let name;

          this._proxy = this._driver.proxy(proxy.origin);

          if (proxy.headers) {
            for (name in proxy.headers) { this._proxy.setHeader(name, proxy.headers[name]); }
          }

          this._proxy.pipe(this._stream, { end: false });
          this._stream.pipe(this._proxy);

          this._proxy.on('connect', () => {
            if (secure) {
              const options = { socket: self._stream, servername: uri.hostname };
              for (name in originTLS) { options[name] = originTLS[name]; }
              self._stream = tls.connect(options);
              self._configureStream();
            }
            self._driver.io.pipe(self._stream);
            self._stream.pipe(self._driver.io);
            self._driver.start();
          });

          this._proxy.on('error', (error) => {
            self._driver.emit('error', error);
          });
        };

        module.exports = Client;
      }],
      ['faye-websocket', '/lib/faye/eventsource.js', function (exports, module, __filename, __dirname, __meta) {
        const { Stream } = require('stream');
        const util = require('util');
        const driver = __node_require__(1 /* 'websocket-driver' */);
        const Headers = __node_require__(4 /* 'websocket-driver/lib/websocket/driver/headers' */);
        const API = __node_require__(23 /* './websocket/api' */);
        const EventTarget = __node_require__(24 /* './websocket/api/event_target' */);
        const Event = __node_require__(25 /* './websocket/api/event' */);

        const EventSource = function (request, response, options) {
          this.writable = true;
          options = options || {};

          this._stream = response.socket;
          this._ping = options.ping || this.DEFAULT_PING;
          this._retry = options.retry || this.DEFAULT_RETRY;

          const scheme = driver.isSecureRequest(request) ? 'https:' : 'http:';
          this.url = `${scheme}//${request.headers.host}${request.url}`;
          this.lastEventId = request.headers['last-event-id'] || '';
          this.readyState = API.CONNECTING;

          const headers = new Headers();
          const self = this;

          if (options.headers) {
            for (const key in options.headers) { headers.set(key, options.headers[key]); }
          }

          if (!this._stream || !this._stream.writable) { return; }
          process.nextTick(() => { self._open(); });

          this._stream.setTimeout(0);
          this._stream.setNoDelay(true);

          const handshake = `${'HTTP/1.1 200 OK\r\n'
                  + 'Content-Type: text/event-stream\r\n'
                  + 'Cache-Control: no-cache, no-store\r\n'
                  + 'Connection: close\r\n'}${
            headers.toString()
          }\r\n`
                  + `retry: ${Math.floor(this._retry * 1000)}\r\n\r\n`;

          this._write(handshake);

          this._stream.on('drain', () => { self.emit('drain'); });

          if (this._ping) { this._pingTimer = setInterval(() => { self.ping(); }, this._ping * 1000); }

          ['error', 'end'].forEach((event) => {
            self._stream.on(event, () => { self.close(); });
          });
        };
        util.inherits(EventSource, Stream);

        EventSource.isEventSource = function (request) {
          if (request.method !== 'GET') { return false; }
          const accept = (request.headers.accept || '').split(/\s*,\s*/);
          return accept.indexOf('text/event-stream') >= 0;
        };

        const instance = {
          DEFAULT_PING: 10,
          DEFAULT_RETRY: 5,

          _write(chunk) {
            if (!this.writable) { return false; }
            try {
              return this._stream.write(chunk, 'utf8');
            } catch (e) {
              return false;
            }
          },

          _open() {
            if (this.readyState !== API.CONNECTING) { return; }

            this.readyState = API.OPEN;

            const event = new Event('open');
            event.initEvent('open', false, false);
            this.dispatchEvent(event);
          },

          write(message) {
            return this.send(message);
          },

          end(message) {
            if (message !== undefined) { this.write(message); }
            this.close();
          },

          send(message, options) {
            if (this.readyState > API.OPEN) { return false; }

            message = String(message).replace(/(\r\n|\r|\n)/g, '$1data: ');
            options = options || {};

            let frame = '';
            if (options.event) { frame += `event: ${options.event}\r\n`; }
            if (options.id) { frame += `id: ${options.id}\r\n`; }
            frame += `data: ${message}\r\n\r\n`;

            return this._write(frame);
          },

          ping() {
            return this._write(':\r\n\r\n');
          },

          close() {
            if (this.readyState > API.OPEN) { return false; }

            this.readyState = API.CLOSED;
            this.writable = false;
            if (this._pingTimer) { clearInterval(this._pingTimer); }
            if (this._stream) { this._stream.end(); }

            const event = new Event('close');
            event.initEvent('close', false, false);
            this.dispatchEvent(event);

            return true;
          }
        };

        for (const method in instance) { EventSource.prototype[method] = instance[method]; }
        for (const key in EventTarget) { EventSource.prototype[key] = EventTarget[key]; }

        module.exports = EventSource;
      }]
    ];

    const __node_cache__ = [];

    function __node_error__(location) {
      const err = new Error(`Cannot find module '${location}'`);
      err.code = 'MODULE_NOT_FOUND';
      throw err;
    }

    function __node_require__(id) {
      if ((id >>> 0) !== id || id > __node_modules__.length) { return __node_error__(id); }

      while (__node_cache__.length <= id) { __node_cache__.push(null); }

      const cache = __node_cache__[id];

      if (cache) { return cache.exports; }

      const mod = __node_modules__[id];
      const name = mod[0];
      const path = mod[1];
      const func = mod[2];
      let meta;

      let _exports = exports;
      let _module = module;

      if (id !== 0) {
        _exports = {};
        _module = {
          id: `/${name}${path}`,
          exports: _exports,
          parent: module.parent,
          filename: module.filename,
          loaded: false,
          children: module.children,
          paths: module.paths
        };
      }

      __node_cache__[id] = _module;

      try {
        func.call(_exports, _exports, _module,
          __filename, __dirname, meta);
      } catch (e) {
        __node_cache__[id] = null;
        throw e;
      }

      __node_modules__[id] = null;

      if (id !== 0) { _module.loaded = true; }

      return _module.exports;
    }

    __node_require__(0);
  }],
  ['bsock', '/lib/server.js', function (exports, module, __filename, __dirname, __meta) {
    const assert = __node_require__(2 /* 'bsert' */);
    const EventEmitter = require('events');
    const Packet = __node_require__(9 /* './packet' */);
    const WebSocket = __node_require__(6 /* './backend' */);
    const Socket = __node_require__(10 /* './socket' */);

    class Server extends EventEmitter {
      constructor(options = {}) {
        super();

        assert(!options.protocols || Array.isArray(options.protocols));

        this.protocols = options.protocols || undefined;
        this.sockets = new Set();
        this.channels = new Map();
        this.mounts = [];
        this.mounted = false;
      }

      handleSocket(socket) {
        this.add(socket);

        socket.on('close', () => {
          this.remove(socket);
        });

        this.emit('socket', socket);

        for (const server of this.mounts) { server.emit('socket', socket); }
      }

      mount(server) {
        assert(!server.mounted);
        server.mounted = true;
        server.sockets = this.sockets;
        server.channels = this.channels;
        this.mounts.push(server);
      }

      async open() {

      }

      async close() {
        if (this.mounted) { return; }

        for (const socket of this.sockets) { socket.destroy(); }
      }

      attach(server) {
        const onUpgrade = (req, socket, body) => {
          if (!socket.remoteAddress) {
            socket.destroy();
            return;
          }

          if (!WebSocket.isWebSocket(req)) {
            socket.destroy();
            return;
          }

          const ws = new WebSocket(req, socket, body, this.protocols);
          const sock = Socket.accept(this, req, socket, ws);

          this.handleSocket(sock);
        };

        server.on('upgrade', (req, socket, body) => {
          try {
            onUpgrade(req, socket, body);
          } catch (e) {
            this.emit('error', e);
          }
        });

        return this;
      }

      add(socket) {
        this.sockets.add(socket);
      }

      remove(socket) {
        for (const name of socket.channels) { this.leave(socket, name); }

        assert(this.sockets.delete(socket));
      }

      join(socket, name) {
        if (socket.channels.has(name)) { return false; }

        if (!this.channels.has(name)) { this.channels.set(name, new Set()); }

        const sockets = this.channels.get(name);

        sockets.add(socket);
        socket.channels.add(name);

        return true;
      }

      leave(socket, name) {
        if (!socket.channels.has(name)) { return false; }

        const sockets = this.channels.get(name);

        assert(sockets);
        assert(sockets.delete(socket));

        if (sockets.size === 0) { this.channels.delete(name); }

        socket.channels.delete(name);

        return true;
      }

      channel(name) {
        const sockets = this.channels.get(name);

        if (!sockets) { return null; }

        assert(sockets.size > 0);

        return sockets;
      }

      event(args) {
        assert(args.length > 0, 'Event must be present.');
        assert(typeof args[0] === 'string', 'Event must be a string.');
        const packet = new Packet();
        packet.type = Packet.types.EVENT;
        packet.setData(args);
        return packet;
      }

      to(name, ...args) {
        const sockets = this.channels.get(name);

        if (!sockets) { return; }

        assert(sockets.size > 0);

        // Pre-serialize for speed.
        const packet = this.event(args);

        for (const socket of sockets) { socket.sendPacket(packet); }
      }

      all(...args) {
        // Pre-serialize for speed.
        const packet = this.event(args);

        for (const socket of this.sockets) { socket.sendPacket(packet); }
      }

      static attach(parent, options) {
        const server = new this(options);
        return server.attach(parent);
      }

      static createServer(options) {
        return new this(options);
      }
    }

    module.exports = Server;
  }],
  ['bsock', '/lib/packet.js', function (exports, module, __filename, __dirname, __meta) {
    const assert = __node_require__(2 /* 'bsert' */);

    const types = {
      CONNECT: 0,
      DISCONNECT: 1,
      EVENT: 2,
      ACK: 3,
      ERROR: 4,
      BINARY_EVENT: 5,
      BINARY_ACK: 6
    };

    class Packet {
      constructor(type) {
        this.type = type || 0;
        this.attachments = 0;
        this.nsp = '/';
        this.id = -1;
        this.data = '';
        this.buffers = [];
      }

      setData(data) {
        assert(data !== undefined);
        assert(typeof data !== 'number');
        assert(typeof data !== 'function');

        const [str, buffers] = deconstruct(data);

        this.data = str;
        this.buffers = buffers;
        this.attachments = buffers.length;

        if (this.attachments > 0) {
          switch (this.type) {
            case types.EVENT:
              this.type = types.BINARY_EVENT;
              break;
            case types.ACK:
              this.type = types.BINARY_ACK;
              break;
          }
        }

        return this;
      }

      getData() {
        if (this.data.length === 0) { return null; }
        return reconstruct(this.data, this.buffers);
      }

      toString() {
        let str = this.type.toString(10);

        switch (this.type) {
          case types.BINARY_EVENT:
          case types.BINARY_ACK:
            str += `${this.attachments.toString(10)}-`;
            break;
        }

        if (this.nsp !== '/') { str += `${this.nsp},`; }

        if (this.id !== -1) { str += this.id.toString(10); }

        str += this.data;

        return str;
      }

      static fromString(str) {
        assert(typeof str === 'string');
        assert(str.length > 0);

        let i = 0;
        let type = 0;
        let attachments = 0;
        let nsp = '/';
        let id = -1;
        let data = '';

        [i, type] = readChar(str, i);

        assert(type !== -1);
        assert(type <= types.BINARY_ACK);

        switch (type) {
          case types.BINARY_EVENT:
          case types.BINARY_ACK: {
            [i, attachments] = readInt(str, i);
            assert(attachments !== -1);
            assert(i < str.length);
            assert(str[i] === '-');
            i += 1;
            break;
          }
        }

        if (i < str.length && str[i] === '/') { [i, nsp] = readTo(str, i, ','); }

        [i, id] = readInt(str, i);

        if (i < str.length) { data = str.substring(i); }

        const packet = new this();

        packet.type = type;
        packet.attachments = attachments;
        packet.nsp = nsp;
        packet.id = id;
        packet.data = data;

        return packet;
      }
    }

    Packet.types = types;

    function isPlaceholder(obj) {
      return obj !== null
    && typeof obj === 'object'
    && obj._placeholder === true
    && (obj.num >>> 0) === obj.num;
    }

    function deconstruct(obj) {
      const buffers = [];
      const out = replace('', obj, buffers, new Map());
      const str = JSON.stringify(out);
      return [str, buffers];
    }

    function replace(key, value, buffers, seen) {
      if (value === null || typeof value !== 'object') { return value; }

      if (Buffer.isBuffer(value)) {
        const placeholder = seen.get(value);

        // De-duplicate.
        if (placeholder != null) { return placeholder; }

        const out = { _placeholder: true, num: buffers.length };

        seen.set(value, out);
        buffers.push(value);

        return out;
      }

      if (seen.has(value)) { throw new TypeError('Converting circular structure to JSON.'); }

      if (Array.isArray(value)) {
        const out = [];

        seen.set(value, null);

        for (let i = 0; i < value.length; i++) { out.push(replace(i, value[i], buffers, seen)); }

        seen.delete(value);

        return out;
      }

      const out = Object.create(null);

      const json = typeof value.toJSON === 'function'
        ? value.toJSON(key)
        : value;

      seen.set(value, null);

      for (const key of Object.keys(json)) { out[key] = replace(key, json[key], buffers, seen); }

      seen.delete(value);

      return out;
    }

    function reconstruct(str, buffers) {
      return JSON.parse(str, (key, value) => {
        if (isPlaceholder(value)) {
          if (value.num < buffers.length) { return buffers[value.num]; }
        }
        return value;
      });
    }

    function readChar(str, i) {
      const ch = str.charCodeAt(i) - 0x30;

      if (ch < 0 || ch > 9) { return -1; }

      return [i + 1, ch];
    }

    function readInt(str, i) {
      let len = 0;
      let num = 0;

      for (; i < str.length; i++) {
        const ch = str.charCodeAt(i) - 0x30;

        if (ch < 0 || ch > 9) { break; }

        num *= 10;
        num += ch;
        len += 1;

        assert(len <= 10);
      }

      assert(num <= 0xffffffff);

      if (len === 0) { num = -1; }

      return [i, num];
    }

    function readTo(str, i, ch) {
      let j = i;

      for (; j < str.length; j++) {
        if (str[j] === ch) { break; }
      }

      assert(j < str.length);

      return [j + 1, str.substring(i, j)];
    }

    /*
 * Expose
 */

    module.exports = Packet;
  }],
  ['bsock', '/lib/socket.js', function (exports, module, __filename, __dirname, __meta) {
    /* global Blob, FileReader */

    const assert = __node_require__(2 /* 'bsert' */);
    const EventEmitter = require('events');
    const WebSocket = __node_require__(6 /* './backend' */).Client;
    const Packet = __node_require__(9 /* './packet' */);
    const Frame = __node_require__(11 /* './frame' */);
    const util = __node_require__(12 /* './util' */);
    const Parser = __node_require__(13 /* './parser' */);
    const codes = __node_require__(14 /* './codes' */);
    const blacklist = __node_require__(15 /* './blacklist' */);

    /**
 * Socket
 */

    class Socket extends EventEmitter {
      constructor() {
        super();

        this.server = null;
        this.ws = null;
        this.protocol = '';
        this.url = 'ws://127.0.0.1:80/socket.io/?transport=websocket';
        this.ssl = false;
        this.host = '127.0.0.1';
        this.port = 80;
        this.inbound = false;
        this.handshake = false;
        this.opened = false;
        this.connected = false;
        this.challenge = false;
        this.destroyed = false;
        this.reconnection = true;

        this.time = 0;
        this.sequence = 0;
        this.pingInterval = 25000;
        this.pingTimeout = 60000;
        this.lastPing = 0;

        this.parser = new Parser();
        this.binary = false;

        this.packet = null;
        this.timer = null;
        this.jobs = new Map();
        this.hooks = new Map();
        this.channels = new Set();
        this.events = new EventEmitter();
        this.buffer = [];

        // Unused.
        this.admin = false;
        this.auth = false;
      }

      accept(server, req, socket, ws) {
        assert(!this.ws, 'Cannot accept twice.');

        assert(server);
        assert(req);
        assert(socket);
        assert(socket.remoteAddress);
        assert(socket.remotePort != null);
        assert(ws);

        let proto = 'ws';
        let host = socket.remoteAddress;
        let port = socket.remotePort;

        if (socket.encrypted) { proto = 'wss'; }

        if (host.indexOf(':') !== -1) { host = `[${host}]`; }

        if (!port) { port = 0; }

        this.server = server;
        this.binary = req.url.indexOf('b64=1') === -1;
        this.url = `${proto}://${host}:${port}/socket.io/?transport=websocket`;
        this.ssl = proto === 'wss';
        this.host = socket.remoteAddress;
        this.port = socket.remotePort;
        this.inbound = true;
        this.ws = ws;

        this.init();

        return this;
      }

      connect(port, host, ssl, protocols) {
        assert(!this.ws, 'Cannot connect twice.');

        if (typeof port === 'string') {
          protocols = host;
          [port, host, ssl] = util.parseURL(port);
        }

        let proto = 'ws';

        if (ssl) { proto = 'wss'; }

        if (!host) { host = '127.0.0.1'; }

        assert(typeof host === 'string');
        assert((port & 0xffff) === port, 'Must pass a port.');
        assert(!ssl || typeof ssl === 'boolean');
        assert(!protocols || Array.isArray(protocols));

        let hostname = host;
        if (host.indexOf(':') !== -1 && host[0] !== '[') { hostname = `[${host}]`; }

        const path = '/socket.io';
        const qs = '?transport=websocket';
        const url = `${proto}://${hostname}:${port}${path}/${qs}`;

        this.binary = true;
        this.url = url;
        this.ssl = ssl;
        this.host = host;
        this.port = port;
        this.inbound = false;
        this.ws = new WebSocket(url, protocols);

        this.init();

        return this;
      }

      init() {
        this.protocol = this.ws.protocol;
        this.time = Date.now();
        this.observe();

        this.parser.on('error', (err) => {
          this.emit('error', err);
        });

        this.parser.on('frame', async (frame) => {
          try {
            await this.handleFrame(frame);
          } catch (e) {
            this.emit('error', e);
          }
        });

        this.start();
      }

      observe() {
        const { ws } = this;
        assert(ws);

        ws.binaryType = 'arraybuffer';

        ws.onopen = async () => {
          await this.onOpen();
        };

        ws.onmessage = async (event) => {
          await this.onMessage(event);
        };

        ws.onerror = async (event) => {
          await this.onError(event);
        };

        ws.onclose = async (event) => {
          await this.onClose(event);
        };
      }

      async onOpen() {
        if (this.destroyed) { return; }

        if (!this.inbound) { return; }

        assert(!this.opened);
        assert(!this.connected);
        assert(!this.handshake);

        this.opened = true;
        this.handshake = true;

        await this.emitAsync('open');

        this.sendHandshake();

        this.connected = true;
        await this.emitAsync('connect');

        this.sendConnect();
      }

      async emitAsync(event, ...args) {
        const handlers = this.listeners(event);

        for (const handler of handlers) {
          try {
            await handler(...args);
          } catch (e) {
            this.emit('error', e);
          }
        }
      }

      async onMessage(event) {
        if (this.destroyed) { return; }

        let data;

        try {
          data = await readBinary(event.data);
        } catch (e) {
          this.emit('error', e);
          return;
        }

        // Textual frame.
        if (typeof data === 'string') {
          this.parser.feedString(data);
          return;
        }

        // Binary frame.
        this.parser.feedBinary(data);
      }

      async onError(event) {
        if (this.destroyed) { return; }

        this.emit('error', new Error(event.message));

        if (this.inbound) {
          this.destroy();
          return;
        }

        this.close();
      }

      async onClose(event) {
        if (this.destroyed) { return; }

        if (event.code === 1000 || event.code === 1001) {
          if (!this.connected) { this.emit('error', new Error('Could not connect.')); }

          if (this.inbound) {
            this.destroy();
            return;
          }

          this.close();

          return;
        }

        const code = codes[event.code] || 'UNKNOWN_CODE';
        const reason = event.reason || 'Unknown reason';
        const msg = `Websocket Closed: ${reason} (code=${code}).`;

        const err = new Error(msg);
        err.reason = event.reason || '';
        err.code = event.code || 0;

        this.emit('error', err);

        if (this.inbound) {
          this.destroy();
          return;
        }

        if (!this.reconnection) {
          this.destroy();
          return;
        }

        this.close();
      }

      close() {
        if (this.destroyed) { return; }

        this.time = Date.now();
        this.packet = null;
        this.handshake = false;
        this.connected = false;
        this.challenge = false;
        this.sequence = 0;
        this.lastPing = 0;

        for (const [id, job] of this.jobs) {
          this.jobs.delete(id);
          job.reject(new Error('Job timed out.'));
        }

        assert(this.ws);
        this.ws.onopen = () => {};
        this.ws.onmessage = () => {};
        this.ws.onerror = () => {};
        this.ws.onclose = () => {};
        this.ws.close();

        this.emitAsync('disconnect');
      }

      error(msg) {
        if (this.destroyed) { return; }

        this.emit('error', new Error(msg));
      }

      destroy() {
        if (this.destroyed) { return; }

        this.close();
        this.stop();

        this.opened = false;
        this.destroyed = true;
        this.buffer.length = 0;

        this.emitAsync('close');

        this.removeAllListeners();
        this.on('error', () => {});
      }

      send(frame) {
        if (this.destroyed) { return; }

        assert(this.ws);

        if (frame.binary && this.binary) { this.ws.send(frame.toRaw()); } else { this.ws.send(frame.toString()); }
      }

      reconnect() {
        assert(!this.inbound);
        this.close();
        this.ws = new WebSocket(this.url);
        this.time = Date.now();
        this.observe();
      }

      start() {
        assert(this.ws);
        assert(this.timer == null);
        this.timer = setInterval(() => this.stall(), 5000);
      }

      stop() {
        if (this.timer != null) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }

      stall() {
        const now = Date.now();

        assert(this.ws);

        if (!this.connected) {
          if (now - this.time > 10000) {
            if (this.inbound || !this.reconnection) {
              this.error('Timed out waiting for connection.');
              this.destroy();
              return;
            }

            this.error('Timed out waiting for connection. Reconnecting...');
            this.reconnect();

            return;
          }

          return;
        }

        for (const [id, job] of this.jobs) {
          if (now - job.time > 600000) {
            this.jobs.delete(id);
            job.reject(new Error('Job timed out.'));
          }
        }

        if (!this.inbound && !this.challenge) {
          this.challenge = true;
          this.lastPing = now;
          this.sendPing();
          return;
        }

        if (!this.inbound && now - this.lastPing > this.pingTimeout) {
          this.error('Connection is stalling (ping).');

          if (this.inbound) {
            this.destroy();
            return;
          }

          this.close();
        }
      }

      /*
   * Frames
   */

      async handleFrame(frame) {
        if (this.destroyed) { return undefined; }

        switch (frame.type) {
          case Frame.types.OPEN:
            return this.handleOpen(frame);
          case Frame.types.CLOSE:
            return this.handleClose(frame);
          case Frame.types.PING:
            return this.handlePing(frame);
          case Frame.types.PONG:
            return this.handlePong(frame);
          case Frame.types.MESSAGE:
            return this.handleMessage(frame);
          case Frame.types.UPGRADE:
            return this.handleUpgrade(frame);
          case Frame.types.NOOP:
            return this.handleNoop(frame);
          default: {
            throw new Error('Unknown frame.');
          }
        }
      }

      async handleOpen(frame) {
        if (this.inbound) { throw new Error('Inbound socket sent an open frame.'); }

        if (frame.binary) { throw new Error('Received a binary open frame.'); }

        if (this.handshake) { throw new Error('Duplicate open frame.'); }

        const json = JSON.parse(frame.data);

        enforce(json && typeof json === 'object', 'open', 'object');

        const { pingInterval, pingTimeout } = json;

        enforce((pingInterval >>> 0) === pingInterval, 'interval', 'uint32');
        enforce((pingTimeout >>> 0) === pingTimeout, 'timeout', 'uint32');

        this.pingInterval = pingInterval;
        this.pingTimeout = pingTimeout;
        this.handshake = true;

        if (!this.opened) {
          this.opened = true;
          await this.emitAsync('open');
        }
      }

      async handleClose(frame) {
        if (this.inbound) { throw new Error('Inbound socket sent a close frame.'); }

        this.close();
      }

      async handlePing() {
        if (!this.inbound) { throw new Error('Outbound socket sent a ping frame.'); }

        this.sendPong();
      }

      async handlePong() {
        if (this.inbound) { throw new Error('Inbound socket sent a pong frame.'); }

        if (!this.challenge) {
          this.error('Remote node sent bad pong.');
          this.destroy();
          return;
        }

        this.challenge = false;
      }

      async handleMessage(frame) {
        if (this.packet) {
          const { packet } = this;

          if (!frame.binary) { throw new Error('Received non-binary frame as attachment.'); }

          packet.buffers.push(frame.data);

          if (packet.buffers.length === packet.attachments) {
            this.packet = null;
            return this.handlePacket(packet);
          }

          return undefined;
        }

        if (frame.binary) { throw new Error('Received binary frame as a message.'); }

        const packet = Packet.fromString(frame.data);

        if (packet.attachments > 0) {
          this.packet = packet;
          return undefined;
        }

        return this.handlePacket(packet);
      }

      async handleUpgrade(frame) {
        if (!this.inbound) { throw new Error('Outbound socket sent an upgrade frame.'); }
        throw new Error('Cannot upgrade from websocket.');
      }

      async handleNoop(frame) {

      }

      sendFrame(type, data, binary) {
        this.send(new Frame(type, data, binary));
      }

      sendOpen(data) {
        this.sendFrame(Frame.types.OPEN, data, false);
      }

      sendClose(data) {
        this.sendFrame(Frame.types.CLOSE, data, false);
      }

      sendPing(data) {
        this.sendFrame(Frame.types.PING, data, false);
      }

      sendPong(data) {
        this.sendFrame(Frame.types.PONG, data, false);
      }

      sendMessage(data) {
        this.sendFrame(Frame.types.MESSAGE, data, false);
      }

      sendBinary(data) {
        this.sendFrame(Frame.types.MESSAGE, data, true);
      }

      sendHandshake() {
        const handshake = JSON.stringify({
          sid: '00000000000000000000',
          upgrades: [],
          pingInterval: this.pingInterval,
          pingTimeout: this.pingTimeout
        });

        this.sendOpen(handshake);
      }

      /*
   * Packets
   */

      async handlePacket(packet) {
        if (this.destroyed) { return undefined; }

        switch (packet.type) {
          case Packet.types.CONNECT: {
            return this.handleConnect();
          }
          case Packet.types.DISCONNECT: {
            return this.handleDisconnect();
          }
          case Packet.types.EVENT:
          case Packet.types.BINARY_EVENT: {
            const args = packet.getData();

            enforce(Array.isArray(args), 'args', 'array');
            enforce(args.length > 0, 'args', 'array');
            enforce(typeof args[0] === 'string', 'event', 'string');

            if (packet.id !== -1) { return this.handleCall(packet.id, args); }

            return this.handleEvent(args);
          }
          case Packet.types.ACK:
          case Packet.types.BINARY_ACK: {
            enforce(packet.id !== -1, 'id', 'uint32');

            const json = packet.getData();

            enforce(json == null || Array.isArray(json), 'args', 'array');

            let err = null;
            let result = null;

            if (json && json.length > 0) { err = json[0]; }

            if (json && json.length > 1) { result = json[1]; }

            if (result == null) { result = null; }

            if (err) {
              enforce(typeof err === 'object', 'error', 'object');
              return this.handleError(packet.id, err);
            }

            return this.handleAck(packet.id, result);
          }
          case Packet.types.ERROR: {
            const err = packet.getData();
            enforce(err && typeof err === 'object', 'error', 'object');
            return this.handleError(-1, err);
          }
          default: {
            throw new Error('Unknown packet.');
          }
        }
      }

      async handleConnect() {
        if (this.inbound) { throw new Error('Inbound socket sent connect packet.'); }

        this.connected = true;

        await this.emitAsync('connect');

        for (const packet of this.buffer) { this.sendPacket(packet); }

        this.buffer.length = 0;
      }

      async handleDisconnect() {
        this.close();
      }

      async handleEvent(args) {
        try {
          const event = args[0];

          if (blacklist.hasOwnProperty(event)) { throw new Error(`Cannot emit blacklisted event: ${event}.`); }

          this.events.emit(...args);
        } catch (e) {
          this.emit('error', e);
          this.sendError(-1, e);
        }
      }

      async handleCall(id, args) {
        let result;

        try {
          const event = args.shift();

          if (blacklist.hasOwnProperty(event)) { throw new Error(`Cannot emit blacklisted event: ${event}.`); }

          const handler = this.hooks.get(event);

          if (!handler) { throw new Error(`Call not found: ${event}.`); }

          result = await handler(...args);
        } catch (e) {
          this.emit('error', e);
          this.sendError(id, e);
          return;
        }

        if (result == null) { result = null; }

        this.sendAck(id, result);
      }

      async handleAck(id, data) {
        const job = this.jobs.get(id);

        if (!job) { throw new Error(`Job not found for ${id}.`); }

        this.jobs.delete(id);

        job.resolve(data);
      }

      async handleError(id, err) {
        const msg = castMsg(err.message);
        const name = castString(err.name);
        const type = castString(err.type);
        const code = castCode(err.code);

        if (id === -1) {
          const e = new Error(msg);
          e.name = name;
          e.type = type;
          e.code = code;
          this.emit('error', e);
          return;
        }

        const job = this.jobs.get(id);

        if (!job) { throw new Error(`Job not found for ${id}.`); }

        this.jobs.delete(id);

        const e = new Error(msg);
        e.name = name;
        e.type = type;
        e.code = code;

        job.reject(e);
      }

      sendPacket(packet) {
        this.sendMessage(packet.toString());

        for (const data of packet.buffers) { this.sendBinary(data); }
      }

      sendConnect() {
        this.sendPacket(new Packet(Packet.types.CONNECT));
      }

      sendDisconnect() {
        this.sendPacket(new Packet(Packet.types.DISCONNECT));
      }

      sendEvent(data) {
        const packet = new Packet();

        packet.type = Packet.types.EVENT;
        packet.setData(data);

        if (!this.connected) {
          this.buffer.push(packet);
          return;
        }

        this.sendPacket(packet);
      }

      sendCall(id, data) {
        const packet = new Packet();

        packet.type = Packet.types.EVENT;
        packet.id = id;
        packet.setData(data);

        if (!this.connected) {
          this.buffer.push(packet);
          return;
        }

        this.sendPacket(packet);
      }

      sendAck(id, data) {
        const packet = new Packet();
        packet.type = Packet.types.ACK;
        packet.id = id;
        packet.setData([null, data]);
        this.sendPacket(packet);
      }

      sendError(id, err) {
        const message = castMsg(err.message);
        const name = castString(err.name);
        const type = castString(err.type);
        const code = castCode(err.code);

        if (id === -1) {
          const packet = new Packet();
          packet.type = Packet.types.ERROR;
          packet.setData({
            message, name, type, code
          });
          this.sendPacket(packet);
          return;
        }

        const packet = new Packet();
        packet.type = Packet.types.ACK;
        packet.id = id;
        packet.setData([{
          message, name, type, code
        }]);
        this.sendPacket(packet);
      }

      /*
   * API
   */

      bind(event, handler) {
        enforce(typeof event === 'string', 'event', 'string');
        enforce(typeof handler === 'function', 'handler', 'function');
        assert(!blacklist.hasOwnProperty(event), 'Blacklisted event.');
        this.events.on(event, handler);
      }

      unbind(event, handler) {
        enforce(typeof event === 'string', 'event', 'string');
        enforce(typeof handler === 'function', 'handler', 'function');
        assert(!blacklist.hasOwnProperty(event), 'Blacklisted event.');
        this.events.removeListener(event, handler);
      }

      fire(...args) {
        enforce(args.length > 0, 'event', 'string');
        enforce(typeof args[0] === 'string', 'event', 'string');
        this.sendEvent(args);
      }

      hook(event, handler) {
        enforce(typeof event === 'string', 'event', 'string');
        enforce(typeof handler === 'function', 'handler', 'function');
        assert(!this.hooks.has(event), 'Hook already bound.');
        assert(!blacklist.hasOwnProperty(event), 'Blacklisted event.');
        this.hooks.set(event, handler);
      }

      unhook(event) {
        enforce(typeof event === 'string', 'event', 'string');
        assert(!blacklist.hasOwnProperty(event), 'Blacklisted event.');
        this.hooks.delete(event);
      }

      call(...args) {
        enforce(args.length > 0, 'event', 'string');
        enforce(typeof args[0] === 'string', 'event', 'string');

        const id = this.sequence;

        this.sequence += 1;
        this.sequence >>>= 0;

        assert(!this.jobs.has(id), 'ID collision.');

        this.sendCall(id, args);

        return new Promise((resolve, reject) => {
          this.jobs.set(id, new Job(resolve, reject, Date.now()));
        });
      }

      channel(name) {
        return this.channels.has(name);
      }

      join(name) {
        if (!this.server) { return false; }
        return this.server.join(this, name);
      }

      leave(name) {
        if (!this.server) { return false; }
        return this.server.leave(this, name);
      }

      static accept(server, req, socket, ws) {
        return new this().accept(server, req, socket, ws);
      }

      static connect(port, host, ssl, protocols) {
        return new this().connect(port, host, ssl, protocols);
      }
    }

    /*
 * Helpers
 */

    class Job {
      constructor(resolve, reject, time) {
        this.resolve = resolve;
        this.reject = reject;
        this.time = time;
      }
    }

    function castCode(code) {
      if (code !== null
      && typeof code !== 'number'
      && typeof code !== 'string') {
        return null;
      }
      return code;
    }

    function castMsg(msg) {
      if (typeof msg !== 'string') { return 'No message.'; }
      return msg;
    }

    function castString(type) {
      if (typeof type !== 'string') { return null; }
      return type;
    }

    function enforce(value, name, type) {
      if (!value) {
        const err = new TypeError(`'${name}' must be a(n) ${type}.`);
        if (Error.captureStackTrace) { Error.captureStackTrace(err, enforce); }
        throw err;
      }
    }

    function readBinary(data) {
      return new Promise((resolve, reject) => {
        if (typeof data === 'string') {
          resolve(data);
          return;
        }

        if (!data || typeof data !== 'object') {
          reject(new Error('Bad data object.'));
          return;
        }

        if (Buffer.isBuffer(data)) {
          resolve(data);
          return;
        }

        if (data instanceof ArrayBuffer) {
          const result = Buffer.from(data);
          resolve(result);
          return;
        }

        if (data.buffer instanceof ArrayBuffer) {
          const result = Buffer.from(data.buffer,
            data.byteOffset,
            data.byteLength);
          resolve(result);
          return;
        }

        if (typeof Blob !== 'undefined' && Blob) {
          if (data instanceof Blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = Buffer.from(reader.result);
              resolve(result);
            };
            reader.readAsArrayBuffer(data);
            return;
          }
        }

        reject(new Error('Bad data object.'));
      });
    }

    /*
 * Expose
 */

    module.exports = Socket;
  }],
  ['bsock', '/lib/frame.js', function (exports, module, __filename, __dirname, __meta) {
    const assert = __node_require__(2 /* 'bsert' */);
    const DUMMY = Buffer.alloc(0);

    const types = {
      OPEN: 0,
      CLOSE: 1,
      PING: 2,
      PONG: 3,
      MESSAGE: 4,
      UPGRADE: 5,
      NOOP: 6
    };

    const table = [
      'open',
      'close',
      'ping',
      'pong',
      'message',
      'upgrade',
      'noop'
    ];

    class Frame {
      constructor(type, data, binary) {
        assert(typeof type === 'number');
        assert((type >>> 0) === type);
        assert(type <= types.NOOP);
        assert(typeof binary === 'boolean');

        if (binary) {
          if (data == null) { data = DUMMY; }
          assert(Buffer.isBuffer(data));
        } else {
          if (data == null) { data = ''; }
          assert(typeof data === 'string');
        }

        this.type = type;
        this.data = data;
        this.binary = binary;
      }

      toString() {
        let str = '';

        if (this.binary) {
          str += 'b';
          str += this.type.toString(10);
          str += this.data.toString('base64');
        } else {
          str += this.type.toString(10);
          str += this.data;
        }

        return str;
      }

      static fromString(str) {
        assert(typeof str === 'string');

        let type = str.charCodeAt(0);
        let binary = false;
        let data;

        // 'b' - base64
        if (type === 0x62) {
          assert(str.length > 1);
          type = str.charCodeAt(1);
          data = Buffer.from(str.substring(2), 'base64');
          binary = true;
        } else {
          data = str.substring(1);
        }

        type -= 0x30;
        assert(type >= 0 && type <= 9);
        assert(type <= types.NOOP);

        return new this(type, data, binary);
      }

      size() {
        let len = 1;

        if (this.binary) { len += this.data.length; } else { len += Buffer.byteLength(this.data, 'utf8'); }

        return len;
      }

      toRaw() {
        const data = Buffer.allocUnsafe(this.size());

        data[0] = this.type;

        if (this.binary) {
          this.data.copy(data, 1);
        } else if (this.data.length > 0) { data.write(this.data, 1, 'utf8'); }

        return data;
      }

      static fromRaw(data) {
        assert(Buffer.isBuffer(data));
        assert(data.length > 0);

        const type = data[0];
        assert(type <= types.NOOP);

        return new this(type, data.slice(1), true);
      }
    }

    Frame.types = types;
    Frame.table = table;

    module.exports = Frame;
  }],
  ['bsock', '/lib/util.js', function (exports, module, __filename, __dirname, __meta) {
    const assert = __node_require__(2 /* 'bsert' */);
    const URL = require('url');

    exports.parseURL = function parseURL(url) {
      if (url.indexOf('://') === -1) { url = `ws://${url}`; }

      const data = URL.parse(url);

      if (data.protocol !== 'http:'
      && data.protocol !== 'https:'
      && data.protocol !== 'ws:'
      && data.protocol !== 'wss:') {
        throw new Error('Invalid protocol for websocket URL.');
      }

      if (!data.hostname) { throw new Error('Malformed URL.'); }

      const host = data.hostname;

      let port = 80;
      let ssl = false;

      if (data.protocol === 'https:' || data.protocol === 'wss:') {
        port = 443;
        ssl = true;
      }

      if (data.port) {
        port = parseInt(data.port, 10);
        assert((port & 0xffff) === port);
        assert(port !== 0);
      }

      return [port, host, ssl];
    };
  }],
  ['bsock', '/lib/parser.js', function (exports, module, __filename, __dirname, __meta) {
    /*!
 * parser.js - packet parser
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/chjj
 */


    const assert = __node_require__(2 /* 'bsert' */);
    const EventEmitter = require('events');
    const Frame = __node_require__(11 /* './frame' */);

    const MAX_MESSAGE = 100000000;

    class Parser extends EventEmitter {
      constructor() {
        super();
      }

      error(msg) {
        this.emit('error', new Error(msg));
      }

      feedBinary(data) {
        assert(Buffer.isBuffer(data));

        if (data.length > MAX_MESSAGE) {
          this.error('Frame too large.');
          return;
        }

        let frame;
        try {
          frame = Frame.fromRaw(data);
        } catch (e) {
          this.emit('error', e);
          return;
        }

        this.emit('frame', frame);
      }

      feedString(data) {
        assert(typeof data === 'string');

        if (Buffer.byteLength(data, 'utf8') > MAX_MESSAGE) {
          this.error('Frame too large.');
          return;
        }

        let frame;
        try {
          frame = Frame.fromString(data);
        } catch (e) {
          this.emit('error', e);
          return;
        }

        this.emit('frame', frame);
      }
    }

    /*
 * Expose
 */

    module.exports = Parser;
  }],
  ['bsock', '/lib/codes.js', function (exports, module, __filename, __dirname, __meta) {
    // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
    module.exports = {
      1000: 'NORMAL_CLOSURE',
      1001: 'GOING_AWAY',
      1002: 'PROTOCOL_ERROR',
      1003: 'UNSUPPORTED_DATA',
      1004: 'RESERVED',
      1005: 'NO_STATUS_RECVD',
      1006: 'ABNORMAL_CLOSURE',
      1007: 'INVALID_FRAME_PAYLOAD_DATA',
      1008: 'POLICY_VIOLATION',
      1009: 'MESSAGE_TOO_BIG',
      1010: 'MISSING_EXTENSION',
      1011: 'INTERNAL_ERROR',
      1012: 'SERVICE_RESTART',
      1013: 'TRY_AGAIN_LATER',
      1014: 'BAD_GATEWAY',
      1015: 'TLS_HANDSHAKE'
    };
  }],
  ['bsock', '/lib/blacklist.js', function (exports, module, __filename, __dirname, __meta) {
    module.exports = {
      connect: true,
      connect_error: true,
      connect_timeout: true,
      connecting: true,
      disconnect: true,
      error: true,
      reconnect: true,
      reconnect_attempt: true,
      reconnect_failed: true,
      reconnect_error: true,
      reconnecting: true,
      ping: true,
      pong: true
    };
  }],
  ['brq', '/lib/brq.js', function (exports, module, __filename, __dirname, __meta) {
    /*!
 * brq.js - simple request module
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/brq
 */


    module.exports = __node_require__(17 /* './request' */);
  }],
  ['brq', '/lib/request.js', function (exports, module, __filename, __dirname, __meta) {
    /*!
 * request.js - http request for brq
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/brq
 */


    const assert = __node_require__(2 /* 'bsert' */);
    const { Stream } = require('stream');
    const mime = __node_require__(18 /* './mime' */);

    /*
 * Lazily Loaded
 */

    let URL = null;
    let qs = null;
    let http = null;
    let https = null;
    let StringDecoder = null;

    class RequestOptions {
      /**
   * Request Options
   * @constructor
   * @ignore
   * @param {Object} options
   */

      constructor(options, buffer) {
        this.method = 'GET';
        this.ssl = false;
        this.host = 'localhost';
        this.port = 80;
        this.path = '/';
        this.query = '';
        this.strictSSL = true;
        this.pool = false;
        this.agent = 'brq';
        this.lookup = null;

        this.type = null;
        this.expect = null;
        this.body = null;
        this.username = '';
        this.password = '';
        this.limit = 20 << 20;
        this.maxRedirects = 5;
        this.timeout = 5000;
        this.buffer = buffer || false;
        this.headers = Object.create(null);

        // Hack
        ensureRequires();

        if (options) { this.fromOptions(options); }
      }

      fromOptions(options) {
        if (typeof options === 'string') { options = { url: options }; }

        if (options.method != null) {
          assert(typeof options.method === 'string');
          this.method = options.method.toUpperCase();
        }

        if (options.uri != null) { this.navigate(options.uri); }

        if (options.url != null) { this.navigate(options.url); }

        if (options.ssl != null) {
          assert(typeof options.ssl === 'boolean');
          this.ssl = options.ssl;
          this.port = 443;
        }

        if (options.host != null) {
          assert(typeof options.host === 'string');
          this.host = options.host;
        }

        if (options.port != null) {
          assert((options.port & 0xffff) === options.port);
          assert(options.port !== 0);
          this.port = options.port;
        }

        if (options.path != null) {
          assert(typeof options.path === 'string');
          this.path = options.path;
        }

        if (options.query != null) {
          if (typeof options.query === 'string') {
            this.query = options.query;
          } else {
            assert(typeof options.query === 'object');
            this.query = qs.stringify(options.query);
          }
        }

        if (options.username != null) {
          assert(typeof options.username === 'string');
          this.username = options.username;
        }

        if (options.password != null) {
          assert(typeof options.password === 'string');
          this.password = options.password;
        }

        if (options.strictSSL != null) {
          assert(typeof options.strictSSL === 'boolean');
          this.strictSSL = options.strictSSL;
        }

        if (options.pool != null) {
          assert(typeof options.pool === 'boolean');
          this.pool = options.pool;
        }

        if (options.agent != null) {
          assert(typeof options.agent === 'string');
          this.agent = options.agent;
        }

        if (options.json != null) {
          assert(typeof options.json === 'object');
          this.body = Buffer.from(JSON.stringify(options.json), 'utf8');
          this.type = 'json';
        }

        if (options.form != null) {
          assert(typeof options.form === 'object');
          this.body = Buffer.from(qs.stringify(options.form), 'utf8');
          this.type = 'form';
        }

        if (options.type != null) {
          assert(typeof options.type === 'string');
          this.type = options.type;
        }

        if (options.expect != null) {
          assert(typeof options.expect === 'string');
          this.expect = options.expect;
        }

        if (options.body != null) {
          if (typeof options.body === 'string') {
            this.body = Buffer.from(options.body, 'utf8');
          } else {
            assert(Buffer.isBuffer(options.body));
            this.body = options.body;
          }
        }

        if (options.timeout != null) {
          assert(typeof options.timeout === 'number');
          this.timeout = options.timeout;
        }

        if (options.limit != null) {
          assert(typeof options.limit === 'number');
          this.limit = options.limit;
        }

        if (options.maxRedirects != null) {
          assert(typeof options.maxRedirects === 'number');
          this.maxRedirects = options.maxRedirects;
        }

        if (options.headers != null) {
          assert(typeof options.headers === 'object');
          this.headers = options.headers;
        }

        if (options.lookup != null) {
          assert(typeof options.lookup === 'function');
          this.lookup = options.lookup;
        }

        return this;
      }

      navigate(url) {
        assert(typeof url === 'string');

        if (url.indexOf('://') === -1) { url = `http://${url}`; }

        const data = URL.parse(url);

        if (data.protocol !== 'http:'
        && data.protocol !== 'https:') {
          throw new Error('Malformed URL.');
        }

        if (!data.hostname) { throw new Error('Malformed URL.'); }

        this.ssl = data.protocol === 'https:';
        this.host = data.hostname;
        this.port = this.ssl ? 443 : 80;

        if (data.port != null) {
          const port = parseInt(data.port, 10);
          assert((port & 0xffff) === port);
          this.port = port;
        }

        this.path = data.pathname;
        this.query = data.query;

        if (data.auth) {
          const parts = data.auth.split(':');
          this.username = parts.shift();
          this.password = parts.join(':');
        }

        return this;
      }

      isExpected(type) {
        assert(typeof type === 'string');

        if (!this.expect) { return true; }

        return this.expect === type;
      }

      isOverflow(hdr) {
        if (hdr == null) { return false; }

        assert(typeof hdr === 'string');

        if (!this.buffer) { return false; }

        hdr = hdr.trim();

        if (!/^\d+$/.test(hdr)) { return false; }

        hdr = hdr.replace(/^0+/g, '');

        if (hdr.length === 0) { hdr = '0'; }

        if (hdr.length > 15) { return false; }

        const length = parseInt(hdr, 10);

        if (!Number.isSafeInteger(length)) { return true; }

        return length > this.limit;
      }

      getBackend() {
        ensureRequires(this.ssl);
        return this.ssl ? https : http;
      }

      getHeaders() {
        const headers = Object.create(null);

        headers['User-Agent'] = this.agent;

        if (this.type) { headers['Content-Type'] = mime.type(this.type); }

        if (this.body) { headers['Content-Length'] = this.body.length.toString(10); }

        if (this.username || this.password) {
          const auth = `${this.username}:${this.password}`;
          const data = Buffer.from(auth, 'utf8');
          headers.Authorization = `Basic ${data.toString('base64')}`;
        }

        Object.assign(headers, this.headers);

        return headers;
      }

      redirect(location) {
        assert(typeof location === 'string');

        let url = '';

        if (this.ssl) { url += 'https://'; } else { url += 'http://'; }

        if (this.host.indexOf(':') !== -1) { url += `[${this.host}]`; } else { url += this.host; }

        url += `:${this.port}`;
        url += this.path;

        if (this.query) { url += `?${this.query}`; }

        this.navigate(URL.resolve(url, location));

        return this;
      }

      toHTTP() {
        let query = '';

        if (this.query) { query = `?${this.query}`; }

        return {
          method: this.method,
          host: this.host,
          port: this.port,
          path: this.path + query,
          headers: this.getHeaders(),
          agent: this.pool ? null : false,
          lookup: this.lookup || undefined,
          rejectUnauthorized: this.strictSSL
        };
      }
    }

    class Request extends Stream {
      /**
   * Request
   * @constructor
   * @private
   * @param {Object} options
   */

      constructor(options, buffer) {
        super();

        this.options = new RequestOptions(options, buffer);
        this.req = null;
        this.res = null;
        this.statusCode = 0;
        this.headers = Object.create(null);
        this.type = 'bin';
        this.redirects = 0;
        this.timeout = null;
        this.finished = false;

        this.onResponse = this.handleResponse.bind(this);
        this.onData = this.handleData.bind(this);
        this.onEnd = this.handleEnd.bind(this);

        this.total = 0;
        this.decoder = null;
        this.buf = [];
        this.str = '';
      }

      startTimeout() {
        if (!this.options.timeout) { return; }

        this.timeout = setTimeout(() => {
          this.finish(new Error('Request timed out.'));
        }, this.options.timeout);
      }

      stopTimeout() {
        if (this.timeout != null) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
      }

      cleanup() {
        this.stopTimeout();

        if (this.req) {
          this.req.removeListener('response', this.onResponse);
          this.req.removeListener('error', this.onEnd);
          this.req.addListener('error', () => {});
        }

        if (this.res) {
          this.res.removeListener('data', this.onData);
          this.res.removeListener('error', this.onEnd);
          this.res.removeListener('end', this.onEnd);
          this.res.addListener('error', () => {});
        }
      }

      close() {
        if (this.req) {
          try {
            this.req.abort();
          } catch (e) {

          }
        }

        if (this.res) {
          try {
            this.res.destroy();
          } catch (e) {

          }
        }

        this.cleanup();

        this.req = null;
        this.res = null;
      }

      destroy() {
        this.close();
      }

      start() {
        const http = this.options.getBackend();
        const options = this.options.toHTTP();

        this.startTimeout();

        this.req = http.request(options);
        this.res = null;

        if (this.options.body) { this.req.write(this.options.body); }

        this.req.on('response', this.onResponse);
        this.req.on('error', this.onEnd);
      }

      write(data) {
        return this.req.write(data);
      }

      end() {
        return this.req.end();
      }

      finish(err) {
        if (this.finished) { return; }

        this.finished = true;

        if (err) {
          this.destroy();
          this.emit('error', err);
          return;
        }

        this.cleanup();
        this.emit('end');
        this.emit('close');
      }

      handleResponse(res) {
        const { headers } = res;
        const { location } = headers;

        if (location) {
          if (this.redirects >= this.options.maxRedirects) {
            this.finish(new Error('Too many redirects.'));
            return;
          }

          this.redirects += 1;
          this.close();

          try {
            this.options.redirect(location);
          } catch (e) {
            this.finish(e);
            return;
          }

          this.start();
          this.end();

          return;
        }

        const type = mime.ext(headers['content-type']);

        if (!this.options.isExpected(type)) {
          this.finish(new Error('Wrong content-type for response.'));
          return;
        }

        const length = headers['content-length'];

        if (this.options.isOverflow(length)) {
          this.finish(new Error('Response exceeded limit.'));
          return;
        }

        this.res = res;
        this.statusCode = res.statusCode;
        this.headers = headers;
        this.type = type;

        this.res.on('data', this.onData);
        this.res.on('error', this.onEnd);
        this.res.on('end', this.onEnd);

        this.emit('headers', headers);
        this.emit('type', type);
        this.emit('response', res);

        if (this.options.buffer) {
          if (mime.textual(this.type)) {
            this.decoder = new StringDecoder('utf8');
            this.str = '';
          } else {
            this.buf = [];
          }
        }
      }

      handleData(data) {
        this.total += data.length;

        this.emit('data', data);

        if (this.options.buffer) {
          if (this.options.limit) {
            if (this.total > this.options.limit) {
              this.finish(new Error('Response exceeded limit.'));
              return;
            }
          }

          if (this.decoder) {
            this.str += this.decoder.write(data);
            return;
          }

          this.buf.push(data);
        }
      }

      handleEnd(err) {
        this.finish(err);
      }

      text() {
        if (this.decoder) { return this.str; }
        return this.buffer().toString('utf8');
      }

      buffer() {
        if (this.decoder) { return Buffer.from(this.str, 'utf8'); }
        return Buffer.concat(this.buf);
      }

      json() {
        const text = this.text().trim();

        if (text.length === 0) { return Object.create(null); }

        const body = JSON.parse(text);

        if (!body || typeof body !== 'object') { throw new Error('JSON body is a non-object.'); }

        return body;
      }

      form() {
        return qs.parse(this.text());
      }
    }

    /**
 * Make an HTTP request.
 * @param {Object} options
 * @returns {Promise}
 */

    function request(options) {
      if (typeof options === 'string') { options = { url: options }; }

      return new Promise((resolve, reject) => {
        const req = new Request(options, true);

        req.on('error', err => reject(err));
        req.on('end', () => resolve(req));

        req.start();
        req.end();
      });
    }

    request.stream = function stream(options) {
      const req = new Request(options, false);
      req.start();
      return req;
    };

    /*
 * Helpers
 */

    function ensureRequires(ssl) {
      if (!URL) { URL = require('url'); }

      if (!qs) { qs = require('querystring'); }

      if (!http) { http = require('http'); }

      if (ssl && !https) { https = require('https'); }

      if (!StringDecoder) { StringDecoder = require('string_decoder').StringDecoder; }
    }

    /*
 * Expose
 */

    module.exports = request;
  }],
  ['brq', '/lib/mime.js', function (exports, module, __filename, __dirname, __meta) {
    /*!
 * mime.js - mime types for brq
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/brq
 */


    const assert = __node_require__(2 /* 'bsert' */);

    const types = {
      atom: ['application/atom+xml', true],
      bin: ['application/octet-stream', false],
      bmp: ['image/bmp', false],
      cjs: ['application/javascript', true],
      css: ['text/css', true],
      dat: ['application/octet-stream', false],
      form: ['application/x-www-form-urlencoded', true],
      gif: ['image/gif', false],
      gz: ['application/x-gzip', false],
      htc: ['text/x-component', true],
      html: ['text/html', true],
      ico: ['image/x-icon', false],
      jpg: ['image/jpeg', false],
      jpeg: ['image/jpeg', false],
      js: ['application/javascript', true],
      json: ['application/json', true],
      log: ['text/plain', true],
      manifest: ['text/cache-manifest', false],
      mathml: ['application/mathml+xml', true],
      md: ['text/plain', true],
      mjs: ['application/javascript', true],
      mkv: ['video/x-matroska', false],
      mml: ['application/mathml+xml', true],
      mp3: ['audio/mpeg', false],
      mp4: ['video/mp4', false],
      mpeg: ['video/mpeg', false],
      mpg: ['video/mpeg', false],
      oga: ['audio/ogg', false],
      ogg: ['application/ogg', false],
      ogv: ['video/ogg', false],
      otf: ['font/otf', false],
      pdf: ['application/pdf', false],
      png: ['image/png', false],
      rdf: ['application/rdf+xml', true],
      rss: ['application/rss+xml', true],
      svg: ['image/svg+xml', false],
      swf: ['application/x-shockwave-flash', false],
      tar: ['application/x-tar', false],
      torrent: ['application/x-bittorrent', false],
      txt: ['text/plain', true],
      ttf: ['font/ttf', false],
      wav: ['audio/wav', false],
      webm: ['video/webm', false],
      woff: ['font/x-woff', false],
      xhtml: ['application/xhtml+xml', true],
      xbl: ['application/xml', true],
      xml: ['application/xml', true],
      xsl: ['application/xml', true],
      xslt: ['application/xslt+xml', true],
      zip: ['application/zip', false]
    };

    const extensions = {
      'application/atom+xml': 'atom',
      'application/octet-stream': 'bin',
      'image/bmp': 'bmp',
      'text/css': 'css',
      'application/x-www-form-urlencoded': 'form',
      'image/gif': 'gif',
      'application/x-gzip': 'gz',
      'text/x-component': 'htc',
      'text/html': 'html',
      'text/xml': 'xml',
      'image/x-icon': 'ico',
      'image/jpeg': 'jpeg',
      'text/javascript': 'js',
      'application/javascript': 'js',
      'text/x-json': 'json',
      'application/json': 'json',
      'text/json': 'json',
      'text/plain': 'txt',
      'text/cache-manifest': 'manifest',
      'application/mathml+xml': 'mml',
      'video/x-matroska': 'mkv',
      'audio/x-matroska': 'mkv',
      'audio/mpeg': 'mp3',
      'audio/mpa': 'mp3',
      'video/mp4': 'mp4',
      'video/mpeg': 'mpg',
      'audio/ogg': 'oga',
      'application/ogg': 'ogg',
      'video/ogg': 'ogv',
      'font/otf': 'otf',
      'application/pdf': 'pdf',
      'application/x-pdf': 'pdf',
      'image/png': 'png',
      'application/rdf+xml': 'rdf',
      'application/rss+xml': 'rss',
      'image/svg+xml': 'svg',
      'application/x-shockwave-flash': 'swf',
      'application/x-tar': 'tar',
      'application/x-bittorrent': 'torrent',
      'font/ttf': 'ttf',
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'video/webm': 'webm',
      'audio/webm': 'webm',
      'font/x-woff': 'woff',
      'application/xhtml+xml': 'xhtml',
      'application/xml': 'xsl',
      'application/xslt+xml': 'xslt',
      'application/zip': 'zip'
    };

    // Filename to extension
    exports.file = function file(path) {
      assert(typeof path === 'string');

      const name = path.split('/').pop();
      const parts = name.split('.');

      if (parts.length < 2) { return 'bin'; }

      if (parts.length === 2 && parts[0] === '') { return 'txt'; }

      const ext = parts[parts.length - 1];

      if (types[ext]) { return ext; }

      return 'bin';
    };

    // Is extension textual?
    exports.textual = function textual(ext) {
      const value = types[ext];

      if (!value) { return false; }

      return value[1];
    };

    // Extension to content-type
    exports.type = function type(ext) {
      assert(typeof ext === 'string');

      if (ext.indexOf('/') !== -1) { return ext; }

      const value = types[ext];

      if (!value) { return 'application/octet-stream'; }

      let [name, text] = value;

      if (text) { name += '; charset=utf-8'; }

      return name;
    };

    // Content-type to extension
    exports.ext = function ext(type) {
      if (type == null) { return 'bin'; }

      assert(typeof type === 'string');

      [type] = type.split(';');
      type = type.toLowerCase();
      type = type.trim();

      return extensions[type] || 'bin';
    };
  }],
  ['bclient', '/lib/wallet.js', function (exports, module, __filename, __dirname, __meta) {
    /*!
 * wallet.js - http wallet for bcoin
 * Copyright (c) 2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */


    const assert = __node_require__(2 /* 'bsert' */);
    const EventEmitter = require('events');
    const { Client } = __node_require__(3 /* 'bcurl' */);

    /**
 * Wallet Client
 * @extends {bcurl.Client}
 */

    class WalletClient extends Client {
      /**
   * Create a wallet client.
   * @param {Object?} options
   */

      constructor(options) {
        super(options);
        this.wallets = new Map();
      }

      /**
   * Open the client.
   * @private
   * @returns {Promise}
   */

      init() {
        this.bind('tx', (id, details) => {
          this.dispatch(id, 'tx', details);
        });

        this.bind('confirmed', (id, details) => {
          this.dispatch(id, 'confirmed', details);
        });

        this.bind('unconfirmed', (id, details) => {
          this.dispatch(id, 'unconfirmed', details);
        });

        this.bind('conflict', (id, details) => {
          this.dispatch(id, 'conflict', details);
        });

        this.bind('updated', (id, details) => {
          this.dispatch(id, 'updated', details);
        });

        this.bind('address', (id, receive) => {
          this.dispatch(id, 'address', receive);
        });

        this.bind('balance', (id, balance) => {
          this.dispatch(id, 'balance', balance);
        });
      }

      /**
   * Dispatch event.
   * @private
   */

      dispatch(id, event, ...args) {
        const wallet = this.wallets.get(id);

        if (wallet) { wallet.emit(event, ...args); }
      }

      /**
   * Open the client.
   * @returns {Promise}
   */

      async open() {
        await super.open();
        this.init();
      }

      /**
   * Close the client.
   * @returns {Promise}
   */

      async close() {
        await super.close();
        this.wallets = new Map();
      }

      /**
   * Auth with server.
   * @returns {Promise}
   */

      async auth() {
        await this.call('auth', this.password);
      }

      /**
   * Make an RPC call.
   * @returns {Promise}
   */

      execute(name, params) {
        return super.execute('/', name, params);
      }

      /**
   * Create a wallet object.
   */

      wallet(id, token) {
        return new Wallet(this, id, token);
      }

      /**
   * Join a wallet.
   */

      all(token) {
        return this.call('join', '*', token);
      }

      /**
   * Leave a wallet.
   */

      none() {
        return this.call('leave', '*');
      }

      /**
   * Join a wallet.
   */

      join(id, token) {
        return this.call('join', id, token);
      }

      /**
   * Leave a wallet.
   */

      leave(id) {
        return this.call('leave', id);
      }

      /**
   * Rescan the chain.
   * @param {Number} height
   * @returns {Promise}
   */

      rescan(height) {
        return this.post('/rescan', { height });
      }

      /**
   * Resend pending transactions.
   * @returns {Promise}
   */

      resend() {
        return this.post('/resend');
      }

      /**
   * Backup the walletdb.
   * @param {String} path
   * @returns {Promise}
   */

      backup(path) {
        return this.post('/backup', { path });
      }

      /**
   * Get list of all wallet IDs.
   * @returns {Promise}
   */

      getWallets() {
        return this.get('/wallet');
      }

      /**
   * Create a wallet.
   * @param {Object} options
   * @returns {Promise}
   */

      createWallet(id, options) {
        return this.put(`/wallet/${id}`, options);
      }

      /**
   * Get wallet transaction history.
   * @param {String} account
   * @returns {Promise}
   */

      getHistory(id, account) {
        return this.get(`/wallet/${id}/tx/history`, { account });
      }

      /**
   * Get wallet coins.
   * @param {String} account
   * @returns {Promise}
   */

      getCoins(id, account) {
        return this.get(`/wallet/${id}/coin`, { account });
      }

      /**
   * Get all unconfirmed transactions.
   * @param {String} account
   * @returns {Promise}
   */

      getPending(id, account) {
        return this.get(`/wallet/${id}/tx/unconfirmed`, { account });
      }

      /**
   * Calculate wallet balance.
   * @param {String} account
   * @returns {Promise}
   */

      getBalance(id, account) {
        return this.get(`/wallet/${id}/balance`, { account });
      }

      /**
   * Get last N wallet transactions.
   * @param {String} account
   * @param {Number} limit - Max number of transactions.
   * @returns {Promise}
   */

      getLast(id, account, limit) {
        return this.get(`/wallet/${id}/tx/last`, { account, limit });
      }

      /**
   * Get wallet transactions by timestamp range.
   * @param {String} account
   * @param {Object} options
   * @param {Number} options.start - Start time.
   * @param {Number} options.end - End time.
   * @param {Number?} options.limit - Max number of records.
   * @param {Boolean?} options.reverse - Reverse order.
   * @returns {Promise}
   */

      getRange(id, account, options) {
        return this.get(`/wallet/${id}/tx/range`, {
          account,
          start: options.start,
          end: options.end,
          limit: options.limit,
          reverse: options.reverse
        });
      }

      /**
   * Get transaction (only possible if the transaction
   * is available in the wallet history).
   * @param {Hash} hash
   * @returns {Promise}
   */

      getTX(id, hash) {
        return this.get(`/wallet/${id}/tx/${hash}`);
      }

      /**
   * Get wallet blocks.
   * @param {Number} height
   * @returns {Promise}
   */

      getBlocks(id) {
        return this.get(`/wallet/${id}/block`);
      }

      /**
   * Get wallet block.
   * @param {Number} height
   * @returns {Promise}
   */

      getBlock(id, height) {
        return this.get(`/wallet/${id}/block/${height}`);
      }

      /**
   * Get unspent coin (only possible if the transaction
   * is available in the wallet history).
   * @param {Hash} hash
   * @param {Number} index
   * @returns {Promise}
   */

      getCoin(id, hash, index) {
        return this.get(`/wallet/${id}/coin/${hash}/${index}`);
      }

      /**
   * @param {Number} now - Current time.
   * @param {Number} age - Age delta.
   * @returns {Promise}
   */

      zap(id, account, age) {
        return this.post(`/wallet/${id}/zap`, { account, age });
      }

      /**
   * Create a transaction, fill.
   * @param {Object} options
   * @returns {Promise}
   */

      createTX(id, options) {
        return this.post(`/wallet/${id}/create`, options);
      }

      /**
   * Create a transaction, fill, sign, and broadcast.
   * @param {Object} options
   * @param {String} options.address
   * @param {Amount} options.value
   * @returns {Promise}
   */

      send(id, options) {
        return this.post(`/wallet/${id}/send`, options);
      }

      /**
   * Sign a transaction.
   * @param {Object} options
   * @returns {Promise}
   */

      sign(id, options) {
        return this.post(`/wallet/${id}/sign`, options);
      }

      /**
   * Get the raw wallet JSON.
   * @returns {Promise}
   */

      getInfo(id) {
        return this.get(`/wallet/${id}`);
      }

      /**
   * Get wallet accounts.
   * @returns {Promise} - Returns Array.
   */

      getAccounts(id) {
        return this.get(`/wallet/${id}/account`);
      }

      /**
   * Get wallet master key.
   * @returns {Promise}
   */

      getMaster(id) {
        return this.get(`/wallet/${id}/master`);
      }

      /**
   * Get wallet account.
   * @param {String} account
   * @returns {Promise}
   */

      getAccount(id, account) {
        return this.get(`/wallet/${id}/account/${account}`);
      }

      /**
   * Create account.
   * @param {String} name
   * @param {Object} options
   * @returns {Promise}
   */

      createAccount(id, name, options) {
        return this.put(`/wallet/${id}/account/${name}`, options);
      }

      /**
   * Create address.
   * @param {Object} options
   * @returns {Promise}
   */

      createAddress(id, account) {
        return this.post(`/wallet/${id}/address`, { account });
      }

      /**
   * Create change address.
   * @param {Object} options
   * @returns {Promise}
   */

      createChange(id, account) {
        return this.post(`/wallet/${id}/change`, { account });
      }

      /**
   * Create nested address.
   * @param {Object} options
   * @returns {Promise}
   */

      createNested(id, account) {
        return this.post(`/wallet/${id}/nested`, { account });
      }

      /**
   * Change or set master key`s passphrase.
   * @param {String|Buffer} passphrase
   * @param {(String|Buffer)?} old
   * @returns {Promise}
   */

      setPassphrase(id, passphrase, old) {
        return this.post(`/wallet/${id}/passphrase`, { passphrase, old });
      }

      /**
   * Generate a new token.
   * @param {(String|Buffer)?} passphrase
   * @returns {Promise}
   */

      retoken(id, passphrase) {
        return this.post(`/wallet/${id}/retoken`, {
          passphrase
        });
      }

      /**
   * Import private key.
   * @param {Number|String} account
   * @param {String} key
   * @returns {Promise}
   */

      importPrivate(id, account, privateKey, passphrase) {
        return this.post(`/wallet/${id}/import`, {
          account,
          privateKey,
          passphrase
        });
      }

      /**
   * Import public key.
   * @param {Number|String} account
   * @param {String} key
   * @returns {Promise}
   */

      importPublic(id, account, publicKey) {
        return this.post(`/wallet/${id}/import`, {
          account,
          publicKey
        });
      }

      /**
   * Import address.
   * @param {Number|String} account
   * @param {String} address
   * @returns {Promise}
   */

      importAddress(id, account, address) {
        return this.post(`/wallet/${id}/import`, { account, address });
      }

      /**
   * Lock a coin.
   * @param {String} hash
   * @param {Number} index
   * @returns {Promise}
   */

      lockCoin(id, hash, index) {
        return this.put(`/wallet/${id}/locked/${hash}/${index}`);
      }

      /**
   * Unlock a coin.
   * @param {String} hash
   * @param {Number} index
   * @returns {Promise}
   */

      unlockCoin(id, hash, index) {
        return this.del(`/wallet/${id}/locked/${hash}/${index}`);
      }

      /**
   * Get locked coins.
   * @returns {Promise}
   */

      getLocked(id) {
        return this.get(`/wallet/${id}/locked`);
      }

      /**
   * Lock wallet.
   * @returns {Promise}
   */

      lock(id) {
        return this.post(`/wallet/${id}/lock`);
      }

      /**
   * Unlock wallet.
   * @param {String} passphrase
   * @param {Number} timeout
   * @returns {Promise}
   */

      unlock(id, passphrase, timeout) {
        return this.post(`/wallet/${id}/unlock`, { passphrase, timeout });
      }

      /**
   * Get wallet key.
   * @param {String} address
   * @returns {Promise}
   */

      getKey(id, address) {
        return this.get(`/wallet/${id}/key/${address}`);
      }

      /**
   * Get wallet key WIF dump.
   * @param {String} address
   * @param {String?} passphrase
   * @returns {Promise}
   */

      getWIF(id, address, passphrase) {
        return this.get(`/wallet/${id}/wif/${address}`, { passphrase });
      }

      /**
   * Add a public account key to the wallet for multisig.
   * @param {String} account
   * @param {String} key - Account (bip44) key (base58).
   * @returns {Promise}
   */

      addSharedKey(id, account, accountKey) {
        return this.put(`/wallet/${id}/shared-key`, { account, accountKey });
      }

      /**
   * Remove a public account key to the wallet for multisig.
   * @param {String} account
   * @param {String} key - Account (bip44) key (base58).
   * @returns {Promise}
   */

      removeSharedKey(id, account, accountKey) {
        return this.del(`/wallet/${id}/shared-key`, { account, accountKey });
      }

      /**
   * Resend wallet transactions.
   * @returns {Promise}
   */

      resendWallet(id) {
        return this.post(`/wallet/${id}/resend`);
      }
    }

    /**
 * Wallet Instance
 * @extends {EventEmitter}
 */

    class Wallet extends EventEmitter {
      /**
   * Create a wallet client.
   * @param {Object?} options
   */

      constructor(parent, id, token) {
        super();
        this.parent = parent;
        this.client = parent.clone();
        this.client.token = token;
        this.id = id;
        this.token = token;
      }

      /**
   * Open wallet.
   * @returns {Promise}
   */

      async open() {
        await this.parent.join(this.id, this.token);
        this.parent.wallets.set(this.id, this);
      }

      /**
   * Close wallet.
   * @returns {Promise}
   */

      async close() {
        await this.parent.leave(this.id);
        this.parent.wallets.delete(this.id);
      }

      /**
   * Get wallet transaction history.
   * @param {String} account
   * @returns {Promise}
   */

      getHistory(account) {
        return this.client.getHistory(this.id, account);
      }

      /**
   * Get wallet coins.
   * @param {String} account
   * @returns {Promise}
   */

      getCoins(account) {
        return this.client.getCoins(this.id, account);
      }

      /**
   * Get all unconfirmed transactions.
   * @param {String} account
   * @returns {Promise}
   */

      getPending(account) {
        return this.client.getPending(this.id, account);
      }

      /**
   * Calculate wallet balance.
   * @param {String} account
   * @returns {Promise}
   */

      getBalance(account) {
        return this.client.getBalance(this.id, account);
      }

      /**
   * Get last N wallet transactions.
   * @param {String} account
   * @param {Number} limit - Max number of transactions.
   * @returns {Promise}
   */

      getLast(account, limit) {
        return this.client.getLast(this.id, account, limit);
      }

      /**
   * Get wallet transactions by timestamp range.
   * @param {String} account
   * @param {Object} options
   * @param {Number} options.start - Start time.
   * @param {Number} options.end - End time.
   * @param {Number?} options.limit - Max number of records.
   * @param {Boolean?} options.reverse - Reverse order.
   * @returns {Promise}
   */

      getRange(account, options) {
        return this.client.getRange(this.id, account, options);
      }

      /**
   * Get transaction (only possible if the transaction
   * is available in the wallet history).
   * @param {Hash} hash
   * @returns {Promise}
   */

      getTX(hash) {
        return this.client.getTX(this.id, hash);
      }

      /**
   * Get wallet blocks.
   * @param {Number} height
   * @returns {Promise}
   */

      getBlocks() {
        return this.client.getBlocks(this.id);
      }

      /**
   * Get wallet block.
   * @param {Number} height
   * @returns {Promise}
   */

      getBlock(height) {
        return this.client.getBlock(this.id, height);
      }

      /**
   * Get unspent coin (only possible if the transaction
   * is available in the wallet history).
   * @param {Hash} hash
   * @param {Number} index
   * @returns {Promise}
   */

      getCoin(hash, index) {
        return this.client.getCoin(this.id, hash, index);
      }

      /**
   * @param {Number} now - Current time.
   * @param {Number} age - Age delta.
   * @returns {Promise}
   */

      zap(account, age) {
        return this.client.zap(this.id, account, age);
      }

      /**
   * Create a transaction, fill.
   * @param {Object} options
   * @returns {Promise}
   */

      createTX(options) {
        return this.client.createTX(this.id, options);
      }

      /**
   * Create a transaction, fill, sign, and broadcast.
   * @param {Object} options
   * @param {String} options.address
   * @param {Amount} options.value
   * @returns {Promise}
   */

      send(options) {
        return this.client.send(this.id, options);
      }

      /**
   * Sign a transaction.
   * @param {Object} options
   * @returns {Promise}
   */

      sign(options) {
        return this.client.sign(this.id, options);
      }

      /**
   * Get the raw wallet JSON.
   * @returns {Promise}
   */

      getInfo() {
        return this.client.getInfo(this.id);
      }

      /**
   * Get wallet accounts.
   * @returns {Promise} - Returns Array.
   */

      getAccounts() {
        return this.client.getAccounts(this.id);
      }

      /**
   * Get wallet master key.
   * @returns {Promise}
   */

      getMaster() {
        return this.client.getMaster(this.id);
      }

      /**
   * Get wallet account.
   * @param {String} account
   * @returns {Promise}
   */

      getAccount(account) {
        return this.client.getAccount(this.id, account);
      }

      /**
   * Create account.
   * @param {String} name
   * @param {Object} options
   * @returns {Promise}
   */

      createAccount(name, options) {
        return this.client.createAccount(this.id, name, options);
      }

      /**
   * Create address.
   * @param {Object} options
   * @returns {Promise}
   */

      createAddress(account) {
        return this.client.createAddress(this.id, account);
      }

      /**
   * Create change address.
   * @param {Object} options
   * @returns {Promise}
   */

      createChange(account) {
        return this.client.createChange(this.id, account);
      }

      /**
   * Create nested address.
   * @param {Object} options
   * @returns {Promise}
   */

      createNested(account) {
        return this.client.createNested(this.id, account);
      }

      /**
   * Change or set master key`s passphrase.
   * @param {String|Buffer} passphrase
   * @param {(String|Buffer)?} old
   * @returns {Promise}
   */

      setPassphrase(passphrase, old) {
        return this.client.setPassphrase(this.id, passphrase, old);
      }

      /**
   * Generate a new token.
   * @param {(String|Buffer)?} passphrase
   * @returns {Promise}
   */

      async retoken(passphrase) {
        const result = await this.client.retoken(this.id, passphrase);

        assert(result);
        assert(typeof result.token === 'string');

        this.token = result.token;

        return result;
      }

      /**
   * Import private key.
   * @param {Number|String} account
   * @param {String} key
   * @returns {Promise}
   */

      importPrivate(account, privateKey, passphrase) {
        return this.client.importPrivate(this.id, account, privateKey, passphrase);
      }

      /**
   * Import public key.
   * @param {Number|String} account
   * @param {String} key
   * @returns {Promise}
   */

      importPublic(account, publicKey) {
        return this.client.importPublic(this.id, account, publicKey);
      }

      /**
   * Import address.
   * @param {Number|String} account
   * @param {String} address
   * @returns {Promise}
   */

      importAddress(account, address) {
        return this.client.importAddress(this.id, account, address);
      }

      /**
   * Lock a coin.
   * @param {String} hash
   * @param {Number} index
   * @returns {Promise}
   */

      lockCoin(hash, index) {
        return this.client.lockCoin(this.id, hash, index);
      }

      /**
   * Unlock a coin.
   * @param {String} hash
   * @param {Number} index
   * @returns {Promise}
   */

      unlockCoin(hash, index) {
        return this.client.unlockCoin(this.id, hash, index);
      }

      /**
   * Get locked coins.
   * @returns {Promise}
   */

      getLocked() {
        return this.client.getLocked(this.id);
      }

      /**
   * Lock wallet.
   * @returns {Promise}
   */

      lock() {
        return this.client.lock(this.id);
      }

      /**
   * Unlock wallet.
   * @param {String} passphrase
   * @param {Number} timeout
   * @returns {Promise}
   */

      unlock(passphrase, timeout) {
        return this.client.unlock(this.id, passphrase, timeout);
      }

      /**
   * Get wallet key.
   * @param {String} address
   * @returns {Promise}
   */

      getKey(address) {
        return this.client.getKey(this.id, address);
      }

      /**
   * Get wallet key WIF dump.
   * @param {String} address
   * @param {String?} passphrase
   * @returns {Promise}
   */

      getWIF(address, passphrase) {
        return this.client.getWIF(this.id, address, passphrase);
      }

      /**
   * Add a public account key to the wallet for multisig.
   * @param {String} account
   * @param {String} key - Account (bip44) key (base58).
   * @returns {Promise}
   */

      addSharedKey(account, accountKey) {
        return this.client.addSharedKey(this.id, account, accountKey);
      }

      /**
   * Remove a public account key to the wallet for multisig.
   * @param {String} account
   * @param {String} key - Account (bip44) key (base58).
   * @returns {Promise}
   */

      removeSharedKey(account, accountKey) {
        return this.client.removeSharedKey(this.id, account, accountKey);
      }

      /**
   * Resend wallet transactions.
   * @returns {Promise}
   */

      resend() {
        return this.client.resendWallet(this.id);
      }
    }

    /*
 * Expose
 */

    module.exports = WalletClient;
  }]
];

const __node_cache__ = [];

function __node_error__(location) {
  const err = new Error(`Cannot find module '${location}'`);
  err.code = 'MODULE_NOT_FOUND';
  throw err;
}

function __node_require__(id) {
  if ((id >>> 0) !== id || id > __node_modules__.length) { return __node_error__(id); }

  while (__node_cache__.length <= id) { __node_cache__.push(null); }

  const cache = __node_cache__[id];

  if (cache) { return cache.exports; }

  const mod = __node_modules__[id];
  const name = mod[0];
  const path = mod[1];
  const func = mod[2];
  let meta;

  let _exports = exports;
  let _module = module;

  if (id !== 0) {
    _exports = {};
    _module = {
      id: `/${name}${path}`,
      exports: _exports,
      parent: module.parent,
      filename: module.filename,
      loaded: false,
      children: module.children,
      paths: module.paths
    };
  }

  __node_cache__[id] = _module;

  try {
    func.call(_exports, _exports, _module,
      __filename, __dirname, meta);
  } catch (e) {
    __node_cache__[id] = null;
    throw e;
  }

  __node_modules__[id] = null;

  if (id !== 0) { _module.loaded = true; }

  return _module.exports;
}

__node_require__(0);
