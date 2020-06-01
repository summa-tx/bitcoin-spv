pragma solidity ^0.5.10;

/** @title BitcoinSPV */
/** @author Summa (https://summa.one) */

import {BTCUtils} from "./BTCUtils.sol";

library BTCUtilsDelegate {

    /* ***** */
    /* UTILS */
    /* ***** */

    /// @notice         Determines the length of a VarInt in bytes
    /// @dev            A VarInt of >1 byte is prefixed with a flag indicating its length
    /// @param _flag    The first byte of a VarInt
    /// @return         The number of non-flag bytes in the VarInt
    function determineVarIntDataLength(bytes memory _flag) public pure returns (uint8) {
        return BTCUtils.determineVarIntDataLength(_flag);
    }

    /// @notice     Parse a VarInt into its data length and the number it represents
    /// @dev        Useful for Parsing Vins and Vouts. Returns ERR_BAD_ARG if insufficient bytes.
    ///             Caller SHOULD explicitly handle this case (or bubble it up)
    /// @param _b   A byte-string starting with a VarInt
    /// @return     number of bytes in the encoding (not counting the tag), the encoded int
    function parseVarInt(bytes memory _b) public pure returns (uint256, uint256) {
        return BTCUtils.parseVarInt(_b);
    }

    /// @notice          Changes the endianness of a byte array
    /// @dev             Returns a new, backwards, bytes
    /// @param _b        The bytes to reverse
    /// @return          The reversed bytes
    function reverseEndianness(bytes memory _b) public pure returns (bytes memory) {
        return BTCUtils.reverseEndianness(_b);
    }

    /// @notice          Converts big-endian bytes to a uint
    /// @dev             Traverses the byte array and sums the bytes
    /// @param _b        The big-endian bytes-encoded integer
    /// @return          The integer representation
    function bytesToUint(bytes memory _b) public pure returns (uint256) {
        return BTCUtils.bytesToUint(_b);
    }

    /// @notice          Get the last _num bytes from a byte array
    /// @param _b        The byte array to slice
    /// @param _num      The number of bytes to extract from the end
    /// @return          The last _num bytes of _b
    function lastBytes(bytes memory _b, uint256 _num) public pure returns (bytes memory) {
        return BTCUtils.lastBytes(_b, _num);
    }

    /// @notice          Implements bitcoin's hash160 (rmd160(sha2()))
    /// @dev             abi.encodePacked changes the return to bytes instead of bytes32
    /// @param _b        The pre-image
    /// @return          The digest
    function hash160(bytes memory _b) public pure returns (bytes memory) {
        return BTCUtils.hash160(_b);
    }

    /// @notice          Implements bitcoin's hash256 (double sha2)
    /// @dev             abi.encodePacked changes the return to bytes instead of bytes32
    /// @param _b        The pre-image
    /// @return          The digest
    function hash256(bytes memory _b) public pure returns (bytes32) {
        return BTCUtils.hash256(_b);
    }

    /// @notice          Implements bitcoin's hash256 (double sha2)
    /// @dev             sha2 is precompiled smart contract located at address(2)
    /// @param _b        The pre-image
    /// @return          The digest
    function hash256View(bytes memory _b) internal view returns (bytes32) {
        return BTCUtils.hash256View(_b);
    }

    /* ************ */
    /* Legacy Input */
    /* ************ */

    /// @notice          Extracts the nth input from the vin (0-indexed)
    /// @dev             Iterates over the vin. If you need to extract several, write a custom function
    /// @param _vin      The vin as a tightly-packed byte array
    /// @param _index    The 0-indexed location of the input to extract
    /// @return          The input as a byte array
    function extractInputAtIndex(bytes memory _vin, uint256 _index) public pure returns (bytes memory) {
        return BTCUtils.extractInputAtIndex(_vin, _index);
    }

    /// @notice          Determines whether an input is legacy
    /// @dev             False if no scriptSig, otherwise True
    /// @param _input    The input
    /// @return          True for legacy, False for witness
    function isLegacyInput(bytes memory _input) public pure returns (bool) {
        return BTCUtils.isLegacyInput(_input);
    }

    /// @notice          Determines the length of an input from its scriptsig
    /// @dev             36 for outpoint, 1 for scriptsig length, 4 for sequence
    /// @param _input    The input
    /// @return          The length of the input in bytes
    function determineInputLength(bytes memory _input) public pure returns (uint256) {
        return BTCUtils.determineInputLength(_input);
    }

    /// @notice          Extracts the LE sequence bytes from an input
    /// @dev             Sequence is used for relative time locks
    /// @param _input    The LEGACY input
    /// @return          The sequence bytes (LE uint)
    function extractSequenceLELegacy(bytes memory _input) public pure returns (bytes memory) {
        return BTCUtils.extractSequenceLELegacy(_input);
    }

    /// @notice          Extracts the sequence from the input
    /// @dev             Sequence is a 4-byte little-endian number
    /// @param _input    The LEGACY input
    /// @return          The sequence number (big-endian uint)
    function extractSequenceLegacy(bytes memory _input) public pure returns (uint32) {
        return BTCUtils.extractSequenceLegacy(_input);
    }
    /// @notice          Extracts the length-prepended scriptSig from the input in a tx
    /// @dev             Will return hex"00" if passed a witness input
    /// @param _input    The LEGACY input
    /// @return          The length-prepended script sig
    function extractScriptSig(bytes memory _input) public pure returns (bytes memory) {
        return BTCUtils.extractScriptSig(_input);
    }

    /// @notice          Determines the length of a scriptSig in an input
    /// @dev             Will return 0 if passed a witness input
    /// @param _input    The LEGACY input
    /// @return          The length of the script sig
    function extractScriptSigLen(bytes memory _input) public pure returns (uint256, uint256) {
        return BTCUtils.extractScriptSigLen(_input);
    }


    /* ************* */
    /* Witness Input */
    /* ************* */

    /// @notice          Extracts the LE sequence bytes from an input
    /// @dev             Sequence is used for relative time locks
    /// @param _input    The WITNESS input
    /// @return          The sequence bytes (LE uint)
    function extractSequenceLEWitness(bytes memory _input) public pure returns (bytes memory) {
        return BTCUtils.extractSequenceLEWitness(_input);
    }


    /// @notice          Extracts the sequence from the input in a tx
    /// @dev             Sequence is a 4-byte little-endian number
    /// @param _input    The WITNESS input
    /// @return          The sequence number (big-endian uint)
    function extractSequenceWitness(bytes memory _input) public pure returns (uint32) {
        return BTCUtils.extractSequenceWitness(_input);
    }

    /// @notice          Extracts the outpoint from the input in a tx
    /// @dev             32 byte tx id with 4 byte index
    /// @param _input    The input
    /// @return          The outpoint (LE bytes of prev tx hash + LE bytes of prev tx index)
    function extractOutpoint(bytes memory _input) public pure returns (bytes memory) {
        return BTCUtils.extractOutpoint(_input);
    }


    /// @notice          Extracts the outpoint tx id from an input
    /// @dev             32 byte tx id
    /// @param _input    The input
    /// @return          The tx id (little-endian bytes)
    function extractInputTxIdLE(bytes memory _input) public pure returns (bytes32) {
        return BTCUtils.extractInputTxIdLE(_input);
    }

    /// @notice          Extracts the LE tx input index from the input in a tx
    /// @dev             4 byte tx index
    /// @param _input    The input
    /// @return          The tx index (little-endian bytes)
    function extractTxIndexLE(bytes memory _input) public pure returns (bytes memory) {
        return BTCUtils.extractTxIndexLE(_input);
    }

    /* ****** */
    /* Output */
    /* ****** */

    /// @notice          Determines the length of an output
    /// @dev             5 types: WPKH, WSH, PKH, SH, and OP_RETURN
    /// @param _output   The output
    /// @return          The length indicated by the prefix, error if invalid length
    function determineOutputLength(bytes memory _output) public pure returns (uint256) {
        return BTCUtils.determineOutputLength(_output);
    }

    /// @notice          Extracts the output at a given index in the TxIns vector
    /// @dev             Iterates over the vout. If you need to extract multiple, write a custom function
    /// @param _vout     The _vout to extract from
    /// @param _index    The 0-indexed location of the output to extract
    /// @return          The specified output
    function extractOutputAtIndex(bytes memory _vout, uint256 _index) public pure returns (bytes memory) {
        return BTCUtils.extractOutputAtIndex(_vout, _index);
    }

    /// @notice          Extracts the value bytes from the output in a tx
    /// @dev             Value is an 8-byte little-endian number
    /// @param _output   The output
    /// @return          The output value as LE bytes
    function extractValueLE(bytes memory _output) public pure returns (bytes memory) {
        return BTCUtils.extractValueLE(_output);
    }

    /// @notice          Extracts the value from the output in a tx
    /// @dev             Value is an 8-byte little-endian number
    /// @param _output   The output
    /// @return          The output value
    function extractValue(bytes memory _output) public pure returns (uint64) {
        return BTCUtils.extractValue(_output);
    }

    /// @notice          Extracts the data from an op return output
    /// @dev             Returns hex"" if no data or not an op return
    /// @param _output   The output
    /// @return          Any data contained in the opreturn output, null if not an op return
    function extractOpReturnData(bytes memory _output) public pure returns (bytes memory) {
        return BTCUtils.extractOpReturnData(_output);
    }

    /// @notice          Extracts the hash from the output script
    /// @dev             Determines type by the length prefix
    /// @param _output   The output
    /// @return          The hash committed to by the pk_script
    function extractHash(bytes memory _output) public pure returns (bytes memory) {
        return BTCUtils.extractHash(_output);
    }

    /* ********** */
    /* Witness TX */
    /* ********** */


    /// @notice      Checks that the vin passed up is properly formatted
    /// @dev         Consider a vin with a valid vout in its scriptsig
    /// @param _vin  Raw bytes length-prefixed input vector
    /// @return      True if it represents a validly formatted vin
    function validateVin(bytes memory _vin) public pure returns (bool) {
        return BTCUtils.validateVin(_vin);
    }

    /// @notice      Checks that the vin passed up is properly formatted
    /// @dev         Consider a vin with a valid vout in its scriptsig
    /// @param _vout Raw bytes length-prefixed output vector
    /// @return      True if it represents a validly formatted bout
    function validateVout(bytes memory _vout) public pure returns (bool) {
        return BTCUtils.validateVout(_vout);
    }



    /* ************ */
    /* Block Header */
    /* ************ */

    /// @notice          Extracts the transaction merkle root from a block header
    /// @dev             Use verifyHash256Merkle to verify proofs with this root
    /// @param _header   The header
    /// @return          The merkle root (little-endian)
    function extractMerkleRootLE(bytes memory _header) public pure returns (bytes memory) {
        return BTCUtils.extractMerkleRootLE(_header);
    }

    /// @notice          Extracts the target from a block header
    /// @dev             Target is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
    /// @param _header   The header
    /// @return          The target threshold
    function extractTarget(bytes memory _header) public pure returns (uint256) {
        return BTCUtils.extractTarget(_header);
    }

    /// @notice          Calculate difficulty from the difficulty 1 target and current target
    /// @dev             Difficulty 1 is 0x1d00ffff on mainnet and testnet
    /// @dev             Difficulty 1 is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
    /// @param _target   The current target
    /// @return          The block difficulty (bdiff)
    function calculateDifficulty(uint256 _target) public pure returns (uint256) {
        return BTCUtils.calculateDifficulty(_target);
    }

    /// @notice          Extracts the previous block's hash from a block header
    /// @dev             Block headers do NOT include block number :(
    /// @param _header   The header
    /// @return          The previous block's hash (little-endian)
    function extractPrevBlockLE(bytes memory _header) public pure returns (bytes memory) {
        return BTCUtils.extractPrevBlockLE(_header);
    }

    /// @notice          Extracts the timestamp from a block header
    /// @dev             Time is not 100% reliable
    /// @param _header   The header
    /// @return          The timestamp (little-endian bytes)
    function extractTimestampLE(bytes memory _header) public pure returns (bytes memory) {
        return BTCUtils.extractTimestampLE(_header);
    }

    /// @notice          Extracts the timestamp from a block header
    /// @dev             Time is not 100% reliable
    /// @param _header   The header
    /// @return          The timestamp (uint)
    function extractTimestamp(bytes memory _header) public pure returns (uint32) {
        return BTCUtils.extractTimestamp(_header);
    }

    /// @notice          Extracts the expected difficulty from a block header
    /// @dev             Does NOT verify the work
    /// @param _header   The header
    /// @return          The difficulty as an integer
    function extractDifficulty(bytes memory _header) public pure returns (uint256) {
        return BTCUtils.extractDifficulty(_header);
    }

    /// @notice          Concatenates and hashes two inputs for merkle proving
    /// @param _a        The first hash
    /// @param _b        The second hash
    /// @return          The double-sha256 of the concatenated hashes
    function _hash256MerkleStep(bytes memory _a, bytes memory _b) public pure returns (bytes32) {
        return BTCUtils._hash256MerkleStep(_a, _b);
    }

    /// @notice          Verifies a Bitcoin-style merkle tree
    /// @dev             Leaves are 0-indexed.
    /// @param _proof    The proof. Tightly packed LE sha256 hashes. The last hash is the root
    /// @param _index    The index of the leaf
    /// @return          true if the proof is valid, else false
    function verifyHash256Merkle(bytes memory _proof, uint _index) public pure returns (bool) {
        return BTCUtils.verifyHash256Merkle(_proof, _index);
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
    ) public pure returns (uint256) {
        return BTCUtils.retargetAlgorithm(_previousTarget, _firstTimestamp, _secondTimestamp);
    }
}
