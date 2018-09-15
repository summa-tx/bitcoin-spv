const assert = require('assert');
const createHash = require('create-hash')
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

module.exports = {
    latestTime: latestTime = async () => {
        let blockNumber = await web3.eth.getBlock('latest');
        return blockNumber.timestamp;
    },

    increaseTime: increaseTime = async (duration) => {
      const id = Date.now();

      return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
          jsonrpc: '2.0',
          method: 'evm_increaseTime',
          params: [duration],
          id: id,
        }, err1 => {
          if (err1) return reject(err1);

          web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_mine',
            id: id + 1,
          }, (err2, res) => {
            return err2 ? reject(err2) : resolve(res);
          });
        });
      });
    },

    increaseTimeTo: increaseTimeTo = async (target) => {
      let now = await latestTime();
      if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
      let diff = target - now;
      return increaseTime(diff);
    },

    expectThrow: async function expectThrow(promise) {
        // This function is from OpenZeppelin
        // It is used and redistributed under the MIT license
        // See copyright notice at EOF
        try {
            await promise;
        } catch (error) {
            // TODO: Check jump destination to destinguish between a throw
            //       and an actual invalid jump.
            const invalidOpcode = error.message.search('invalid opcode') >= 0;
            // TODO: When we contract A calls contract B, and B throws, instead
            //       of an 'invalid jump', we get an 'out of gas' error. How do
            //       we distinguish this from an actual out of gas event? (The
            //       ganache log actually show an 'invalid jump' event.)
            const outOfGas = error.message.search('out of gas') >= 0;
            const revert = error.message.search('revert') >= 0;
            assert(
                invalidOpcode || outOfGas || revert,
                'Expected throw, got \'' + error + '\' instead'
            );
            return;
        }
        assert.fail('Expected throw not received');
    },

    getPreimageAndHash: function* getPreimageAndHash() {
        var buff = Buffer(32)
            for (var j=31; j>=0; j--) {
                for (var i=1; i<256; i++) {
                    hexString = buff.toString('hex')
                        digest = this.sha256(hexString)
                            hexString = '0x' + hexString
                                buff[j] = i
                                    yield [hexString, digest]
                }
            }
    },

    hash160: function hash160 (hexString) {
        let buffer = Buffer.from(hexString, 'hex')
            var t = createHash('sha256').update(buffer).digest()
                var u = createHash('rmd160').update(t).digest()
                    return '0x' + u.toString('hex')
    },

    sha256: function sha256 (hexString) {
        let buffer = Buffer.from(hexString, 'hex')
            var t = createHash('sha256').update(buffer).digest()
                return '0x' + t.toString('hex')
    },

    duration: {
        seconds: function(val) { return val},
        minutes: function(val) { return val * this.seconds(60) },
        hours:   function(val) { return val * this.minutes(60) },
        days:    function(val) { return val * this.hours(24) },
        weeks:   function(val) { return val * this.days(7) },
        years:   function(val) { return val * this.days(365)}
    },

    expectEvent: expectEvent = async (promise) => {
        await promise
            .then( (events) => {
                if (!Object.keys(events).length == 0) {
                    assert.ok(events);
                } else {
                    assert.fail('No event emitted');
                }
            }).catch(err => assert.fail(err));
    }
}


// The MIT License (MIT)
//
// Copyright (c) 2016 Smart Contract Solutions, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
