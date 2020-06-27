#ifndef SUMMA_CKB_BTCSPV_H_
#define SUMMA_CKB_BTCSPV_H_

#include "stdbool.h"
#include "stdint.h"

#define DECLARE_VIEW_TYPE(NAME) \
  typedef struct { \
    const uint8_t *loc; \
    const uint32_t len; \
  } NAME ## _t; \
  typedef const NAME ## _t const_ ## NAME ##_t;

#define VIEW_FROM_VIEW(view) \
  { view.loc, view.len }

#define VIEW_FROM_VIEW_POINTER(view) \
  { view->loc, view->len }

#define VIEW_FROM_ARR(arr) \
  { arr, sizeof(arr) }

#define AS_LE_UINT64(a)                                          \
  (((uint64_t)(*(a + 7)) << 56) | ((uint64_t)(*(a + 6)) << 48) | \
   ((uint64_t)(*(a + 5)) << 40) | ((uint64_t)(*(a + 4)) << 32) | \
   ((uint64_t)(*(a + 3)) << 24) | ((uint64_t)(*(a + 2)) << 16) | \
   ((uint64_t)(*(a + 1)) << 8) | ((uint64_t)(*(a + 0))))

#define AS_LE_UINT32(a)                                          \
  (((uint32_t)(*(a + 3)) << 24) | ((uint32_t)(*(a + 2)) << 16) | \
   ((uint32_t)(*(a + 1)) << 8) | ((uint32_t)(*(a + 0))))

#define AS_UINT64(a)                                             \
  (((uint64_t)(*(a + 0)) << 56) | ((uint64_t)(*(a + 1)) << 48) | \
   ((uint64_t)(*(a + 2)) << 40) | ((uint64_t)(*(a + 3)) << 32) | \
   ((uint64_t)(*(a + 4)) << 24) | ((uint64_t)(*(a + 5)) << 16) | \
   ((uint64_t)(*(a + 6)) << 8) | ((uint64_t)(*(a + 7))))

#define AS_UINT32(a)                                             \
  (((uint32_t)(*(a + 0)) << 24) | ((uint32_t)(*(a + 1)) << 16) | \
   ((uint32_t)(*(a + 2)) << 8) | ((uint32_t)(*(a + 3))))

#define RET_NULL_VIEW(type)            \
  type _null_view = {NULL, 0}; \
  return _null_view;

#define UINT256_EQ(lhs, rhs) (memcmp(lhs, rhs, 32) == 0)

#define UINT256_GT(lhs, rhs) (memcmp(lhs, rhs, 32) > 0)

#define UINT256_LT(lhs, rhs) (memcmp(lhs, rhs, 32) < 0)

#define SET_UINT256(to, from) (memcpy(to, from, 32))

DECLARE_VIEW_TYPE(view); // Unknown or unspecified type
DECLARE_VIEW_TYPE(compact_int);
DECLARE_VIEW_TYPE(scriptsig);
DECLARE_VIEW_TYPE(outpoint);
DECLARE_VIEW_TYPE(txin);
DECLARE_VIEW_TYPE(vin);
DECLARE_VIEW_TYPE(script_pubkey);
// DECLARE_VIEW_TYPE(pkh);
// DECLARE_VIEW_TYPE(wpkh);
// DECLARE_VIEW_TYPE(sh);
// DECLARE_VIEW_TYPE(wsh);
DECLARE_VIEW_TYPE(op_return);
DECLARE_VIEW_TYPE(txout);
DECLARE_VIEW_TYPE(vout);
DECLARE_VIEW_TYPE(header);
DECLARE_VIEW_TYPE(header_array);
DECLARE_VIEW_TYPE(merkle_node);
DECLARE_VIEW_TYPE(merkle_step);
DECLARE_VIEW_TYPE(merkle_array);

typedef view_t byte_view_t;

/// Error code
const uint64_t BTCSPV_ERR_BAD_ARG;

/// A 256-bit integer to support Bitcoin operations.
typedef uint8_t uint256[32];

// /// A simple memory view struct.
// typedef struct {
//   const uint8_t *loc;  /** A pointer to the start of the view */
//   const uint32_t len;  /** The number of bytes in the view */
// } byte_view_t;

/// Return type for parse_var_int. Contains information about VarInt structure
typedef struct {
  const uint32_t var_int_len;  /** The number of bytes of VarInt data */
  const uint64_t number; /** The number of bytes in the scriptsig */
} var_int_t;

// Utilities

