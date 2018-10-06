pragma solidity ^0.4.25;

/** @title ValidateSPV*/
/** @author Summa (https://summa.one) */

contract ValidateSPV {

    event Validated(bytes32 indexed _hash);
    event TxParsed(bytes32 indexed _hash);
    event HeaderParsed(bytes32 indexed _hash);
    event WorkTooLow(bytes32 indexed _hash, uint256 _hashInt, uint256 indexed _target);

    enum OutputTypes {
        NONE,
        WPKH,
        WSH,
        OP_RETURN
    }

    struct TxIn {
        uint32 sequence;            // 4 byte sequence number
        bytes32 outpoint;           // 32 byte outpoint
    }

    struct TxOut {
        uint64 value;               // 8 byte value
        OutputTypes outputType;
        bytes payload;              // pubkey hash, script hash, or OP_RETURN data
    }

    struct Transaction {
        bytes32 txid;               // 32 byte tx id, little endian
        uint32 locktime;            // 4 byte locktime
        uint8 numInputs;            // number tx inputs
        uint8 numOutputs;           // number tx outputs
        TxIn[] inputs;              // tx input struct array
        TxOut[] outputs;            // tx output struct array
    }

    struct Header {
        bytes32 digest;             // 32 byte little endian digest
        uint32 version;             // 4 byte version
        bytes32 prevblock;          // 32 byte previous block hash
        bytes32 merkleRoot;         // 32 byte tx root
        uint32 timestamp;           // 4 byte timestamp
        uint256 target;             // 4 byte nBits == 32 byte integer
        uint32 nonce;               // 4 byte nonce
    }

    mapping(bytes32 => Transaction) public transactions;    // Transactions
    mapping(bytes32 => Header) public headers;              // Parsed headers


    /// @notice         Parses, a tx, valides its inclusdion in the block, stores to the
    /// @notice         mapping
    /// @param _tx      The raw byte tx
    /// @param _proof   The raw byte proof (concatenated LE hashes)
    /// @param _header  The raw byte header
    /// @return         true if fully valid, false otherwise
    function validateTransaction(
        bytes _tx,
        bytes _proof,
        uint _index,
        bytes _header
    ) public returns (bytes32);


    /// @notice         Parses and stores a Transaction struct from a bytestring
    /// @dev            This supports ONLY WITNESS INPUTS AND OUTPUTS
    /// @param _tx      Raw bytes tx
    /// @return         Transaction id, little endian
    function parseAndStoreTransaction(bytes _tx) public returns (bytes32);


    /// @notice         Validates the first 6 bytes of a block
    /// @dev            First byte is the version. The next must be 0x0000000001
    /// @param _tx      Raw byte tx
    /// @return         true if valid, otherwise false
    function validatePrefix(bytes _tx) pure internal returns (bool);


    /// @notice         Parses a TxIn struct from raw input bytes
    /// @dev            Checks for blank scriptSig
    /// @param _input   Raw bytes tx input
    /// @return         TxIn struct
    function parseInput(bytes _input) pure internal returns (TxIn);


    /// @notice         Parses a TxOut struct from raw output bytes
    /// @dev            Differentiates by output script prefix
    /// @param _output  Raw bytes tx output
    /// @return         TxOut struct
    function parseOutput(bytes _output) pure internal returns (TxOut);


    /// @notice         Parses and stores a Header struct from a bytestring
    /// @dev            Block headers are always 80 bytes, see Bitcoin docs
    /// @param _header  Raw bytes header
    /// @return         Block hash, little endian
    function parseAndStoreHeader(bytes _header) public returns (bytes32);


    /// @notice         Parses a block header struct from a bytestring
    /// @dev            Block headers are always 80 bytes, see Bitcoin docs
    /// param _header  Raw bytes header
    /// @return         Parsed Header struct
    function parseHeader(bytes _header) pure internal returns (Header);
}
