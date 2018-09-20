pragma solidity ^0.4.24;

/** @title BitcoinSPV */
/** @author Summa (https://summa.one) */

import {BytesLib} from "./BytesLib.sol";
import {SafeMath} from "./SafeMath.sol";

library BTCUtils {

    using BytesLib for bytes;
    using SafeMath for uint256;

    // @notice      Changes the endianness of a byte array
    // @dev         Returns a new, backwards, bytes
    // @param _b    The bytes to reverse
    // @returns     The reversed bytes
    function reverseEndianness(
        bytes _b
    ) pure public returns (bytes) {
        bytes memory _newValue = new bytes(_b.length);

        for(uint i=0;i<_b.length;i++){
            _newValue[ _b.length - i - 1] = _b[i];
        }

        return _newValue;
    }

    // @notice      Converts big-endian bytes to a uint
    // @dev         Traverses the byte array and sums the bytes
    // @param _b    The big-endian bytes-encoded integer
    // @returns     The integer representation
    function bytesToUint(
        bytes b
    ) pure public returns (uint256) {
        uint256 number;
        for(uint i=0; i<b.length; i++){
            number = number + uint(b[i])*(2**(8*(b.length-(i+1))));
        }
        return number;
    }

    // @notice      Get the last _num bytes from a byte array
    // @param _b    The byte array to slice
    // @param _num  The number of bytes to extract from the end
    // @return      The last _num bytes of _b
    function lastBytes(
        bytes _b,
        uint256 _num
    ) pure public returns (bytes) {
        uint256 _start = _b.length.sub(_num);
        return _b.slice(_start, _num);
    }

    // @notice      Implements bitcoin's hash160 (rmd160(sha2()))
    // @dev         abi.encodePacked changes the return to bytes instead of bytes32
    // @param _b    The pre-image
    // @returns     The digest
    function hash160(
        bytes _b
    ) pure public returns (bytes) {
        return abi.encodePacked(ripemd160(sha256(_b)));
    }

    // @notice      Implements bitcoin's hash256 (double sha2)
    // @dev         abi.encodePacked changes the return to bytes instead of bytes32
    // @param _b    The pre-image
    // @returns     The digest
    function hash256(
        bytes _b
    ) pure public returns (bytes) {
        return abi.encodePacked(sha256(sha256(_b)));
    }
}

library WitnessInput {

    // NB: A WitnessInput is always 41 bytes:
    // ( 0 - 31)     32 byte LE txid
    // (32 - 35)      4 byte LE index
    // (36 - 36)      1 byte empty scriptsig
    // (37 - 40)      4 byte LE sequence

    using BytesLib for bytes;
    using BTCUtils for bytes;
    using SafeMath for uint256;

    // @notice      Extracts the LE sequence bytes from an input
    // @dev         Sequence is used for relative time locks
    // @param _b    The input
    // @returns     The sequence bytes (LE uint)
    function extractSequenceLE(
        bytes _b
    ) pure public returns (bytes) {
        return _b.slice(37, 4);
    }

    // @notice      Extracts the sequence from the input in a tx
    // @dev         Sequence is a 4-byte little-endian number
    // @param _b    The input
    // @returns     The sequence number
    function extractSequence(
        bytes _b
    ) pure public returns (uint32) {
        return uint32(
            extractSequenceLE(_b).reverseEndianness().bytesToUint());
    }

    // @notice      Extracts the outpoint from the input in a tx
    // @dev         36 byte tx id with 4 byte index
    // @param _b    The input
    // @returns     The outpoint (bytes)
    function extractOutpoint(
        bytes _b
    ) pure public returns (bytes) {
        return _b.slice(0, 36);
    }
}