/// @brief    equality for truncated and full-length Bitcoin targets
/// @note     Simplified logic is ``(trun & full) == trun`
/// @warning  Caller must ensure that both buffers have 32 bytes
bool btcspv_truncated_uint256_equality(const uint8_t *trun,
                                       const uint8_t *full);

/// @brief equality of 2 memory regions using `memcmp`
bool btcspv_buf_eq(const uint8_t *loc1, uint32_t len1, const uint8_t *loc2,
            uint32_t len2);

/// @brief equality between byte_view_t and any other buffer type.
/// @note  uses buf_eq under the hood
bool btcspv_view_eq_buf(const_view_t *view, const uint8_t *loc, uint32_t len);

/// @brief equality for byte_view_t.
/// @note  uses buf_eq under the hood
bool btcspv_view_eq(const_view_t *view1, const_view_t *view2);

/// @brief    reverse from, write reversed buffer to `to`
/// @warning  overwrites `to` with the reversed buffer
/// @warning  caller must ensure `to` is allocated and can hold `len` bytes
void btcspv_buf_rev(uint8_t *to, const uint8_t *from, uint32_t len);

// Hash Functions
/// @brief    RMD160(preimage)
/// @warning  overwrites `result`
/// @warning  caller must ensure `result` is allocated and can hold 20 bytes
void btcspv_ripemd160(uint8_t *result, const_view_t *preimage);

/// @brief    SHA256(preimage)
/// @warning  overwrites `result`
/// @warning  caller must ensure `result` is allocated and can hold 32 bytes
void btcspv_sha256(uint8_t *result, const_view_t *preimage);

/// @brief    RMD160(SHA256(preimage))
/// @warning  overwrites `result`
/// @warning  caller must ensure `result` is allocated and can hold 20 bytes
void btcspv_hash160(uint8_t *result, const_view_t *preimage);

/// @brief    SHA256(SHA256(preimage))
/// @warning  overwrites `result`
/// @warning  caller must ensure `result` is allocated and can hold 32 bytes
void btcspv_hash256(uint8_t *result, const_view_t *preimage);

/*
 * --- tx_in & vin Functions ---
 */

 /// @brief          Determines the length of a VarInt in bytes
 /// @note           A VarInt of >1 byte is prefixed with a flag indicating its length
 /// @param flag     The first byte of a VarInt
 /// @return         The number of non-flag bytes in the VarInt
uint8_t btcspv_determine_var_int_data_length(uint8_t tag);

/// @brief           Determines the serialized length of a compact int in bytes
/// @note            Always returns 1, 3, 5 or 9
/// @param number    The desrialized number
/// @return          The number of bytes in the serialized int, including the flag
uint8_t btcspv_compact_int_length(uint64_t number);


/// @brief           Parse a CompactInt to number it represents. First argument is the result
/// @note            Useful for Parsing Vins and Vouts. Returns false if insufficient bytes.
/// @param b         A byte-view starting with a VarInt
/// @return          A struct containing number of bytes in the encoding (not counting the tag) and the encoded int
/// @warning         Caller MUST check that it does not error
bool btcspv_parse_compact_int(uint64_t *result, const uint8_t *loc, uint32_t len);

/// @brief           Determines whether an input is legacy
/// @note            False if no scriptSig, otherwise True
/// @param input     The input
/// @return          True for legacy, False for witness
bool btcspv_is_legacy_input(const_txin_t *tx_in);

/// @brief           Extracts the LE sequence bytes from an input
/// @note            Sequence is used for relative time locks
/// @param input     The WITNESS input
/// @return          The sequence bytes (LE uint)
byte_view_t btcspv_extract_sequence_le_witness(const_txin_t *tx_in);

/// @brief           Extracts the sequence from the input in a tx
/// @note            Sequence is a 4-byte little-endian number
/// @param input     The WITNESS input
/// @return          The sequence number (big-endian uint)
uint32_t btcspv_extract_sequence_witness(const_txin_t *tx_in);

/// @brief           Determines the length of a scriptSig in an input
/// @note            Will return 0 if passed a witness input
/// @param input     The LEGACY input
/// @return          The length of the script sig
/// @warning         Caller MUST check that it does not error
bool btcspv_extract_script_sig_len(uint64_t *result, const_txin_t *tx_in);

/// @brief           Extracts the VarInt-prepended scriptSig from the input in a tx
/// @note            Will return hex"00" if passed a witness input
/// @param input     The LEGACY input
/// @return          The length-prepended script sig
/// @warning         Caller MUST check that it does not error
scriptsig_t btcspv_extract_script_sig(const_txin_t *tx_in);

