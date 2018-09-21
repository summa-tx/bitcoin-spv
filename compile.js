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


let input = {
    'SPVStore.sol': fs.readFileSync(SPVStorePath, 'utf8'),
    'BTCUtils.sol': fs.readFileSync(BTCUtilsPath, 'utf8'),
    'ValidateSPV.sol': fs.readFileSync(ValidateSPVPath, 'utf8'),
    'BytesLib.sol': fs.readFileSync(BytesPath, 'utf8'),
    'SafeMath.sol': fs.readFileSync(SafeMathPath, 'utf8')
}

const output = solc.compile({sources: input}, 1);

// log errors
if (output.errors) {
    console.log(output.errors);
}

// Save compiled contracts to json files
for (let contract in output.contracts) {
    contract_name = contract.split(':');
    fs.outputJsonSync(
        path.resolve(buildPath, contract_name[1] + '.json'),
        output.contracts[contract]
    )
}
