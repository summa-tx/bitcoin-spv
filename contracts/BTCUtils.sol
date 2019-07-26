pragma solidity ^0.5.10;

/** @title BitcoinSPV */
/** @author Summa (https://summa.one) */

import {BytesLib} from "./BytesLib.sol";
import {SafeMath} from "./SafeMath.sol";

library BTCUtils {
    using BytesLib for bytes;
    using SafeMath for uint256;

    uint256 public constant DIFF1_TARGET = 0xffff0000000000000000000000000000000000000000000000000000;
    uint256 public constant RETARGET_PERIOD = 2 * 7 * 24 * 60 * 60;  // 2 weeks in seconds
    uint256 public constant RETARGET_PERIOD_BLOCKS = 2016;  // 2 weeks in blocks

    /* ***** */
    /* UTILS */
    /* ***** */

    /// @notice         determines the length of a VarInt in bytes
    /// @dev            a VarInt of >1 byte is prefixed with a flag indicating its length
    /// @param _flag    the first byte of a VarInt
    /// @return         the number of non-flag bytes in the VarInt
    function determineVarIntDataLength(bytes memory _flag) internal pure returns (uint256) {
        bytes32 _flagHash = keccak256(_flag);

        if (_flagHash == keccak256(hex"ff")) {
            return 8;  // one-byte flag, 8 bytes data
        }
        if (_flagHash == keccak256(hex"fe")) {
            return 4;  // one-byte flag, 4 bytes data
        }
        if (_flagHash == keccak256(hex"fd")) {
            return 2;  // one-byte flag, 2 bytes data
        }

        return 0;  // flag is data
    }

    /// @notice          Changes the endianness of a byte array
    /// @dev             Returns a new, backwards, bytes
    /// @param _b        The bytes to reverse
    /// @return          The reversed bytes
    function reverseEndianness(bytes memory _b) internal pure returns (bytes memory) {
        bytes memory _newValue = new bytes(_b.length);

        for (uint i = 0; i < _b.length; i++) {
            _newValue[_b.length - i - 1] = _b[i];
        }

        return _newValue;
    }

    /// @notice          Converts big-endian bytes to a uint
    /// @dev             Traverses the byte array and sums the bytes
    /// @param _b        The big-endian bytes-encoded integer
    /// @return          The integer representation
    function bytesToUint(bytes memory _b) internal pure returns (uint256) {
        uint256 _number;

        for (uint i = 0; i < _b.length; i++) {
            _number = _number + uint8(_b[i]) * (2 ** (8 * (_b.length - (i + 1))));
        }

        return _number;
    }

    /// @notice          Get the last _num bytes from a byte array
    /// @param _b        The byte array to slice
    /// @param _num      The number of bytes to extract from the end
    /// @return          The last _num bytes of _b
    function lastBytes(bytes memory _b, uint256 _num) internal pure returns (bytes memory) {
        uint256 _start = _b.length.sub(_num);

        return _b.slice(_start, _num);
    }

    /// @notice          Implements bitcoin"s hash160 (rmd160(sha2()))
    /// @dev             abi.encodePacked changes the return to bytes instead of bytes32
    /// @param _b        The pre-image
    /// @return          The digest
    function hash160(bytes memory _b) internal pure returns (bytes memory) {
        return abi.encodePacked(ripemd160(abi.encodePacked(sha256(_b))));
    }

    /// @notice          Implements bitcoin"s hash256 (double sha2)
    /// @dev             abi.encodePacked changes the return to bytes instead of bytes32
    /// @param _b        The pre-image
    /// @return          The digest
    function hash256(bytes memory _b) internal pure returns (bytes32) {
        return abi.encodePacked(sha256(abi.encodePacked(sha256(_b)))).toBytes32();
    }

    /* ************ */
    /* Legacy Input */
    /* ************ */

    /// @notice          Extracts the nth input from the vin (0-indexed)
    /// @dev             Iterates over the vin. If you need to extract several, write a custom function
    /// @param _vin      The vin as a tightly-packed byte array
    /// @param _index    The index from which to extract
    /// @return          The input as a byte array
    function extractInputAtIndex(bytes memory _vin, uint8 _index) internal pure returns (bytes memory) {
        uint256 _len;
        bytes memory _remaining;

        uint256 _offset = 1;

        for (uint8 _i = 0; _i < _index; _i ++) {
            _remaining = _vin.slice(_offset, _vin.length - _offset);
            _len = determineInputLength(_remaining);
            _offset = _offset + _len;
        }

        _remaining = _vin.slice(_offset, _vin.length - _offset);
        _len = determineInputLength(_remaining);
        return _vin.slice(_offset, _len);
    }

    /// @notice          Determines whether an input is legacy
    /// @dev             False if no scriptSig, otherwise True
    /// @param _input    The input
    /// @return          True for legacy, False for witness
    function isLegacyInput(bytes memory _input) internal pure returns (bool) {
        return keccak256(_input.slice(36, 1)) != keccak256(hex"00");
    }

    /// @notice          Determines the length of an input from its scriptsig
    /// @dev             36 for outpoint, 1 for scriptsig length, 4 for sequence
    /// @param _input    The input
    /// @return          The length of the input in bytes
    function determineInputLength(bytes memory _input) internal pure returns (uint256) {
        return 36 + 4 + 1 + extractScriptSigLen(_input);
    }

    /// @notice          Extracts the LE sequence bytes from an input
    /// @dev             Sequence is used for relative time locks
    /// @param _input    The LEGACY input
    /// @return          The sequence bytes (LE uint)
    function extractSequenceLELegacy(bytes memory _input) internal pure returns (bytes memory) {
        return _input.slice(36 + 1 + extractScriptSigLen(_input), 4);
    }

    /// @notice          Extracts the sequence from the input
    /// @dev             Sequence is a 4-byte little-endian number
    /// @param _input    The LEGACY input
    /// @return          The sequence number (big-endian uint)
    function extractSequenceLegacy(bytes memory _input) internal pure returns (uint32) {
        bytes memory _leSeqence = extractSequenceLELegacy(_input);
        bytes memory _beSequence = reverseEndianness(_leSeqence);
        return uint32(bytesToUint(_beSequence));
    }
    /// @notice          Extracts the scriptSig from the input in a tx
    /// @dev             Will return hex"00" if passed a legacy
    /// @param _input    The LEGACY input
    /// @return          The sequence number (big-endian uint)
    function extractScriptSig(bytes memory _input) internal pure returns (bytes memory) {
        return _input.slice(36, 1 + extractScriptSigLen(_input));
    }
    /// @notice          Determines the length of a scriptSig in an input
    /// @dev             Will return 0 if passed a witness input
    /// @param _input    The LEGACY input
    /// @return          The sequence number (big-endian uint)
    function extractScriptSigLen(bytes memory _input) internal pure returns (uint8) {
        uint8 _len = uint8(_input.slice(36, 1)[0]);
        require(_len < 0xfd, "Multi-byte VarInts not supported");  // Error on VarInts
        return _len;
    }


    /* ************* */
    /* Witness Input */
    /* ************* */

    /// @notice          Extracts the LE sequence bytes from an input
    /// @dev             Sequence is used for relative time locks
    /// @param _input    The WITNESS input
    /// @return          The sequence bytes (LE uint)
    function extractSequenceLEWitness(bytes memory _input) internal pure returns (bytes memory) {return _input.slice(37, 4);}

    /// @notice          Extracts the sequence from the input in a tx
    /// @dev             Sequence is a 4-byte little-endian number
    /// @param _input    The WITNESS input
    /// @return          The sequence number (big-endian uint)
    function extractSequenceWitness(bytes memory _input) internal pure returns (uint32) {
        bytes memory _leSeqence = extractSequenceLEWitness(_input);
        bytes memory _inputeSequence = reverseEndianness(_leSeqence);
        return uint32(bytesToUint(_inputeSequence));
    }

    /// @notice          Extracts the outpoint from the input in a tx
    /// @dev             32 byte tx id with 4 byte index
    /// @param _input    The input
    /// @return          The outpoint (LE bytes of prev tx hash + LE bytes of prev tx index)
    function extractOutpoint(bytes memory _input) internal pure returns (bytes memory) {return _input.slice(0, 36);}

    /// @notice          Extracts the tx input tx id from the input in a tx
    /// @dev             32 byte tx id
    /// @param _input    The input
    /// @return          The tx id (little-endian bytes)
    function extractInputTxIdLE(bytes memory _input) internal pure returns (bytes32) {return _input.slice(0, 32).toBytes32();}

    /// @notice          Extracts the tx input tx id from the input in a tx
    /// @dev             32 byte tx id
    /// @param _input    The input
    /// @return          The tx id (big-endian bytes)
    function extractInputTxId(bytes memory _input) internal pure returns (bytes32) {
        bytes memory _leId = abi.encodePacked(extractInputTxIdLE(_input));
        bytes memory _beId = reverseEndianness(_leId);
        return _beId.toBytes32();
    }

    /// @notice          Extracts the LE tx input index from the input in a tx
    /// @dev             4 byte tx index
    /// @param _input    The input
    /// @return          The tx index (little-endian bytes)
    function extractTxIndexLE(bytes memory _input) internal pure returns (bytes memory) {return _input.slice(32, 4);}

    /// @notice          Extracts the tx input index from the input in a tx
    /// @dev             4 byte tx index
    /// @param _input    The input
    /// @return          The tx index (big-endian uint)
    function extractTxIndex(bytes memory _input) internal pure returns (uint32) {
        bytes memory _leIndex = extractTxIndexLE(_input);
        bytes memory _beIndex = reverseEndianness(_leIndex);
        return uint32(bytesToUint(_beIndex));
    }

    /* ****** */
    /* Output */
    /* ****** */

    /// @notice          Determines the length of an output
    /// @dev             5 types: WPKH, WSH, PKH, SH, and OP_RETURN
    /// @param _output   2 bytes from the start of the output script
    /// @return          The length indicated by the prefix, error if invalid length
    function determineOutputLength(bytes memory _output) internal pure returns (uint256) {
        uint8 _len = uint8(_output.slice(8, 1)[0]);
        require(_len < 0xfd, "Multi-byte VarInts not supported");

        return _len + 8 + 1; // 8 byte value, 1 byte for _len itself
    }

    /// @notice          Extracts the output at a given index in the TxIns vector
    /// @dev             Iterates over the vout. If you need to extract multiple, write a custom function
    /// @param _vout     The _vout to extract from
    /// @param _index    The 0-indexed location of the output to extract
    /// @return          The specified output
    function extractOutputAtIndex(bytes memory _vout, uint8 _index) internal pure returns (bytes memory) {
        uint256 _len;
        bytes memory _remaining;

        uint256 _offset = 1;

        for (uint8 _i = 0; _i < _index; _i ++) {
            _remaining = _vout.slice(_offset, _vout.length - _offset);
            _len = determineOutputLength(_remaining);
            _offset = _offset + _len;
        }

        _remaining = _vout.slice(_offset, _vout.length - _offset);
        _len = determineOutputLength(_remaining);
        return _vout.slice(_offset, _len);
    }

    /// @notice          Extracts the output script length
    /// @dev             Indexes the length prefix on the pk_script
    /// @param _output        The output
    /// @return          The 1 byte length prefix
    function extractOutputScriptLen(bytes memory _output) internal pure returns (bytes memory) {return _output.slice(8, 1);}

    /// @notice          Extracts the value bytes from the output in a tx
    /// @dev             Value is an 8-byte little-endian number
    /// @param _output   The output
    /// @return          The output value as LE bytes
    function extractValueLE(bytes memory _output) internal pure returns (bytes memory) {return _output.slice(0, 8);}

    /// @notice          Extracts the value from the output in a tx
    /// @dev             Value is an 8-byte little-endian number
    /// @param _output   The output
    /// @return          The output value
    function extractValue(bytes memory _output) internal pure returns (uint64) {
        bytes memory _leValue = extractValueLE(_output);
        bytes memory _beValue = reverseEndianness(_leValue);
        return uint64(bytesToUint(_beValue));
    }

    /// @notice          Extracts the value from the output in a tx
    /// @dev             Value is an 8-byte little-endian number
    /// @param _output        The output
    /// @return          The output value
    function extractOpReturnData(bytes memory _output) internal pure returns (bytes memory) {
        if (keccak256(_output.slice(9, 1)) != keccak256(hex"6a")) {
            return hex"";
        }
        bytes memory _dataLen = _output.slice(10, 1);
        return _output.slice(11, bytesToUint(_dataLen));
    }

    /// @notice          Extracts the hash from the output script
    /// @dev             Determines type by the length prefix
    /// @param _output        The output
    /// @return          The hash committed to by the pk_script
    function extractHash(bytes memory _output) internal pure returns (bytes memory) {
        if (keccak256(_output.slice(9, 1)) != keccak256(hex"00")) {
            return hex"";
        }
        uint256 _len = (keccak256(extractOutputScriptLen(_output)) == keccak256(hex"22")) ? 32 : 20;
        return _output.slice(11, _len);
    }

    /* ********** */
    /* Witness TX */
    /* ********** */


    /// @notice      Checks that the vin passed up is properly formatted
    /// @dev         Consider a vin with a valid vout in its scriptsig
    /// @param _vin  Raw bytes length-prefixed input vector
    /// @return      True if it represents a validly formatted vin
    function validateVin(bytes memory _vin) internal pure returns (bool) {
        uint256 _offset = 1;
        uint8 _nIns = uint8(_vin.slice(0, 1)[0]);

        // Not valid if it says there are too many or no inputs
        if (_nIns >= 0xfd || _nIns == 0) {return false;}

        for (uint8 i = 0; i < _nIns; i++) {
            // Grab the next input and determine its length.
            // Increase the offset by that much
            _offset += determineInputLength(_vin.slice(_offset, _vin.length - _offset));

            // Returns false we jump past the end
            if (_offset > _vin.length) {return false;}
        }

        // Returns false if we're not exactly at the end
        return _offset == _vin.length;
    }

    /// @notice      Checks that the vin passed up is properly formatted
    /// @dev         Consider a vin with a valid vout in its scriptsig
    /// @param _vout Raw bytes length-prefixed output vector
    /// @return      True if it represents a validly formatted bout
    function validateVout(bytes memory _vout) internal pure returns (bool) {
        uint256 _offset = 1;
        uint8 _nOuts = uint8(_vout.slice(0, 1)[0]);

        // Not valid if it says there are too many or no inputs
        if (_nOuts >= 0xfd || _nOuts == 0) {return false;}

        for (uint8 i = 0; i < _nOuts; i++) {
            // Grab the next input and determine its length.
            // Increase the offset by that much
            _offset += determineOutputLength(_vout.slice(_offset, _vout.length - _offset));

            // Returns false we jump past the end
            if (_offset > _vout.length) {return false;}
        }

        // Returns false if we're not exactly at the end
        return _offset == _vout.length;
    }



    /* ************ */
    /* Block Header */
    /* ************ */

    /// @notice          Extracts the transaction merkle root from a block header
    /// @dev             Use verifyHash256Merkle to verify proofs with this root
    /// @param _header   The header
    /// @return          The merkle root (little-endian)
    function extractMerkleRootLE(bytes memory _header) internal pure returns (bytes memory) {return _header.slice(36, 32);}

    /// @notice          Extracts the transaction merkle root from a block header
    /// @dev             Use verifyHash256Merkle to verify proofs with this root
    /// @param _header   The header
    /// @return          The merkle root (big-endian)
    function extractMerkleRootBE(bytes memory _header) internal pure returns (bytes memory) {
        return reverseEndianness(extractMerkleRootLE(_header));
    }

    /// @notice          Extracts the target from a block header
    /// @dev             Target is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
    /// @param _header   The header
    /// @return          The target threshold
    function extractTarget(bytes memory _header) internal pure returns (uint256) {
        bytes memory _m = _header.slice(72, 3);
        bytes memory _e = _header.slice(75, 1);
        uint256 _mantissa = bytesToUint(reverseEndianness(_m));
        uint _exponent = bytesToUint(_e) - 3;

        return _mantissa * (256 ** _exponent);
    }

    /// @notice          Calculate difficulty from the difficulty 1 target and current target
    /// @dev             Difficulty 1 is 0x1d00ffff on mainnet and testnet
    /// @dev             Difficulty 1 is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
    /// @param _target   The current target
    /// @return          The block difficulty (bdiff)
    function calculateDifficulty(uint256 _target) internal pure returns (uint256) {
        // Difficulty 1 calculated from 0x1d00ffff
        uint256 _difficulty1Target = 26959535291011309493156476344723991336010898738574164086137773096960;
        return _difficulty1Target.div(_target);
    }

    /// @notice          Extracts the previous block"s hash from a block header
    /// @dev             Block headers do NOT include block number :(
    /// @param _header   The header
    /// @return          The previous block"s hash (little-endian)
    function extractPrevBlockLE(bytes memory _header) internal pure returns (bytes memory) {return _header.slice(4, 32);}

    /// @notice          Extracts the previous block"s hash from a block header
    /// @dev             Block headers do NOT include block number :(
    /// @param _header   The header
    /// @return          The previous block"s hash (big-endian)
    function extractPrevBlockBE(bytes memory _header) internal pure returns (bytes memory) {
        return reverseEndianness(extractPrevBlockLE(_header));
    }

    /// @notice          Extracts the timestamp from a block header
    /// @dev             Time is not 100% reliable
    /// @param _header   The header
    /// @return          The timestamp (little-endian bytes)
    function extractTimestampLE(bytes memory _header) internal pure returns (bytes memory) {return _header.slice(68, 4);}

    /// @notice          Extracts the timestamp from a block header
    /// @dev             Time is not 100% reliable
    /// @param _header   The header
    /// @return          The timestamp (uint)
    function extractTimestamp(bytes memory _header) internal pure returns (uint32) {
        return uint32(bytesToUint(reverseEndianness(extractTimestampLE(_header))));
    }

    function extractDifficulty(bytes memory _header) internal pure returns (uint256) {
        return difficultyFromTarget(extractTarget(_header));
    }

    function difficultyFromTarget(uint256 _target) public pure returns (uint256) {
        return DIFF1_TARGET.div(_target);
    }


    /// @notice          Concatenates and hashes two inputs for merkle proving
    /// @param _a        The first hash
    /// @param _b        The second hash
    /// @return          The double-sha256 of the concatenated hashes
    function _hash256MerkleStep(bytes memory _a, bytes memory _b) internal pure returns (bytes32) {
        return hash256(abi.encodePacked(_a, _b));
    }

    /// @notice          Verifies a Bitcoin-style merkle tree
    /// @dev             Leaves are 1-indexed.
    /// @param _proof    The proof. Tightly packed LE sha256 hashes. The last hash is the root
    /// @param _index    The index of the leaf
    /// @return          true if the proof is valid, else false
    function verifyHash256Merkle(bytes memory _proof, uint _index) internal pure returns (bool) {
        // Not an even number of hashes
        if (_proof.length % 32 != 0) {return false;}

        // Special case for coinbase-only blocks
        if (_proof.length == 32) {return true;}

        // Should never occur
        if (_proof.length == 64) {return false;}

        uint _idx = _index;
        bytes32 _root = _proof.slice(_proof.length - 32, 32).toBytes32();
        bytes32 _current = _proof.slice(0, 32).toBytes32();

        for (uint i = 1; i < (_proof.length.div(32)) - 1; i++) {
            if (_idx % 2 == 1) {
                _current = _hash256MerkleStep(_proof.slice(i * 32, 32), abi.encodePacked(_current));
            } else {
                _current = _hash256MerkleStep(abi.encodePacked(_current), _proof.slice(i * 32, 32));
            }
            _idx = _idx >> 1;
        }
        return _current == _root;
    }

    /*
    NB: https://github.com/bitcoin/bitcoin/blob/78dae8caccd82cfbfd76557f1fb7d7557c7b5edb/src/pow.cpp#L49-L72
    NB: We get a full-bitlength target from this. For comparison with
        header-encoded targets we need to mask it with the header target
        e.g. (full & truncated) == truncated
    */
    /// @notice                 performs the bitcoin difficulty retarget
    /// @dev                    implements the Bitcoin algorithm precisely
    /// @param _previousTarget  the target of the previous period
    /// @param _firstTimestamp  the timestamp of the first block in the difficulty period
    /// @param _secondTimestamp the timestamp of the last block in the difficulty period
    /// @return                 the new period's target threshold
    function retargetAlgorithm(
        uint256 _previousTarget,
        uint256 _firstTimestamp,
        uint256 _secondTimestamp
    ) internal pure returns (uint256) {
        uint256 _elapsedTime = _secondTimestamp.sub(_firstTimestamp);

        // Normalize ratio to factor of 4 if very long or very short
        if (_elapsedTime < RETARGET_PERIOD.div(4)) {
            _elapsedTime = RETARGET_PERIOD.div(4);
        }
        if (_elapsedTime > RETARGET_PERIOD.mul(4)) {
            _elapsedTime = RETARGET_PERIOD.mul(4);
        }

        /*
          NB: high targets e.g. ffff0020 can cause overflows here
              so we divide it by 256**2, then multiply by 256**2 later
              we know the target is evenly divisible by 256**2, so this isn't an issue
        */

        uint256 _adjusted = _previousTarget.div(65536).mul(_elapsedTime);
        return _adjusted.div(RETARGET_PERIOD).mul(65536);
    }
}
