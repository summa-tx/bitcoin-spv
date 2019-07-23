pragma solidity ^0.5.10;

/** @title BitcoinSPV */
/** @author Summa (https://summa.one) */

import {BTCUtils} from "./BTCUtils.sol";

contract BTCUtilsDelegate {

    using BTCUtils for bytes;

    function extractPrefix(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractPrefix();
    }

    function reverseEndianness(bytes memory _b) public pure returns (bytes memory) {
        return _b.reverseEndianness();
    }

    function bytesToUint(bytes memory _b) public pure returns (uint256) {
        return _b.bytesToUint();
    }

    function lastBytes(bytes memory _b, uint256 _num) public pure returns (bytes memory) {
        return _b.lastBytes(_num);
    }

    function hash160(bytes memory _b) public pure returns (bytes memory) {
        return _b.hash160();
    }

    function hash256(bytes memory _b) public pure returns (bytes32) {
        return _b.hash256();
    }

    function extractSequenceLE(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractSequenceLE();
    }

    function extractSequence(bytes memory _b) public pure returns (uint32) {
        return _b.extractSequence();
    }

    function extractOutpoint(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractOutpoint();
    }

    function extractTxIdLE(bytes memory _b) public pure returns (bytes32) {
        return _b.extractTxIdLE();
    }

    function extractTxId(bytes memory _b) public pure returns (bytes32) {
        return _b.extractTxId();
    }

    function extractTxIndexLE(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractTxIndexLE();
    }

    function extractTxIndex(bytes memory _b) public pure returns (uint32) {
        return _b.extractTxIndex();
    }

    function extractOutputScriptLen(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractOutputScriptLen();
    }

    function extractValueLE(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractValueLE();
    }

    function extractValue(bytes memory _b) public pure returns (uint64) {
        return _b.extractValue();
    }

    function extractOpReturnData(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractOpReturnData();
    }

    function extractHash(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractHash();
    }

    function extractLocktimeLE(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractLocktimeLE();
    }

    function extractLocktime(bytes memory _b) public pure returns (uint32) {
        return _b.extractLocktime();
    }

    function extractNumInputsBytes(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractNumInputsBytes();
    }

    function extractNumInputs(bytes memory _b) public pure returns (uint8) {
        return _b.extractNumInputs();
    }

    function findNumOutputs(bytes memory _b) public pure returns (uint256) {
        return _b.findNumOutputs();
    }

    function extractNumOutputsBytes(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractNumOutputsBytes();
    }

    function extractNumOutputs(bytes memory _b) public pure returns (uint8) {
        return _b.extractNumOutputs();
    }

    function extractInputAtIndex(bytes memory _b, uint8 _index) public pure returns (bytes memory) {
        return _b.extractInputAtIndex(_index);
    }

    function determineOutputLength(bytes memory _b) public pure returns (uint256) {
        return _b.determineOutputLength();
    }

    function extractOutputAtIndex(bytes memory _b, uint8 _index) public pure returns (bytes memory) {
        return _b.extractOutputAtIndex(_index);
    }

    function extractMerkleRootLE(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractMerkleRootLE();
    }

    function extractMerkleRootBE(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractMerkleRootBE();
    }

    function extractTarget(bytes memory _b) public pure returns (uint256) {
        return _b.extractTarget();
    }

    function calculateDifficulty(uint256 _target) public pure returns (uint256) {
        return BTCUtils.calculateDifficulty(_target);
    }

    function extractPrevBlockLE(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractPrevBlockLE();
    }

    function extractPrevBlockBE(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractPrevBlockBE();
    }

    function extractTimestampLE(bytes memory _b) public pure returns (bytes memory) {
        return _b.extractTimestampLE();
    }

    function extractTimestamp(bytes memory _b) public pure returns (uint32) {
        return _b.extractTimestamp();
    }

    function _hash256MerkleStep(bytes memory _a, bytes memory _b) public pure returns (bytes32) {
        return _a._hash256MerkleStep(_b);
    }

    function verifyHash256Merkle(bytes memory _a, uint _index) public pure returns (bool) {
        return _a.verifyHash256Merkle(_index);
    }
}
