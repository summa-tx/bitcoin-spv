const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const compiledBTCUtils = require('../build/BTCUtils.json');
const compiledHeader = require('../build/BlockHeader.json');
const compiledBytes = require('../build/BytesLib.json');
const utils = require('./utils');
const linker = require('solc/linker');

// suppress web3 MaxListenersExceededWarning
// remove when web3 gets its act together
var listeners = process.listeners('warning');
listeners.forEach(listener => process.removeListener('warning', listener));


let accounts;
const HEADER_170 = '0x0100000055bd840a78798ad0da853f68974f3d183e2bd1db6a842c1feecf222a00000000ff104ccb05421ab93e63f8c3ce5c2c2e9dbb37de2764b3a3175c8166562cac7d51b96a49ffff001d283e9e70';

// txid BE: d60033c5cf5c199208a9c656a29967810c4e428c22efb492fdd816e6a0a1e548
const OP_RETURN_TX = '0x010000000001011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000';
const OP_RETURN_PROOF = '0x48e5a1a0e616d8fd92b4ef228c424e0c816799a256c6a90892195ccfc53300d6e35a0d6de94b656694589964a252957e4673a9fb1d2f8b4a92e3f0a7bb654fddb94e5a1e6d7f7f499fd1be5dd30a73bf5584bf137da5fdd77cc21aeb95b9e35788894be019284bd4fbed6dd6118ac2cb6d26bc4be4e423f55a3a48f2874d8d02a65d9c87d07de21d4dfe7b0a9f4a23cc9a58373e9e6931fefdb5afade5df54c91104048df1ee999240617984e18b6f931e2373673d0195b8c6987d7ff7650d5ce53bcec46e13ab4f2da1146a7fc621ee672f62bc22742486392d75e55e67b09960c3386a0b49e75f1723d6ab28ac9a2028a0c72866e2111d79d4817b88e17c821937847768d92837bae3832bb8e5a4ab4434b97e00a6c10182f211f592409068d6f5652400d9a3d1cc150a7fb692e874cc42d76bdafc842f2fe0f835a7c24d2d60c109b187d64571efbaa8047be85821f8e67e0e85f2f5894bc63d00c2ed9d640296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c2';
const OP_RETURN_INDEX = 282;
const OP_RETURN_HEADER = '0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b';

// txid BE: b2e80a7f77eaca95c2e57938199022bddee0b0a56e0574f52e415ee907992654
const TWO_IN_TX = '0x010000000001027bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab3750000000000ffffffffaa15ec17524f1f7bd47ab7caa4c6652cb95eec4c58902984f9b4bcfee444567d0000000000ffffffff024db6000000000000160014455c0ea778752831d6fc25f6f8cf55dc49d335f040420f0000000000220020aedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c9192202483045022100d9fb1c15fe691c06dace09305bdd7e3cd19ada9c9392ca3a8c0a6f22a61c2ef002206efd72d89b6c1680d4135de14887a774ad0d6ad81dcd15833c3dc30b90a5ca86012102d0ec63b4c9f3d9e8083a0216c22d675f6f9a5b0bf1931f09a690e7e8bb24f63402483045022100fc7bf8811762a0c25c65deed711304ffd81413a347b656f45e38e3be40ecfcb8022077a020fda57e57062f99e2c0b714d251a879664bdb6dffcb04642182645470ea0121039b3e8cd31336f9ce7733885cf6d64433df129ce4c274b089825bf1419d047a4300000000';
const TWO_IN_PROOF = '0x54269907e95e412ef574056ea5b0e0debd2290193879e5c295caea777f0ae8b2602ac17ae2e219873600eb2b6fb301f31894121b475f19d394d92122de353e3e47254a20aa67eb76e73f284b11fb1d0e101100753d8ab7818961220cdd26860f756c859e76151b1d368a7f102649eca20ff00bf3e664a1dfa420af1f81077c94c8b9827f337f48d24a0f556bace3a35439451c788b4ba0453de5c8c3fd7e841003b7dd274c3b118e94b2286c725b61e72432a305593e91bf7c0fe1c423d4cb0a21a4fa31617fd9938a1b57649466837632a44faf6f36704a01a39a2e7a545ec3a1e6309f5aadca2171cac2beff0896c6a251c877ad42d1c414293bd7e36a02c5b5415b45f1a13f4a01926f28017ba01b2cca53ec53224acb2934d43499a83a18d3a0d186fe6c8e85faa6bde57b521af40617cb24d59b50933eda6d64a5d6ffc1b3cf4f35d6040e60a67c3f270ef7e237066cf2118d7767a6161ec4f1ff24ac70a2f0d7763665a84f267898e93e5ec693ddb4938aa2d9caca11b1462bc6b772a8743c578ec3d89fd330b90126d2f758e9319c4d3232aed3545bda2fbcb9d39af17209f58088422fc42c5849f910c29ec174fbf89bf4fb25b5600d024773ee5a5e';
const TWO_IN_INDEX = 782;
const TWO_IN_HEADER = '0x0000002044f2432df0e5b61161259717e975a0d9583f9536d53f020000000000000000007209f58088422fc42c5849f910c29ec174fbf89bf4fb25b5600d024773ee5a5e6c339c5ba1192817c6ed8f78';


