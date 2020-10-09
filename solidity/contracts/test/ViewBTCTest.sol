pragma solidity ^0.5.10;

/** @title BitcoinSPV */
/** @author Summa (https://summa.one) */

import {TypedMemView} from "@summa-tx/memview.sol/contracts/TypedMemView.sol";
import {ViewBTC} from "../ViewBTC.sol";

contract ViewBTCTest {

    using TypedMemView for bytes;
    using TypedMemView for bytes29;
    using ViewBTC for bytes29;

    function encodeHex(uint256 _b) public pure returns (uint256, uint256) {
        return TypedMemView.encodeHex(_b);
    }

    function indexVarInt(bytes memory _b) public pure returns (uint64) {
        return _b.ref(0).indexCompactInt(0);
    }

    function hash160(bytes memory _b) public view returns (bytes20) {
        return _b.ref(0).hash160();
    }

    function hash256(bytes memory _b) public view returns (bytes32) {
        return _b.ref(0).hash256();
    }

    function indexVin(bytes memory _vin, uint256 _index) public view returns (bytes memory) {
        return _vin.ref(0).tryAsVin().assertValid().indexVin(_index).clone();
    }

    function inputLength(bytes memory _input) public pure returns (uint256) {
        return _input.ref(uint40(ViewBTC.BTCTypes.IntermediateTxIns)).inputLength();
    }

    function sequence(bytes memory _input) public pure returns (uint32) {
        return _input.ref(uint40(ViewBTC.BTCTypes.TxIn)).sequence();

    }
    function scriptSig(bytes memory _input) public view returns (bytes memory) {
        return _input.ref(uint40(ViewBTC.BTCTypes.TxIn)).scriptSig().clone();
    }

    function scriptPubkey(bytes memory _output) public view returns (bytes memory) {
        return _output.ref(uint40(ViewBTC.BTCTypes.TxOut)).scriptPubkey().clone();
    }

    function outpoint(bytes memory _input) public view returns (bytes memory) {
        return _input.ref(uint40(ViewBTC.BTCTypes.TxIn)).outpoint().clone();
    }

    function outpointIdx(bytes memory _input) public pure returns (uint32) {
        return _input.ref(uint40(ViewBTC.BTCTypes.TxIn)).outpoint().outpointIdx();
    }

    function txidLE(bytes memory _input) public pure returns (bytes32) {
        return _input.ref(uint40(ViewBTC.BTCTypes.TxIn)).outpoint().txidLE();
    }

    function outputLength(bytes memory _output) public pure returns (uint256) {
        return _output.ref(uint40(ViewBTC.BTCTypes.IntermediateTxOuts)).outputLength();
    }

    function indexVout(bytes memory _vout, uint256 _index) public view returns (bytes memory) {
        return _vout.ref(0).tryAsVout().assertValid().indexVout(_index).clone();
    }

    function valueBytes(bytes memory _output) public pure returns (bytes8) {
        return _output.ref(uint40(ViewBTC.BTCTypes.TxOut)).valueBytes();
    }

    function extractValue(bytes memory _output) public pure returns (uint64) {
        return _output.ref(uint40(ViewBTC.BTCTypes.TxOut)).value();
    }

    function opReturnPayload(bytes memory _output) public view returns (bytes memory) {
        // the argument is a txout. we want to slice off the first 8 bytes (the value)
        bytes29 v = _output.ref(0);
        bytes29 res = v.postfix(v.len() - 8, uint40(ViewBTC.BTCTypes.ScriptPubkey)).opReturnPayload();
        bytes memory nullVal;
        if (res.isNull()) {return nullVal;}
        return res.clone();
    }

    function payload(bytes memory _output) public view returns (bytes memory) {
        // the argument is a txout. we want to slice off the first 8 bytes (the value)
        bytes29 v = _output.ref(0);
        bytes29 res = v.postfix(v.len() - 8, uint40(ViewBTC.BTCTypes.ScriptPubkey)).payload();
        bytes memory nullVal;
        if (res.isNull()) {return nullVal;}
        return res.clone();
    }

    function tryAsVin(bytes memory _vin) public pure returns (bool) {
        return _vin.ref(0).tryAsVin().isValid();
    }

    function tryAsVout(bytes memory _vout) public pure returns (bool) {
        return _vout.ref(0).tryAsVout().isValid();
    }

    function merkleRoot(bytes memory _header) public pure returns (bytes32) {
        return _header.ref(0).tryAsHeader().assertValid().merkleRoot();
    }

    function target(bytes memory _header) public pure returns (uint256) {
        return _header.ref(0).tryAsHeader().assertValid().target();
    }

    function diff(bytes memory _header) public pure returns (uint256) {
        return _header.ref(0).tryAsHeader().assertValid().diff();
    }

    function time(bytes memory _header) public pure returns (uint256) {
        return _header.ref(0).tryAsHeader().assertValid().time();
    }

    function parent(bytes memory _header) public pure returns (bytes32) {
        return _header.ref(0).tryAsHeader().assertValid().parent();
    }

    function work(bytes memory _header) public view returns (uint256) {
        return _header.ref(0).tryAsHeader().assertValid().work();
    }

    function workHash(bytes memory _header) public view returns (bytes32) {
        return _header.ref(0).tryAsHeader().assertValid().workHash();
    }

    function verifyHash256Merkle(bytes memory _proof, uint _index) public view returns (bool) {
        bytes29 _proof_ref = _proof.ref(0).tryAsMerkleArray();
        bytes29 _nodes;
        bytes32 _leaf;
        bytes32 _root;

        if (_proof.length == 32) {
            _nodes = _nodes.castTo(uint40(ViewBTC.BTCTypes.MerkleArray));
            _leaf = _proof_ref.index(0,32);
            _root = _proof_ref.index(0,32);
        } else if (!_proof_ref.isValid() || _proof.length < 64) {
            return false;
        } else {
            _nodes = _proof_ref.slice(32, _proof.length - 64, 0).tryAsMerkleArray().assertValid();
            _leaf = _proof_ref.index(0, 32);
            _root = _proof_ref.index(_proof.length - 32, 32);
        }

        return ViewBTC.checkMerkle(_leaf, _nodes, _root, _index);
    }

    function retargetAlgorithm(
        uint256 _previousTarget,
        uint256 _firstTimestamp,
        uint256 _secondTimestamp
    ) public pure returns (uint256) {
        return ViewBTC.retargetAlgorithm(_previousTarget, _firstTimestamp, _secondTimestamp);
    }
}
