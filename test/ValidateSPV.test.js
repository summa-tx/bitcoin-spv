const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const compiledValidateSPV = require('../build/ValidateSPV.json');
const compiledBTCUtils = require('../build/BTCUtils.json');
const compiledBytes = require('../build/BytesLib.json');
const linker = require('solc/linker');

// suppress web3 MaxListenersExceededWarning
// remove when web3 gets its act together
var listeners = process.listeners('warning');
listeners.forEach(listener => process.removeListener('warning', listener));

// Valid header chain
const HEADER_CHAIN = '0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b00000020fe70e48339d6b17fbbf1340d245338f57336e97767cc240000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d9515900000020baaea6746f4c16ccb7cd961655b636d39b5fe1519b8f15000000000000000000c63a8848a448a43c9e4402bd893f701cd11856e14cbbe026699e8fdc445b35a8d93c9c5ba1192817b945dc6c00000020f402c0b551b944665332466753f1eebb846a64ef24c71700000000000000000033fc68e070964e908d961cd11033896fa6c9b8b76f64a2db7ea928afa7e304257d3f9c5ba11928176164145d0000ff3f63d40efa46403afd71a254b54f2b495b7b0164991c2d22000000000000000000f046dc1b71560b7d0786cfbdb25ae320bd9644c98d5c7c77bf9df05cbe96212758419c5ba1192817a2bb2caa00000020e2d4f0edd5edd80bdcb880535443747c6b22b48fb6200d0000000000000000001d3799aa3eb8d18916f46bf2cf807cb89a9b1b4c56c3f2693711bf1064d9a32435429c5ba1192817752e49ae0000002022dba41dff28b337ee3463bf1ab1acf0e57443e0f7ab1d000000000000000000c3aadcc8def003ecbd1ba514592a18baddddcd3a287ccf74f584b04c5c10044e97479c5ba1192817c341f595';
// Changed Header01 prevHash to be the same as Header00 prevHash to create invalid chain
const HEADER_CHAIN_INVALID_PREVHASH = '0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d951590000002073bd2184edd9c4fc76642ea6754ee40136970efc10c419000000000000000000c63a8848a448a43c9e4402bd893f701cd11856e14cbbe026699e8fdc445b35a8d93c9c5ba1192817b945dc6c00000020f402c0b551b944665332466753f1eebb846a64ef24c71700000000000000000033fc68e070964e908d961cd11033896fa6c9b8b76f64a2db7ea928afa7e304257d3f9c5ba11928176164145d0000ff3f63d40efa46403afd71a254b54f2b495b7b0164991c2d22000000000000000000f046dc1b71560b7d0786cfbdb25ae320bd9644c98d5c7c77bf9df05cbe96212758419c5ba1192817a2bb2caa00000020e2d4f0edd5edd80bdcb880535443747c6b22b48fb6200d0000000000000000001d3799aa3eb8d18916f46bf2cf807cb89a9b1b4c56c3f2693711bf1064d9a32435429c5ba1192817752e49ae0000002022dba41dff28b337ee3463bf1ab1acf0e57443e0f7ab1d000000000000000000c3aadcc8def003ecbd1ba514592a18baddddcd3a287ccf74f584b04c5c10044e97479c5ba1192817c341f595';
// Removed a byte from Header00's version to create invalid chain length
const HEADER_CHAIN_INVALID_LEN = '0x00002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b00000020fe70e48339d6b17fbbf1340d245338f57336e97767cc240000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d9515900000020baaea6746f4c16ccb7cd961655b636d39b5fe1519b8f15000000000000000000c63a8848a448a43c9e4402bd893f701cd11856e14cbbe026699e8fdc445b35a8d93c9c5ba1192817b945dc6c00000020f402c0b551b944665332466753f1eebb846a64ef24c71700000000000000000033fc68e070964e908d961cd11033896fa6c9b8b76f64a2db7ea928afa7e304257d3f9c5ba11928176164145d0000ff3f63d40efa46403afd71a254b54f2b495b7b0164991c2d22000000000000000000f046dc1b71560b7d0786cfbdb25ae320bd9644c98d5c7c77bf9df05cbe96212758419c5ba1192817a2bb2caa00000020e2d4f0edd5edd80bdcb880535443747c6b22b48fb6200d0000000000000000001d3799aa3eb8d18916f46bf2cf807cb89a9b1b4c56c3f2693711bf1064d9a32435429c5ba1192817752e49ae0000002022dba41dff28b337ee3463bf1ab1acf0e57443e0f7ab1d000000000000000000c3aadcc8def003ecbd1ba514592a18baddddcd3a287ccf74f584b04c5c10044e97479c5ba1192817c341f595';