library WitnessOutput {

    // NB: A WitnessOutput is always 31 or 43 bytes:
    // ( 0 -  7)      8 byte LE value
    // ( 8 - 10)      3 byte prefix 0x160014 or 0x220020
    // (11 - 30/42)  20 or 32 byte hash

    // NB: An OP_RETURN output is variable length
    // ( 0 -  7)      8 byte LE value
    // ( 8 - 10)      3 byte prefix (XX6AXX)
    // (11 - ??)      X byte hash

    using BytesLib for bytes;
    using BTCUtils for bytes;
    using SafeMath for uint256;

    // @notice      Extracts the output script length
    // @dev         Indexes the length prefix on the pk_script
    // @param _b    The output
    // @returns     The 1 byte length prefix
    function extractOutputScriptLen(
        bytes _b
    ) pure public returns (bytes) {
        return _b.slice(8, 1);
    }

    // @notice      Extracts the value bytes from the output in a tx
    // @dev         Value is an 8-byte little-endian number
    // @param _b    The tx
    // @returns     The output value as LE bytes
    function extractValueLE(
        bytes _b
    ) pure public returns (bytes) {
        return _b.slice(0, 8);
    }

    // @notice      Extracts the value from the output in a tx
    // @dev         Value is an 8-byte little-endian number
    // @param _b    The tx
    // @returns     The output value
    function extractValue(
        bytes _b
    ) pure public returns (uint64) {
        return
            uint64(
                    extractValueLE(_b).reverseEndianness().bytesToUint());
    }

    // @notice      Extracts the value from the output in a tx
    // @dev         Value is an 8-byte little-endian number
    // @param _b    The tx
    // @returns     The output value
    function extractOpReturnData(
        bytes _b
    ) pure public returns (bytes) {
        require(_b.slice(9, 1).equal(hex'6a'), 'Not an OP_RETURN output');
        uint256 _dataLen = _b.slice(10, 1).bytesToUint();
        return _b.slice(11, _dataLen);
    }

    // @notice      Extracts the hash from the output script
    // @dev         Determines type by the length prefix
    // @param _b    The output
    // @returns     The hash committed to by the pk_script
    function extractHash(
        bytes _b
    ) pure public returns (bytes) {
        require(_b.slice(9, 1).equal(hex'00'), 'Not a witness output');
        uint256 _len = (extractOutputScriptLen(_b).equal(hex'22')) ? 32 : 20;
        return _b.slice(11, _len);
    }
}

