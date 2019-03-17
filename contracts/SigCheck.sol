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
}
