pragma solidity 0.4.25;

/** @title CheckBitcoinSigs */
/** @author Summa (https://summa.one) */

import {BytesLib} from "./BytesLib.sol";
import {BTCUtils} from "./BTCUtils.sol";


contract CheckBitcoinSigs {

    using BytesLib for bytes;
    using BTCUtils for bytes;

    function accountFromPubkey(bytes _pubkey) public pure returns (address) {
        require(_pubkey.length == 64);

        // keccak hash of uncompressed unprefixed pubkey
        bytes memory _digest = abi.encodePacked(keccak256(_pubkey));
        return _digest.toAddress(_digest.length - 20);  // last 20 bytes
    }

    function p2wpkhFromPubkey(bytes _pubkey) public pure returns (bytes) {
        require(_pubkey.length == 65);  // prefixed uncompressed

        bytes memory _pubkeyHash = _pubkey.hash160();
        return abi.encodePacked(hex"00", hex"14", _pubkeyHash);
    }

    function checkSig(
        bytes _pubkey,
        bytes32 _digest,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public pure returns (bool) {
        address _expected = accountFromPubkey(_pubkey);
        address _actual = ecrecover(_digest, _v, _r, _s);
        return _actual == _expected;
    }

    function checkBitcoinSig(
        bytes _p2wpkhOutputScript,
        bytes _pubkey,
        bytes32 _digest,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public pure returns (bool) {
        bool _isExpected = p2wpkhFromPubkey(_pubkey).equal(_p2wpkhOutputScript);  // is it the expected signer?
        bytes memory _truncatedPubkey = _pubkey.slice(1, _pubkey.length - 1);  // slice off the 04 prefix
        bool _sigResult = checkSig(_truncatedPubkey, _digest, _v, _r, _s);
        return (_isExpected && _sigResult);
    }

    function isSha256Preimage(
        bytes32 _digest,
        bytes _candidate
    ) public pure returns (bool) {
        return sha256(_candidate) == _digest;
    }

    function oneInputOneOutputSighash(
        bytes _outpoint,  // 36 byte UTXO id
        bytes _inputPKH,  // 20 byte hash160
        bytes _inputValue,  // 8-byte LE
        bytes _outputValue,  // 8-byte LE
        bytes _outputPKH  // 20 byte hash160
    ) public pure returns (bytes32) {
        // Fixes elements to easily make a 1-in 1-out sighash digest
        // Does not support timelocks
        bytes _scriptCode = abi.encodePacked(
            hex"1976a914",  // length, dup, hash160, pkh_length
            _outputPKH,
            hex"88ac");  // equal, checksig
        bytes _hashOutputs = abi.encodePacked(
            _outputValue,  // 8-byte LE
            hex"160014",  // this assumes p2wpkh
            _outputPKH).hash256();
        bytes _sighashPreimage = abi.encodePacked(
            hex"01000000",  // version
            _outpoint.hash256(),  // hashPrevouts
            hex"8cb9012517c817fead650287d61bdd9c68803b6bf9c64133dcab3e65b5a50cb9",  // hashSequence
            _outpoint,  // outpoint
            _scriptCode,  // p2wpkh script code
            _inputValue,  // value of the input in 8-byte LE
            hex"00000000",  // input nSequence
            _hashOutputs,  // hash of the single output
            hex"00000000",  //
            hex"01000000"  // SIGHASH_ALL
        );
        return _sighashPreimage.hash256();
    }
}