library TX {

    // NB: A WitnessTX will always have the same struture:
    // ( 0 - 3)      4 byte LE version (must be 1 or 2)
    // ( 4 - 5)      2 byte segwit flag (must be 0x0001)
    // ( 6 - 6)      1 byte numTxIns (VarInts not supported)
    // (   7+ )      41 byte TxIn * numTxIns
    // (  47+ )      1 byte numTxOuts (VarInts not supported)
    // (  48+ )      31 or 43 byte TxOut * numTxOuts
    // (   ?   )      ? byte witnesses
    // (  -4-  )      4 byte LE locktime

    using BytesLib for bytes;
    using BTCUtils for bytes;
    using SafeMath for uint256;

    // @notice      Extracts the locktime bytes from a transaction
    // @dev         Takes the last 4 bytes off a byte array
    // @param _b    The bytes containing the encoded locktime
    // @returns     The LE-encoded locktime
    function extractLocktimeLE(
        bytes _b
    ) pure public returns (bytes) {
        return _b.lastBytes(4);
    }

    // @notice      Extracts the locktime and converts it to integer
    // @dev         Locktimes are littleendian
    // @params _b   The transaction terminating in the lock time
    // @returns     The uint value of the locktime bytes
    function extractLocktime(
        bytes _b
    ) pure public returns (uint32) {
        bytes memory _leLocktime = extractLocktimeLE(_b);
        return uint32(_leLocktime.reverseEndianness().bytesToUint());
    }

    // @notice      Extracts number of inputs as integer
    // @dev         This is encoded as a VarInt, and errors for high values
    // @params _b   The tx to evaluate
    // @returns     The number of inputs
    function extractNumInputs(
        bytes _b
    ) pure public returns (uint8) {
        uint256 _n = _b.slice(6, 1).bytesToUint();
        require(_n < 0xfd, 'VarInts not supported');  // Error on VarInts
        return uint8(_n);
    }

    // @notice      Finds the location of the number of outpus
    // @dev         This depends on the number of inputs
    // @params _b   The tx to evaluate
    // @returns     The index of the VarInt numTxOuts
    function findNumOutputs(
        bytes _b
    ) pure public returns (uint256) {
        return 7 + (41 * extractNumInputs(_b));
    }

    // @notice      Extracts number of outputs as integer
    // @dev         This is encoded as a VarInt, and errors for high values
    // @params _b   The tx to evaluate
    // @returns     The number of outputs
    function extractNumOutputs(
        bytes _b
    ) pure public returns (uint8) {
        uint256 _offset = findNumOutputs(_b);
        uint256 _n = _b.slice(_offset, 1).bytesToUint();
        require(_n < 0xfd, 'VarInts not supported');  // Error on VarInts
        return uint8(_n);
    }

    // @notice          Extracts the input at a given index in the TxIns vector
    // @dev             Use the WitnessInput library to parse the result
    // @params _b       The tx to evaluate
    // @params index    The 0-indexed location of the input to extract
    // @returns         The specified input
    function extractInputAtIndex(
        bytes _b,
        uint8 _index
    ) pure public returns (bytes) {
        require(_index < extractNumInputs(_b), 'Index more than number of inputs');
        uint256 _offset = 7 + (41 * _index);
        return _b.slice(_offset, 41);
    }

    // @notice          Determines the length of an output
    // @dev             3 types: WPKH, WSH, and OP_RETURN
    // @params _b       2 bytes from the start of the output script
    // @returns         The length indicated by the prefix
    function determineOutputLength(
        bytes _b
    ) pure public returns (uint256) {

        // Keccak for equality because it doesn't work otherwise.
        // Wasted an hour here

        if (keccak256(_b) == keccak256(hex'2200')) {
            // P2WSH
            return 43;
        }

        if (keccak256(_b) == keccak256(hex'1600')) {
            // P2WPKH
            return 31;
        }

        if (keccak256(_b.slice(1, 1)) == keccak256(hex'6a')) {
            // OP_RETURN
            uint _pushLen = _b.slice(0, 1).bytesToUint();
            require(_pushLen < 76, 'Multi-byte pushes not supported');
            // 8 byte value + 1 byte len + len bytes data
            return 9 + _pushLen;
        }

        // Error if we fall through the if statements
        require(false, 'Unable to determine output length');
    }

    // @notice          Extracts the output at a given index in the TxIns vector
    // @dev             Use the WitnessOutput library to parse the result
    // @params _b       The tx to evaluate
    // @params index    The 0-indexed location of the output to extract
    // @returns         The specified output
    function extractOutputAtIndex(
        bytes _b,
        uint8 _index
    ) pure public returns (bytes) {
        // Some gas wasted here. This duplicates findNumOutputs
        require(_index < extractNumOutputs(_b), 'Index more than number of outputs');

        // First output is the next byte after the number of outputs
        uint256 _offset = findNumOutputs(_b) + 1;

        // Determine if first output P2WPKH (31 bytes) or P2WSH (43 bytes)
        uint _len = determineOutputLength(_b.slice(_offset + 8, 2));

        // This loop moves forward, and then gets the len of the next one
        for(uint i = 0; i < _index; i++) {
            _offset = _offset + _len;
            _len = determineOutputLength(_b.slice(_offset + 8, 2));
        }

        // We now have the length and offset of the one we want
        return _b.slice(_offset, _len);
    }
}