describe('BTCUtils', () => {
    let btcUtilsContract;

    beforeEach(async() => {
        accounts = await web3.eth.getAccounts();

        btcUtilsContract = await new web3.eth.Contract(JSON.parse(compiledBTCUtils.interface))
            .deploy({ data: compiledBTCUtils.bytecode})
            .send({ from: accounts[0], gas: 2000000, gasPrice: 100000000000});

        assert.ok(btcUtilsContract.options.address);
    });

    it('gets the last bytes correctly', async () => {
        let res = await btcUtilsContract.methods.lastBytes('0x00112233', 2).call();
        assert.equal(res, '0x2233');
    });

    it('errors if slice is larger than the bytearray', async () => {
        utils.expectThrow(btcUtilsContract.methods.lastBytes('0x00', 2).call());
    });

    it('reverses endianness', async () => {
        let res = await btcUtilsContract.methods.reverseEndianness('0x00112233').call();
        assert.equal(res, '0x33221100');
        res = await btcUtilsContract.methods.reverseEndianness('0x0123456789abcdef').call();
        assert.equal(res, '0xefcdab8967452301');
    });

    it('converts big-endian bytes to integers', async () => {
        let res = await btcUtilsContract.methods.bytesToUint('0xff').call();
        assert.equal(res, 255);
        res = await btcUtilsContract.methods.bytesToUint('0x0100').call();
        assert.equal(res, 256);
    });

    it('implements bitcoin\'s hash160', async () => {
        let res;
        res = await btcUtilsContract.methods.hash160('0x1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111').call();
        assert.equal(res, '0xe723a0f62396b8b03dbd9e48e9b9efe2eb704aab');
        res = await btcUtilsContract.methods.hash160('0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000').call();
        assert.equal(res, '0x1b60c31dba9403c74d81af255f0c300bfed5faa3');
    });

    it('implements bitcoin\'s hash256', async () => {
        let res;
        res = await btcUtilsContract.methods.hash256('0x00').call();
        assert.equal(res, '0x1406e05881e299367766d313e26c05564ec91bf721d31726bd6e46e60689539a');
        res = await btcUtilsContract.methods.hash256('0x616263').call(); // 'abc' in utf-8
        assert.equal(res, '0x4f8b42c22dd3729b519ba6f68d2da7cc5b2d606d05daed5ad5128cc03e6c6358');
    });

    /* Witness Input */
    it('extracts a sequence from an input as LE and int', async () => {
        const input = '0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff';
        let res;
        res = await btcUtilsContract.methods.extractSequenceLE(input).call();
        assert.equal(res, '0xffffffff');
        res = await btcUtilsContract.methods.extractSequence(input).call();
        assert.equal(res, 0xffffffff);
    });

    it('extracts an outpoint as bytes', async () => {
        const input = '0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff';
        let res = await btcUtilsContract.methods.extractOutpoint(input).call();
        assert.equal(res, '0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000')
    });

    /* Witness Output */
    it('extracts the length of the output script', async () => {
        let res;
        const output = '0x4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c18';
        const opReturnOutput = '0x0000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211';
        res = await btcUtilsContract.methods.extractOutputScriptLen(output).call();
        assert.equal(res, '0x22');
        res = await btcUtilsContract.methods.extractOutputScriptLen(opReturnOutput).call();
        assert.equal(res, '0x16')
    });

    it('extracts the hash from an output', async () => {
        let res;
        const output = '0x4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c18';
        const opReturnOutput = '0x0000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211';
        res = await btcUtilsContract.methods.extractHash(output).call();
        assert.equal(res, '0xa4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c18');

        utils.expectThrow(btcUtilsContract.methods.extractHash(opReturnOutput).call());
    });

    it('extracts the value as LE and int', async () => {
        let res;
        const output = '0x4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c18';
        const opReturnOutput = '0x0000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211';
        res = await btcUtilsContract.methods.extractValueLE(output).call();
        assert.equal(res, '0x4897070000000000');
        res = await btcUtilsContract.methods.extractValue(output).call();
        assert.equal(res, 0x079748);
        res = await btcUtilsContract.methods.extractValueLE(opReturnOutput).call();
        assert.equal(res, '0x0000000000000000');
        res = await btcUtilsContract.methods.extractValue(opReturnOutput).call();
        assert.equal(res, 0x00);
    });

    it('extracts op_return data blobs', async () => {
        const output = '0x4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c18';
        const opReturnOutput = '0x0000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211';
        let res = await btcUtilsContract.methods.extractOpReturnData(opReturnOutput).call();
        assert.equal(res, '0xedb1b5c2f39af0fec151732585b1049b07895211');

        utils.expectThrow(btcUtilsContract.methods.extractOpReturnData(output).call())
    });

    it('extracts a locktime as LE bytes and integer', async () => {
        let res;
        res = await btcUtilsContract.methods.extractLocktime('0x00112233445566').call();
        assert.equal(res, 1716864051);
        res = await btcUtilsContract.methods.extractLocktimeLE('0x00112233445566').call();
        assert.equal(res, '0x33445566');
        res = await btcUtilsContract.methods.extractLocktime(OP_RETURN_TX).call();
        assert.equal(res, 0);
        res = await btcUtilsContract.methods.extractLocktimeLE(OP_RETURN_TX).call();
        assert.equal(res, '0x00000000');
    });

    it('finds the index of the number of outputs', async () => {
        let res;
        res = await btcUtilsContract.methods.findNumOutputs(OP_RETURN_TX).call();
        assert.equal(res, 48);
        res = await btcUtilsContract.methods.findNumOutputs(TWO_IN_TX).call();
        assert.equal(res, 89);
    });

    it('extracts the number of inputs', async () => {
        let res;
        res = await btcUtilsContract.methods.extractNumInputs(OP_RETURN_TX).call();
        assert.equal(res, 1);
        res = await btcUtilsContract.methods.extractNumInputs(TWO_IN_TX).call();
        assert.equal(res, 2);
    });

    it('extracts the number of outputs', async () => {
        let res;
        res = await btcUtilsContract.methods.extractNumOutputs(OP_RETURN_TX).call();
        assert.equal(res, 2);
        res = await btcUtilsContract.methods.extractNumOutputs(TWO_IN_TX).call();
        assert.equal(res, 2);
    });

    it('extracts inputs at specified indices', async () => {
        let res;
        res = await btcUtilsContract.methods.extractInputAtIndex(OP_RETURN_TX, 0).call();
        assert.equal(res, '0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff');
        res = await btcUtilsContract.methods.extractInputAtIndex(TWO_IN_TX, 0).call();
        assert.equal(res, '0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab3750000000000ffffffff');
        res = await btcUtilsContract.methods.extractInputAtIndex(TWO_IN_TX, 1).call();
        assert.equal(res, '0xaa15ec17524f1f7bd47ab7caa4c6652cb95eec4c58902984f9b4bcfee444567d0000000000ffffffff');
    });

    it('determines output length properly', async () => {
        let res;
        res = await btcUtilsContract.methods.determineOutputLength('0x2200').call();
        assert.equal(res, 43);
        res = await btcUtilsContract.methods.determineOutputLength('0x1600').call();
        assert.equal(res, 31);
        res = await btcUtilsContract.methods.determineOutputLength('0x206a').call();
        assert.equal(res, 41);
        res = await btcUtilsContract.methods.determineOutputLength('0x026a').call();
        assert.equal(res, 11);
    });

    it('extracts outputs at specified indices', async () => {
        let res;
        res = await btcUtilsContract.methods.extractOutputAtIndex(OP_RETURN_TX, 0).call();
        assert.equal(res, '0x4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c18');
        res = await btcUtilsContract.methods.extractOutputAtIndex(OP_RETURN_TX, 1).call();
        assert.equal(res, '0x0000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211');
        res = await btcUtilsContract.methods.extractOutputAtIndex(TWO_IN_TX, 0).call();
        assert.equal(res, '0x4db6000000000000160014455c0ea778752831d6fc25f6f8cf55dc49d335f0');
        res = await btcUtilsContract.methods.extractOutputAtIndex(TWO_IN_TX, 1).call();
        assert.equal(res, '0x40420f0000000000220020aedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c91922');
    });

    it('extracts a root from a header', async () => {
        let res = await btcUtilsContract.methods.extractMerkleRootBE(HEADER_170).call();
        assert.equal(res, '0x7dac2c5666815c17a3b36427de37bb9d2e2c5ccec3f8633eb91a4205cb4c10ff')
    });

    it('extracts the target from a header', async () => {
        let res = await btcUtilsContract.methods.extractTarget(HEADER_170).call();
        assert.equal(res, 26959535291011309493156476344723991336010898738574164086137773096960);
    });

    it('extracts the prev block hash', async () => {
        let res = await btcUtilsContract.methods.extractPrevBlockBE(HEADER_170).call();
        assert.equal(res, '0x000000002a22cfee1f2c846adbd12b3e183d4f97683f85dad08a79780a84bd55');
    });

    it('extracts a timestamp from a header', async () => {
        let res = await btcUtilsContract.methods.extractTimestamp(HEADER_170).call();
        assert.equal(res, 1231731025);
    });
})


