pragma solidity ^0.5.10;

/** @title BitcoinSPV */
/** @author Summa (https://summa.one) */

import {ViewBTC} from "../ViewBTC.sol";

contract ViewBTCTest {

    using ViewBTC for bytes memory;
    using ViewBTC for bytes29;


    function indexVarInt(bytes memory _b) public pure returns (uint64) {
        return parseVarInt(_b.ref(0).parseVarInt(0);
    }

    function hash160(bytes memory _b) public pure returns (bytes20) {
        return _b.ref().hash160();
    }

    function hash256(bytes memory _b) public pure returns (bytes32) {
        return _b.ref().hash256();
    }

    function indexVin(bytes memory _vin, uint256 _index) public pure returns (bytes memory) {
        return ViewBTC.extractInputAtIndex(_vin, _index);
    }

    function isLegacyInput(bytes memory _input) public pure returns (bool) {
        return ViewBTC.isLegacyInput(_input);
    }

    function determineInputLength(bytes memory _input) public pure returns (uint256) {
        return ViewBTC.determineInputLength(_input);
    }

    function extractSequenceLELegacy(bytes memory _input) public pure returns (bytes memory) {
        return ViewBTC.extractSequenceLELegacy(_input);
    }

    function extractSequenceLegacy(bytes memory _input) public pure returns (uint32) {
        return ViewBTC.extractSequenceLegacy(_input);
    }
    function extractScriptSig(bytes memory _input) public pure returns (bytes memory) {
        return ViewBTC.extractScriptSig(_input);
    }

    function extractScriptSigLen(bytes memory _input) public pure returns (uint256, uint256) {
        return ViewBTC.extractScriptSigLen(_input);
    }


    /* ************* */
    /* Witness Input */
    /* ************* */

    function extractSequenceLEWitness(bytes memory _input) public pure returns (bytes memory) {
        return ViewBTC.extractSequenceLEWitness(_input);
    }


    function extractSequenceWitness(bytes memory _input) public pure returns (uint32) {
        return ViewBTC.extractSequenceWitness(_input);
    }

    function extractOutpoint(bytes memory _input) public pure returns (bytes memory) {
        return ViewBTC.extractOutpoint(_input);
    }


    function extractInputTxIdLE(bytes memory _input) public pure returns (bytes32) {
        return ViewBTC.extractInputTxIdLE(_input);
    }

    function extractTxIndexLE(bytes memory _input) public pure returns (bytes memory) {
        return ViewBTC.extractTxIndexLE(_input);
    }


    /* ****** */
    /* Output */
    /* ****** */

    function determineOutputLength(bytes memory _output) public pure returns (uint256) {
        return ViewBTC.determineOutputLength(_output);
    }

    function extractOutputAtIndex(bytes memory _vout, uint256 _index) public pure returns (bytes memory) {
        return ViewBTC.extractOutputAtIndex(_vout, _index);
    }

    function extractOutputScriptLen(bytes memory _output) public pure returns (bytes memory) {
        return ViewBTC.extractOutputScriptLen(_output);
    }

    function extractValueLE(bytes memory _output) public pure returns (bytes memory) {
        return ViewBTC.extractValueLE(_output);
    }

    function extractValue(bytes memory _output) public pure returns (uint64) {
        return ViewBTC.extractValue(_output);
    }

    function extractOpReturnData(bytes memory _output) public pure returns (bytes memory) {
        return ViewBTC.extractOpReturnData(_output);
    }

    function extractHash(bytes memory _output) public pure returns (bytes memory) {
        return ViewBTC.extractHash(_output);
    }

    function validateVin(bytes memory _vin) public pure returns (bool) {
        return ViewBTC.validateVin(_vin);
    }

    function validateVout(bytes memory _vout) public pure returns (bool) {
        return ViewBTC.validateVout(_vout);
    }

    function extractMerkleRootLE(bytes memory _header) public pure returns (bytes memory) {
        return ViewBTC.extractMerkleRootLE(_header);
    }

    function extractTarget(bytes memory _header) public pure returns (uint256) {
        return ViewBTC.extractTarget(_header);
    }

    function calculateDifficulty(uint256 _target) public pure returns (uint256) {
        return ViewBTC.calculateDifficulty(_target);
    }

    function extractPrevBlockLE(bytes memory _header) public pure returns (bytes memory) {
        return ViewBTC.extractPrevBlockLE(_header);
    }

    function extractTimestampLE(bytes memory _header) public pure returns (bytes memory) {
        return ViewBTC.extractTimestampLE(_header);
    }

    function extractTimestamp(bytes memory _header) public pure returns (uint32) {
        return ViewBTC.extractTimestamp(_header);
    }

    function extractDifficulty(bytes memory _header) public pure returns (uint256) {
        return ViewBTC.extractDifficulty(_header);
    }


    function verifyHash256Merkle(bytes memory _proof, uint _index) public pure returns (bool) {
        bytes29 _nodes = _b.slice(32, _proof.length - 64);
        bytes32 _leaf = _b.index(0, 32);
        bytes32 _root = _b.index(_proof.length - 32, 32);
        return ViewBTC.checkMerkle(_leaf, _proof, _root, _index);
    }

    function retargetAlgorithm(
        uint256 _previousTarget,
        uint256 _firstTimestamp,
        uint256 _secondTimestamp
    ) public pure returns (uint256) {
        return ViewBTC.retargetAlgorithm(_previousTarget, _firstTimestamp, _secondTimestamp);
    }
}
