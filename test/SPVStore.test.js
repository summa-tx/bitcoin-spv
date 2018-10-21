const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const compiledVSPV = require('../build/ValidateSPV.json');
const compiledBTCUtils = require('../build/BTCUtils.json');
const compiledBytes = require('../build/BytesLib.json');
const compiledStore = require('../build/SPVStore.json');
const utils = require('./utils');
const constants = require('./constants');
const linker = require('solc/linker');

// suppress web3 MaxListenersExceededWarning
var listeners = process.listeners('warning');
listeners.forEach(listener => process.removeListener('warning', listener));


describe('SPVStore', async () => {
    let storeContract;
    let accounts;
    let seller;
    let GAS = 6712388;
    let GAS_PRICE = 100000000000;

    beforeEach(async () => {
        let bc;

        accounts = await web3.eth.getAccounts();
        seller = accounts[1];

        // Link
        let bytesContract = await new web3.eth.Contract(JSON.parse(compiledBytes.interface))
            .deploy({ data: compiledBytes.bytecode})
            .send({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE});

        assert.ok(bytesContract.options.address);

        bc = await linker.linkBytecode(compiledBTCUtils.bytecode,
            {'BytesLib.sol:BytesLib': bytesContract.options.address});

        // Link
        let btcUtilsContract = await new web3.eth.Contract(JSON.parse(compiledBTCUtils.interface))
            .deploy({ data: bc })
            .send({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE});

        assert.ok(btcUtilsContract.options.address);

        bc = await linker.linkBytecode(compiledVSPV.bytecode,
            {'BTCUtils.sol:BTCUtils': btcUtilsContract.options.address,
                'BytesLib.sol:BytesLib': bytesContract.options.address});

        // Link
        let vspvContract = await new web3.eth.Contract(JSON.parse(compiledVSPV.interface))
            .deploy({ data: bc })
            .send({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE});

        assert.ok(vspvContract.options.address);

        bc = await linker.linkBytecode(compiledStore.bytecode,
            {'ValidateSPV.sol:ValidateSPV': vspvContract.options.address,
                'BTCUtils.sol:BTCUtils': btcUtilsContract.options.address,
                'BytesLib.sol:BytesLib': bytesContract.options.address});

        storeContract = await new web3.eth.Contract(JSON.parse(compiledStore.interface))
            .deploy({ data: bc })
            .send({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE});

        assert.ok(storeContract.options.address);
    });

    describe('#validate', async () => {
        let storedTx;
        let storedHeader;

        beforeEach(async () => {
            await storeContract.methods.parseAndStoreHeader(constants.OP_RETURN.INDEXED_HEADERS[0].HEADER)
                .send({from: seller, gas: GAS, gasPrice: GAS_PRICE})
            storedTx = await storeContract.methods.parseAndStoreHeader(constants.OP_RETURN.INDEXED_HEADERS[0].HEADER)
                .call({from: seller, gas: GAS, gasPrice: GAS_PRICE})
            await storeContract.methods.parseAndStoreTransaction(constants.OP_RETURN.TX)
                .send({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE });
            storedHeader = await storeContract.methods.parseAndStoreTransaction(constants.OP_RETURN.TX)
                .call({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE });
        });

        it('returns true on success', async () => {

            assert.ok(await storeContract.methods.validate(
                constants.OP_RETURN.TXID_LE,
                constants.OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE,
                constants.OP_RETURN.PROOF,
                constants.OP_RETURN.PROOF_INDEX)
                .send({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE }));

            assert.equal(await storeContract.methods.validate(
                constants.OP_RETURN.TXID_LE,
                constants.OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE,
                constants.OP_RETURN.PROOF,
                constants.OP_RETURN.PROOF_INDEX)
                .call({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE }), true);
        });

        it.skip('emits a Validated event', async () => {
            let op_return_txid = '0x48e5a1a0e616d8fd92b4ef228c424e0c816799a256c6a90892195ccfc53300d6';

            // OP_RETURN TX
            await storeContract.methods.validate(
                constants.OP_RETURN.TX, OP_RETURN_PROOF, OP_RETURN_INDEX, OP_RETURN_HEADER)
                .send({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE});

            // Emits a Validated event
            utils.expectEvent(storeContract.getPastEvents('Validated',
                { fromBlock: 0, toBlock: 'latest'}));

            // Filter by txid
            let op_return_event = await storeContract.getPastEvents('Validated',
                { filter: { _hash: op_return_txid },
                    fromBlock: 0, toBlock: 'latest'});
            assert.equal(op_return_event[0].raw.topics[1], op_return_txid);
        });

    });

    describe('#parseAndStoreTransaction', async () => {

        it('returns a txid on success', async () => {

            assert.ok(await storeContract.methods.parseAndStoreTransaction(constants.OP_RETURN.TX)
                .send({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE }));

            assert.equal(await storeContract.methods.parseAndStoreTransaction(constants.OP_RETURN.TX)
                .call({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE }), 
                constants.OP_RETURN.TXID_LE);
        });

        it('stores a transactions locktime, nIns, nOuts', async () => {

            await storeContract.methods.parseAndStoreTransaction(constants.OP_RETURN.TX)
                .send({ from: seller, gas: GAS, gasPrice: GAS_PRICE });

            let validTx = await storeContract.methods.parseAndStoreTransaction(constants.OP_RETURN.TX)
                .send({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE });

            let storedTx = await storeContract.methods.transactions(
                constants.OP_RETURN.TXID_LE).call();

            assert.equal(constants.OP_RETURN.TXID_LE, storedTx.txid);
            assert.equal(constants.OP_RETURN.N_INPUTS, storedTx.numInputs);
            assert.equal(constants.OP_RETURN.N_OUTPUTS, storedTx.numOutputs);
            assert.equal(constants.OP_RETURN.LOCKTIME, storedTx.locktime);
        });

        it.skip('emits a TxParsed event', async () => {

            await storeContract.methods.parseAndStoreTransaction(constants.OP_RETURN.TX)
                .send({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE });

            // Emits a TxParsed event
            utils.expectEvent(storeContract.getPastEvents('TxParsed',
                { fromBlock: 0, toBlock: 'latest'}));

            // Filter by txid
            let op_return_event = await storeContract.getPastEvents('TxParsed',
                { filter: { _hash: op_return_txid },
                    fromBlock: 0, toBlock: 'latest'});

            assert.equal(op_return_event[0].raw.topics[1], op_return_txid);
        });

        it('returns bytes32(0) if invalid prefix', async () => {

            let err_prefix_tx = '0x040000000001011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000';
            assert.equal(
                await storeContract.methods.parseAndStoreTransaction(err_prefix_tx)
                    .call({ from: accounts[0], gas: GAS, gasPrice: GAS_PRICE }), constants.EMPTY);
        });

        it.skip('returns bytes32(0) if invalid outpoint', async() => { });
        it.skip('errors if input is invalid', async () => { });
    });

    describe('#parseAndStoreHeader', async () => {

        it('returns a header digest on success', async () => {
            await storeContract.methods.parseAndStoreHeader(constants.OP_RETURN.INDEXED_HEADERS[0].HEADER)
                .send({from: seller, gas: GAS, gasPrice: GAS_PRICE})

            assert.equal(await storeContract.methods.parseAndStoreHeader(
                constants.OP_RETURN.INDEXED_HEADERS[0].HEADER)
                .call({from: seller, gas: GAS, gasPrice: GAS_PRICE}),
                constants.OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE);
        });

        it('stores a header digest, version, prevBlock, merkleRoot, time, tartget, nonce',
            async () => {
                await storeContract.methods.parseAndStoreHeader(constants.OP_RETURN.INDEXED_HEADERS[0].HEADER)
                    .send({from: seller, gas: GAS, gasPrice: GAS_PRICE})

                let validHeader = await storeContract.methods.parseAndStoreHeader(constants.OP_RETURN.INDEXED_HEADERS[0].HEADER)
                    .call({from: seller, gas: GAS, gasPrice: GAS_PRICE})

                // let storedHeader = await storeContract.methods.headers(validHeader._digest).call();
                let storedHeader = await storeContract.methods.headers(
                    constants.OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE).call();

                assert.equal(constants.OP_RETURN.INDEXED_HEADERS[0].DIGEST_BE, storedHeader.digest);
                assert.equal(constants.OP_RETURN.INDEXED_HEADERS[0].VERSION, storedHeader.version);
                assert.equal(constants.OP_RETURN.INDEXED_HEADERS[0].PREV_HASH_LE, storedHeader.prevHash);
                assert.equal(constants.OP_RETURN.INDEXED_HEADERS[0].MERKLE_ROOT_LE, storedHeader.merkleRoot);
                assert.equal(constants.OP_RETURN.INDEXED_HEADERS[0].TIMESTAMP, storedHeader.timestamp);
                assert.equal(constants.OP_RETURN.INDEXED_HEADERS[0].TARGET, storedHeader.target);
                assert.equal(constants.OP_RETURN.INDEXED_HEADERS[0].NONCE, storedHeader.nonce);
        });

        it.skip('emits a HeaderParsed event', async () => { });
        it.skip('errors if the header is not 80 bytes long', async () => { });
    });
});
