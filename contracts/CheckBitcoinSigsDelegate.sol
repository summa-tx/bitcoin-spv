pragma solidity ^0.5.10;

/** @title ValidateSPV*/
/** @author Summa (https://summa.one) */

import {CheckBitcoinSigs} from "./CheckBitcoinSigs.sol";

contract CheckBitcoinSigsDelegate {

    function accountFromPubkey(bytes memory _pubkey) public pure returns (address) {
        return CheckBitcoinSigs.accountFromPubkey(_pubkey);
    }

    function p2wpkhFromPubkey(bytes memory _pubkey) public pure returns (bytes memory) {
        return CheckBitcoinSigs.p2wpkhFromPubkey(_pubkey);
    }

    function checkSig(
        bytes memory _pubkey,
        bytes32 _digest,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public pure returns (bool) {
        return CheckBitcoinSigs.checkSig(_pubkey, _digest, _v, _r, _s);
    }

    function checkBitcoinSig(
        bytes memory _p2wpkhOutputScript,
        bytes memory _pubkey,
        bytes32 _digest,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public pure returns (bool) {
        return CheckBitcoinSigs.checkBitcoinSig(
            _p2wpkhOutputScript,
            _pubkey,
            _digest,
            _v,
            _r,
            _s);
    }
    function isSha256Preimage(
        bytes memory _candidate,
        bytes32 _digest
    ) public pure returns (bool) {
        return CheckBitcoinSigs.isSha256Preimage(_candidate, _digest);
    }

    function isKeccak256Preimage(
        bytes memory _candidate,
        bytes32 _digest
    ) public pure returns (bool) {
        return CheckBitcoinSigs.isKeccak256Preimage(_candidate, _digest);
    }

    function oneInputOneOutputSighash(
        bytes memory _outpoint,  // 36 byte UTXO id
        bytes20 _inputPKH,  // 20 byte hash160
        bytes8 _inputValue,  // 8-byte LE
        bytes8 _outputValue,  // 8-byte LE
        bytes20 _outputPKH  // 20 byte hash160
    ) public pure returns (bytes32) {
        return CheckBitcoinSigs.oneInputOneOutputSighash(
            _outpoint,
            _inputPKH,
            _inputValue,
            _outputValue,
            _outputPKH);
    }

}