describe('BlockHeader', () => {
    let headerContract;

    beforeEach(async() => {
        accounts = await web3.eth.getAccounts();

        bytesContract = await new web3.eth.Contract(JSON.parse(compiledBytes.interface))
            .deploy({ data: compiledBytes.bytecode})
            .send({ from: accounts[0], gas: 5000000, gasPrice: 100000000000});

        btcUtilsContract = await new web3.eth.Contract(JSON.parse(compiledBTCUtils.interface))
            .deploy({ data: compiledBTCUtils.bytecode})
            .send({ from: accounts[0], gas: 5000000, gasPrice: 100000000000});
        // Link
        bc = await linker.linkBytecode(compiledHeader.bytecode,
                    {'SPV.sol:BTCUtils': btcUtilsContract.options.address,
                     'BytesLib.sol:BytesLib': bytesContract.options.address});

        headerContract = await new web3.eth.Contract(JSON.parse(compiledHeader.interface))
            .deploy({ data: bc})
            .send({ from: accounts[0], gas: 2000000, gasPrice: 100000000000});

        assert.ok(headerContract.options.address);
    });

    it('verifies a bitcoin merkle root', async () => {
        let res;
        res = await headerContract.methods.verifyHash256Merkle(
            '0x82501c1178fa0b222c1f3d474ec726b832013f0a532b44bb620cce8624a5feb1169e1e83e930853391bc6f35f605c6754cfead57cf8387639d3b4096c54f18f4ff104ccb05421ab93e63f8c3ce5c2c2e9dbb37de2764b3a3175c8166562cac7d',
            1 // 1-indexed
        ).call();
        assert.ok(res);

        res = await headerContract.methods.verifyHash256Merkle(
            '0x169e1e83e930853391bc6f35f605c6754cfead57cf8387639d3b4096c54f18f482501c1178fa0b222c1f3d474ec726b832013f0a532b44bb620cce8624a5feb1ff104ccb05421ab93e63f8c3ce5c2c2e9dbb37de2764b3a3175c8166562cac7d',
            2 // 1-indexed
        ).call();
        assert.ok(res);

        res = await headerContract.methods.verifyHash256Merkle(
            '0x6c1320f4552ba68f3dbdd91f9422405f779b779e21678448e8035c21c1e2edd67a6190a846e318878be71565841d90a78e9e617b2d859d5e0767c13de427be4a2a6a6d55b17316d45ac11c4e613c38b293db606bace5062470d783471cc66c180455e6472ce92d32179994c3d44b75dd9834e1e7438cf9ab5be1ef6edf1e4a8d361dda470aca6e97c3b4056d4b329beba9ffd6a26c86a2a3f8f9ad31826b69ee49693027a439b3149853907afe87031f3bcf484b8bdd2e047d579d2ee2569c16769a33473b652d1d365886f9f9fba64fdea23ab16306ae1484ed632dcd381e5132c401084bc783478306202844b9cf34aff6ab24182206caa6eebc3e016fa373986d08ac9ae256ddda2deedc6662fd8f8a300ecdd38db2c5d6d2765a7515531e7f96f0310f9493cf79be3e60f63d8a6fa0c62ea59312731fd5b71b261abd99f5b908b3166d53532c9557a0f6ce9bc18f7b7619b2257043052a7ff2e5030e838f2e9edcc0f7273fa273a6b3ce2112dbd686f060b5f61deb1abc7247edf1bd6cd7ca4a6c5cfaedbc5905ef4f0511b143a0672ce4fa2dc1ed8852e077e0184febca',
            5 // 1-indexed
        ).call();
        assert.ok(res);

        res = await headerContract.methods.verifyHash256Merkle(OP_RETURN_PROOF, OP_RETURN_INDEX).call();
        assert.ok(res);

        res = await headerContract.methods.verifyHash256Merkle(TWO_IN_PROOF, TWO_IN_INDEX).call();
        assert.ok(res);
    });
});