/// @brief           Extracts the LE sequence bytes from an input
/// @note            Sequence is used for relative time locks
/// @param input     The LEGACY input
/// @return          The sequence bytes (LE uint)
byte_view_t btcspv_extract_sequence_le_legacy(const_txin_t *tx_in);

/// @brief           Extracts the sequence from the input
/// @note            Sequence is a 4-byte little-endian number
/// @param input     The LEGACY input
/// @return          The sequence number (big-endian uint)
uint32_t btcspv_extract_sequence_legacy(const_txin_t *tx_in);

/// @brief           Determines the length of an input from its scriptsig
/// @note            36 for outpoint, 1 for scriptsig length, 4 for sequence
/// @param input     The inputzf
/// @return          The length of the input in bytes
/// @warning         Caller MUST check that it does not error
bool btcspv_determine_input_length(uint64_t *result, const_txin_t *tx_in);

/// @brief           Extracts the nth input from the vin (0-indexed)
/// @note            Iterates over the vin. If you need to extract several, write a custom function
/// @param vin       The vin as a tightly-packed byte array
/// @param index     The 0-indexed location of the input to extract
/// @return          The input as a byte array
/// @warning         Caller must check that resulting view loc is not null, and/or len !=0.
txin_t btcspv_extract_input_at_index(const_vin_t *vin, uint64_t index);

/// @brief           Extracts the outpoint from the input in a tx
/// @note            32 byte tx id with 4 byte index
/// @param input     The input
/// @return          The outpoint (LE bytes of prev tx hash + LE bytes of prev tx index)
outpoint_t btcspv_extract_outpoint(const_txin_t *tx_in);

/// @brief           Extracts the outpoint tx id from an input
/// @note            32 byte tx id from outpoint
/// @param input     The input
/// @return          The tx id (little-endian bytes)
byte_view_t btcspv_extract_input_tx_id_le(const_txin_t *tx_in);

/// @brief           Extracts the LE tx input index from the input in a tx
/// @note            4 byte tx index
/// @param input     The input
/// @return          The tx index (little-endian bytes)
byte_view_t btcspv_extract_tx_index_le(const_txin_t *tx_in);

/// @brief           Extracts the tx input index from the input in a tx
/// @note            4 byte tx index
/// @param input     The input
/// @return          The tx index (big-endian uint)
uint32_t btcspv_extract_tx_index(const_txin_t *tx_in);

/*
 * --- tx_out & vout Functions ---
 */

/// @brief           Determines the length of an output, writes it to `number`
/// @note            5 types: WPKH, WSH, PKH, SH, and OP_RETURN
/// @param tx_out    The output
/// @return          The length indicated by the prefix, error if invalid length
/// @warning         Caller MUST check that it does not error
bool btcspv_determine_output_length(uint64_t *result, const_view_t *tx_out);

/// @brief           Extracts the output at a given index in the TxIns vector
/// @note            Iterates over the vout. If you need to extract multiple, write a custom function
/// @param vout      The _vout to extract from
/// @param index     The 0-indexed location of the output to extract
/// @return          The specified output
/// @warning         Caller must check that resulting view loc is not null, and/or len !=0.
txout_t btcspv_extract_output_at_index(const_vout_t *vout, uint64_t index);

/// @brief           Extracts the output script length
/// @note            Indexes the length prefix on the pk_script
/// @param tx_out    The output
/// @return          The 1 byte length prefix
uint32_t btcspv_extract_output_script_len(const_txout_t *tx_out);

/// @brief           Extracts the value bytes from the output in a tx
/// @note            Value is an 8-byte little-endian number
/// @param tx_out    The output
/// @return          The output value as LE bytes
byte_view_t btcspv_extract_value_le(const_txout_t *tx_out);

/// @brief           Extracts the value from the output in a tx
/// @note            Value is an 8-byte little-endian number
/// @param tx_out    The output
/// @return          The output value
uint64_t btcspv_extract_value(const_txout_t *tx_out);

/// @brief           Extracts the data from an op return output
/// @note            May return a null view, in case of parsing error
/// @param tx_out    The output
/// @return          Any data contained in the opreturn output, null if not an op return
/// @warning         Caller must check that resulting view loc is not null, and/or len !=0.
op_return_t btcspv_extract_op_return_data(const_txout_t *tx_out);

/// @brief           Extracts the data from an op return output
/// @note            May return a null view, in case of parsing error
/// @param tx_out    The output
/// @return          The script pubkey
/// @warning         Caller must check that resulting view loc is not null, and/or len !=0.
script_pubkey_t btcspv_extract_script_pubkey(const_txout_t *tx_out);

