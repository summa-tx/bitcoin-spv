const path = require('path')
const solc = require('solc')
const fs = require('fs-extra')

// Path to compiled json contracts
const buildPath = path.resolve(__dirname, 'build')
fs.removeSync(buildPath)
fs.ensureDirSync(buildPath)

// Paths to solidity contracts
const SPVStorePath = path.resolve(__dirname, 'contracts', 'SPVStore.sol')
const BTCUtilsPath = path.resolve(__dirname, 'contracts', 'BTCUtils.sol')
const ValidateSPVPath = path.resolve(__dirname, 'contracts', 'ValidateSPV.sol')
const BytesPath = path.resolve(__dirname, 'contracts', 'BytesLib.sol')
const SafeMathPath = path.resolve(__dirname, 'contracts', 'SafeMath.sol')
const SigCheckPath = path.resolve(__dirname, 'contracts', 'SigCheck.sol')

let sources = {
    'SPVStore.sol': {
        content: fs.readFileSync(SPVStorePath, 'utf8')
    },
    'BTCUtils.sol': {
        content: fs.readFileSync(BTCUtilsPath, 'utf8')
    },
    'ValidateSPV.sol': {
        content: fs.readFileSync(ValidateSPVPath, 'utf8')
    },
    'BytesLib.sol': {
        content: fs.readFileSync(BytesPath, 'utf8')
    },
    'SafeMath.sol': {
        content: fs.readFileSync(SafeMathPath, 'utf8')
    },
    'SigCheck.sol': {
        content: fs.readFileSync(SigCheckPath, 'utf8')
    }
}

var input = {
    language: 'Solidity',
    sources: sources,
    settings: {
        outputSelection: {
            '*': {
                '*': ['*'],
            },
        },
    },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)))

// log errors
if (output.errors) {
    console.error(output.errors);
}

// Save compiled contracts to json files
for (let contract in output.contracts) {
    let fileName = contract.split('.sol')[0];
    let contractName = Object.keys(output.contracts[contract])[0]

    fs.outputJsonSync(
        path.resolve(buildPath, fileName + '.json'),
        output.contracts[contract][contractName]
    )
}