describe.only('ValidateSPV', () => {
    let bc;
    let vspv;
    let accounts;
    let seller;
    let gas = 6712388;
    let gasPrice = 100000000000;

    before(async() => {
        accounts = await web3.eth.getAccounts();
        seller = accounts[1];

        let bytesContract = await new web3.eth.Contract(JSON.parse(compiledBytes.interface))
            .deploy({ data: compiledBytes.bytecode})
            .send({ from: accounts[0], gas: 6712388, gasPrice: 100000000000});

        assert.ok(bytesContract.options.address);

        // Link
        bc = await linker.linkBytecode(compiledBTCUtils.bytecode,
             {'BytesLib.sol:BytesLib': bytesContract.options.address});

        let btcUtilsContract = await new web3.eth.Contract(JSON.parse(compiledBTCUtils.interface))
            .deploy({ data: bc })
            .send({ from: accounts[0], gas: 6712388, gasPrice: 100000000000});

        assert.ok(btcUtilsContract.options.address);

        // Link
        bc = await linker.linkBytecode(compiledValidateSPV.bytecode,
            {'BytesLib.sol:BytesLib': bytesContract.options.address,
                'BTCUtils.sol:BTCUtils': btcUtilsContract.options.address});

    });

    beforeEach(async () =>
        vspv = await new web3.eth.Contract(JSON.parse(compiledValidateSPV.interface))
            .deploy({ data: bc })
            .send({ from: accounts[0], gas: gas, gasPrice: gasPrice }));

    it('compiles the ValidateSPV library', async () => assert.ok(vspv.options.address));

    describe('#parseHeader', async () => {
        it('returns the header digest, version, prevHash, merkleRoot, timestamp, target, and nonce',
            async () => {
                let header = '0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b';
                let digest = '0x00000000000000000024cc6777e93673f53853240d34f1bb7fb1d63983e470fe';
                let version = 536870912;
                let prevHash = '0x73bd2184edd9c4fc76642ea6754ee40136970efc10c419000000000000000000';
                let merkleRoot = '0x0296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c2';
                let timestamp = 1536963606;
                let target = 3840827764407250199942201944063224491938810378873470976;
                let nonce = 729298957;
                
                let validHeader = await vspv.methods.parseHeader(header)
                    .call({from: seller, gas: gas, gasPrice: gasPrice})

                assert.equal(validHeader._digest, digest);
                assert.equal(validHeader._version, version);
                assert.equal(validHeader._prevHash, prevHash);
                assert.equal(validHeader._merkleRoot, merkleRoot);
                assert.equal(validHeader._timestamp, timestamp);
                assert.equal(validHeader._target, target);
                assert.equal(validHeader._nonce, nonce);
        });

        it('errors if input header is not 80 bytes', async () => {
            // Removed a byte from the header version to create error
            let invalidHeader = '0x00002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b';
            await vspv.methods.parseHeader(invalidHeader)
                .call({from: seller, gas: gas, gasPrice: gasPrice})
                .then(() => assert(false))
                .catch(e => {
                    assert(e.message.search('Header chain must be divisible by 80.') >= 1);
            });
        });
    });

    describe('#validateHeaderChain', async () => {
        it('returns true if header chain is valid', async () => {
            let res = await vspv.methods.validateHeaderChain(HEADER_CHAIN).call();
            assert.equal(res, true);
        });

        it('returns false if header chain is invalid', async () => {
            let res = await vspv.methods.validateHeaderChain(HEADER_CHAIN_INVALID_PREVHASH).call();
            assert.equal(res, false);
        });

        it('errors if header chain is not divisible by 80', async () =>
            await vspv.methods.validateHeaderChain(HEADER_CHAIN_INVALID_LEN)
                .send({from: seller, gas: gas, gasPrice: gasPrice})
                .then(() => assert(false))
                .catch(e => {
                    assert(e.message.search('Header chain must be divisible by 80.') >= 1);
            }));
    });

    describe('#validateHeaderPrevHash', async () => {
        it('returns true if header prevHash is valid', async () => {
            let previousHeader = '0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b';
            let header = '0x00000020fe70e48339d6b17fbbf1340d245338f57336e97767cc240000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d95159';
            assert.equal(
                await vspv.methods.validateHeaderPrevHash(previousHeader, header).call(),
                true);
        });

        it('returns false if header prevHash is invalid', async () => {
            let previousHeader = '0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b';
            let invalidHeader = '0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d95159';
            assert.equal(
                await vspv.methods.validateHeaderPrevHash(previousHeader, invalidHeader).call(),
                false);
        });
    });


    describe('#validateHeaderLength', async () => {

        it('returns true if header chain length is valid', async () =>
            assert.equal(
                await vspv.methods.validateHeaderLength(HEADER_CHAIN).call(),
                true));

        it('returns false if header chain length is invalid', async () =>
            assert.equal(
                await vspv.methods.validateHeaderLength(HEADER_CHAIN_INVALID_LEN).call(),
                false));

        it('returns true if header length is valid', async () => {
            let header = '0x00000020fe70e48339d6b17fbbf1340d245338f57336e97767cc240000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d95159';
            assert.equal(await vspv.methods.validateHeaderLength(header).call(), true);
        });

        it('returns false if header length is invalid', async () => {
            let invalidHeader = '0x000020fe70e48339d6b17fbbf1340d245338f57336e97767cc240000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d95159';
            assert.equal(await vspv.methods.validateHeaderLength(invalidHeader).call(), false);
        });
    });
});