/// @brief           Extracts the hash from the output script
/// @note            Determines type by the length prefix and validates format
/// @param tx_out    The output
/// @return          The hash committed to by the pk_script, or null for errors
/// @warning         Caller must check that resulting view loc is not null, and/or len !=0.
byte_view_t btcspv_extract_hash(const_txout_t *tx_out);

/*
 * --- tx-validation Functions ---
 */

/// @brief       Checks that the vin passed up is properly formatted
/// @note        Consider a vin with a valid vout in its scriptsig
/// @param vin   Raw bytes length-prefixed input vector
/// @return      True if it represents a validly formatted vin
bool btcspv_validate_vin(const_vin_t *vin);

/// @brief       Checks that the vin passed up is properly formatted
/// @note        Consider a vin with a valid vout in its scriptsig
/// @param vout  Raw bytes length-prefixed output vector
/// @return      True if it represents a validly formatted bout
bool btcspv_validate_vout(const_vout_t *vout);

/*
 * --- header Functions ---
 */

 /// @brief           Extracts the transaction merkle root from a block header
 /// @note            Use verifyHash256Merkle to verify proofs with this root
 /// @param header    The header
 /// @return          The merkle root (little-endian)
byte_view_t btcspv_extract_merkle_root_le(const_header_t *header);

/// @brief           Extracts the target from a block header
/// @note            Target is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
/// @param header    The header
/// @warning         overwrites `target` with the LE target
/// @warning         caller must ensure `target` is allocated and can hold 32 bytes
void btcspv_extract_target_le(uint256 target, const_header_t *header);


/// @brief           Extracts the target from a block header
/// @note            Target is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
/// @param header    The header
/// @warning         overwrites `target` with the BE target
/// @warning         caller must ensure `target` is allocated and can hold 32 bytes
void btcspv_extract_target(uint256 target, const_header_t *header);

/// @brief           Calculate difficulty from the difficulty 1 target and current target
/// @note            Difficulty 1 is 0x1d00ffff on mainnet and testnet
/// @note            Difficulty 1 is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
/// @param target    The current target
/// @return          The block difficulty (bdiff)
/// @warning         Caller should check that output is non-0
uint64_t btcspv_calculate_difficulty(uint256 target);

/// @brief           Extracts the previous block's hash from a block header
/// @note            Block headers do NOT include block number :(
/// @param header    The header
/// @return          The previous block's hash (little-endian)
byte_view_t btcspv_extract_prev_block_hash_le(const_header_t *header);

/// @brief           Extracts the timestamp from a block header
/// @note            Time is not 100% reliable
/// @param header    The header
/// @return          The timestamp (little-endian bytes)
byte_view_t btcspv_extract_timestamp_le(const_header_t *header);

/// @brief           Extracts the timestamp from a block header
/// @note            Time is not 100% reliable
/// @param header    The header
/// @return          The timestamp (uint)
uint32_t btcspv_extract_timestamp(const_header_t *header);

/// @brief           Extracts the expected difficulty from a block header
/// @note            Does NOT verify the work
/// @param header    The header
/// @return          The difficulty as an integer
/// @warning         Caller should check that output is non-0
uint64_t btcspv_extract_difficulty(const_header_t *header);

/// @brief           Concatenates and hashes two inputs for merkle proving
/// @param a         The first hash
/// @param b         The second hash
/// @warning         overwrites `result` with the next merkle step
/// @warning         caller must ensure `result` is allocated and can hold 32 bytes
void btcspv_hash256_merkle_step(uint8_t *result, const_merkle_node_t *a,
                                const_merkle_node_t *b);

/// @brief           Verifies a Bitcoin-style merkle tree
/// @note            Leaves are 0-indexed.
/// @param proof     The proof. Tightly packed LE sha256 hashes. The last hash is the root
/// @param index     The index of the leaf
/// @return          true if the proof is valid, else false
/// @warning         `index` is not a reliable indicator of location within a block.
bool btcspv_verify_hash256_merkle(const_view_t *proof, uint32_t index);

/// @brief                  performs the bitcoin difficulty retarget
/// @note                   implements the Bitcoin algorithm precisely
/// @param previousTarget   the target of the previous period
/// @param firstTimestamp   the timestamp of the first block in the difficulty period
/// @param secondTimestamp  the timestamp of the last block in the difficulty period
/// @warning                overwrites `new_target` with the updated difficulty target
/// @warning                caller must ensure `new_target` is allocated and can hold 32 bytes
void btcspv_retarget_algorithm(uint256 new_target,
                               const uint256 previous_target,
                               uint32_t first_timestamp,
                               uint32_t second_timestamp);

#endif /* SUMMA_CKB_BTCSPV_H_ */
