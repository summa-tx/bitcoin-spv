pragma solidity ^0.5.10;

/** @title CheckBitcoinSigs */
/** @author Summa (https://summa.one) */

import {BytesLib} from "./BytesLib.sol";
import {BTCUtils} from "./BTCUtils.sol";


library CheckBitcoinSigs {

    using BytesLib for bytes;
    using BTCUtils for bytes;

    /// @notice          derives an Ethereum Account address from a pubkey
    /// @dev             the address is the last 20 bytes of the keccak256 of the address
    /// @param _pubkey   the public key
    /// @return          the account address
    function accountFromPubkey(bytes memory _pubkey) public pure returns (address) {
        require(_pubkey.length == 64);

        // keccak hash of uncompressed unprefixed pubkey
        bytes memory _digest = abi.encodePacked(keccak256(_pubkey));
        return _digest.toAddress(_digest.length - 20);  // last 20 bytes
    }

    /// @notice          calculates the p2wpkh output script of a pubkey
    /// @dev             pads uncompressed pubkeys to 65 bytes as required by Bitcoin
    /// @param _pubkey   the public key
    /// @return          the p2wkph output script
    function p2wpkhFromPubkey(bytes memory _pubkey) public pure returns (bytes memory) {
        if (_pubkey.length == 64) {
            _pubkey = abi.encodePacked(hex'04', _pubkey);
        }
        require(_pubkey.length == 65);  // prefixed uncompressed

        bytes memory _pubkeyHash = _pubkey.hash160();
        return abi.encodePacked(hex'0014', _pubkeyHash);
    }

    /// @notice          checks a signed message's validity under a pubkey
    /// @dev             does this using ecrecover because Ethereum has no soul
    /// @param _pubkey   the public key to check (64 bytes)
    /// @param _digest   the message digest signed
    /// @param _v        the signature recovery value
    /// @param _r        the signature r value
    /// @param _s        the signature s value
    /// @return          true if signature is valid, else false
    function checkSig(
        bytes memory _pubkey,
        bytes32 _digest,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public pure returns (bool) {
        address _expected = accountFromPubkey(_pubkey);
        address _actual = ecrecover(_digest, _v, _r, _s);
        return _actual == _expected;
    }

    /// @notice                     checks a signed message against a bitcoin p2wpkh output script
    /// @dev                        does this my verifying the p2wpkh matches an ethereum account
    /// @param _p2wpkhOutputScript  the bitcoin output script
    /// @param _pubkey              the public key to check
    /// @param _digest              the message digest signed
    /// @param _v                   the signature recovery value
    /// @param _r                   the signature r value
    /// @param _s                   the signature s value
    /// @return                     true if signature is valid, else false
    function checkBitcoinSig(
        bytes memory _p2wpkhOutputScript,
        bytes memory _pubkey,
        bytes32 _digest,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public pure returns (bool) {
        bool _isExpectedSigner = keccak256(p2wpkhFromPubkey(_pubkey)) == keccak256(_p2wpkhOutputScript);  // is it the expected signer?
        bytes memory _truncatedPubkey = _pubkey.slice(1, _pubkey.length - 1);  // slice off the 04 prefix
        bool _sigResult = checkSig(_truncatedPubkey, _digest, _v, _r, _s);
        return (_isExpectedSigner && _sigResult);
    }

    /// @notice             checks if a message is the sha256 preimage of a digest
    /// @dev                this is NOT the hash256!  this step is necessary for ECDSA security!
    /// @param _digest      the digest
    /// @param _candidate   the purported preimage
    /// @return             the p2wkph output script
    function isSha256Preimage(
        bytes memory _candidate,
        bytes32 _digest
    ) public pure returns (bool) {
        return sha256(_candidate) == _digest;
    }

    /// @notice             checks if a message is the keccak256 preimage of a digest
    /// @dev                this step is necessary for ECDSA security!
    /// @param _digest      the digest
    /// @param _candidate   the purported preimage
    /// @return             the p2wkph output script
    function isKeccak256Preimage(
        bytes memory _candidate,
        bytes32 _digest
    ) public pure returns (bool) {
        return keccak256(_candidate) == _digest;
    }


    /// @notice                 calculates the signature hash of a Bitcoin transaction with the provided details
    /// @dev                    documented in bip143. many values are hardcoded here
    /// @param _outpoint        the bitcoin output script
    /// @param _inputPKH        the input pubkeyhash (hash160(sender_pubkey))
    /// @param _inputValue      the value of the input in satoshi
    /// @param _outputValue     the value of the output in satoshi
    /// @param _outputPKH       the output pubkeyhash (hash160(recipient_pubkey))
    /// @return                 the double-sha256 (hash256) signature hash as defined by bip143
    function oneInputOneOutputSighash(
        bytes memory _outpoint,  // 36 byte UTXO id
        bytes20 _inputPKH,  // 20 byte hash160
        bytes8 _inputValue,  // 8-byte LE
        bytes8 _outputValue,  // 8-byte LE
        bytes20 _outputPKH  // 20 byte hash160
    ) public pure returns (bytes32) {
        // Fixes elements to easily make a 1-in 1-out sighash digest
        // Does not support timelocks
        bytes memory _scriptCode = abi.encodePacked(
            hex"1976a914",  // length, dup, hash160, pkh_length
            _inputPKH,
            hex"88ac");  // equal, checksig
        bytes32 _hashOutputs = abi.encodePacked(
            _outputValue,  // 8-byte LE
            hex"160014",  // this assumes p2wpkh
            _outputPKH).hash256();
        bytes memory _sighashPreimage = abi.encodePacked(
            hex"01000000",  // version
            _outpoint.hash256(),  // hashPrevouts
            hex"8cb9012517c817fead650287d61bdd9c68803b6bf9c64133dcab3e65b5a50cb9",  // hashSequence(00000000)
            _outpoint,  // outpoint
            _scriptCode,  // p2wpkh script code
            _inputValue,  // value of the input in 8-byte LE
            hex"00000000",  // input nSequence
            _hashOutputs,  // hash of the single output
            hex"00000000",  // nLockTime
            hex"01000000"  // SIGHASH_ALL
        );
        return _sighashPreimage.hash256();
    }
}