library BlockHeader {

    using BytesLib for bytes;
    using BTCUtils for bytes;
    using SafeMath for uint256;

    // @notice      Concatenates and hashes two inputs for merkle proving
    // @param _a    The first hash
    // @param _b    The second hash
    // @returns     The double-sha256 of the concatenated hashes
    function _hash256MerkleStep(
        bytes _a,
        bytes _b
    ) pure public returns (bytes) {
        return abi.encodePacked(_a, _b).hash256();
    }

    // @notice        Verifies a Bitcoin-style merkle tree
    // @dev           Leaves are 1-indexed.
    // @param _a      The proof. Tightly packed LE sha256 hashes. The last hash is the root
    // @param _index  The index of the leaf
    // @returns       true if the proof is valid, else false
    function verifyHash256Merkle(
        bytes _a,
        uint _index
    ) pure public returns (bool) {
        if(_a.length % 32 != 0) {
            return false;  // Not an even number of hashes
        }
        if(_a.length == 32) {
            return true;  // Special case for coinbase-only blocks
        }
        if(_a.length == 64) {
            return false; // Should never occur
        }
        bytes memory _root = _a.slice(_a.length - 32, 32);
        bytes memory _current = _a.slice(0, 32);
        for(uint i = 1; i < (_a.length.div(32)) - 1; i++) {
            if (_index % 2 == 0)
            {
                _current = _hash256MerkleStep(
                    _a.slice(i * 32, 32),
                    _current
                );
                _index = _index.div(2);
            } else {
                _current = _hash256MerkleStep(
                    _current,
                    _a.slice(i * 32, 32)
                );
                _index = _index.div(2) + 1;
            }
        }
        return _current.toBytes32() == _root.toBytes32();
    }

    // @notice      Extracts the transaction merkle root from a block header
    // @dev         Use verifyHash256Merkle to verify proofs with this root
    // @param _b    The header
    // @returns     The merkle root (little-endian)
    function extractMerkleRootLE(
        bytes _b
    ) pure public returns (bytes) {
        return _b.slice(36, 32);
    }

    // @notice      Extracts the transaction merkle root from a block header
    // @dev         Use verifyHash256Merkle to verify proofs with this root
    // @param _b    The header
    // @returns     The merkle root (big-endian)
    function extractMerkleRootBE(
        bytes _b
    ) pure public returns (bytes) {
        return extractMerkleRootLE(_b).reverseEndianness();
    }

    // @notice      Extracts the target from a block header
    // @dev         Difficulty is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
    // @param _b    The header
    // @returns     The target threshold
    function extractTarget(
        bytes _b
    ) pure public returns (uint256) {
        bytes memory _m = _b.slice(72, 3);
        bytes memory _e = _b.slice(75, 1);
        uint256 _mantissa = _m.reverseEndianness().bytesToUint();
        uint _exponent = _e.bytesToUint() - 3;

        return _mantissa * (256 ** _exponent);
    }

    // @notice      Extracts the previous block's hash from a block header
    // @dev         Block headers do NOT include block number :(
    // @param _b    The header
    // @returns     The previous block's hash (little-endian)
    function extractPrevBlockLE(
        bytes _b
    ) pure public returns (bytes) {
        return _b.slice(4, 32);
    }

    // @notice      Extracts the previous block's hash from a block header
    // @dev         Block headers do NOT include block number :(
    // @param _b    The header
    // @returns     The previous block's hash (big-endian)
    function extractPrevBlockBE(
        bytes _b
    ) pure public returns (bytes) {
        return extractPrevBlockLE(_b).reverseEndianness();
    }

    // @notice      Extracts the timestamp from a block header
    // @dev         Time is not 100% reliable
    // @param _b    The header
    // @returns     The timestamp (little-endian bytes)
    function extractTimestampLE(
        bytes _b
    ) pure public returns (bytes) {
        return _b.slice(68, 4);
    }

    // @notice      Extracts the timestamp from a block header
    // @dev         Time is not 100% reliable
    // @param _b    The header
    // @returns     The timestamp (uint)
    function extractTimestamp(
        bytes _b
    ) pure public returns (uint32) {
        return uint32(extractTimestampLE(_b).reverseEndianness().bytesToUint());
    }
}
