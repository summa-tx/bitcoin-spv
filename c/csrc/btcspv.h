#ifndef SUMMA_CKB_BTCSPV_H_
#define SUMMA_CKB_BTCSPV_H_

#include "stdbool.h"  // CKB override
#include "stdint.h"   // CKB override

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

#define RET_NULL_VIEW                  \
  const_view_t _null_view = {NULL, 0}; \
  return _null_view;

#define UINT256_EQ(lhs, rhs) (memcmp(lhs, rhs, 32) == 0)

#define UINT256_GT(lhs, rhs) (memcmp(lhs, rhs, 32) > 0)

#define UINT256_LT(lhs, rhs) (memcmp(lhs, rhs, 32) < 0)

#define SET_UINT256(to, from) (memcpy(to, from, 32))

typedef uint8_t uint256[32];

struct byte_view_struct {
  const uint8_t *loc;
  const uint32_t len;
};

// return type for extract_script_sig_len
struct script_sig_struct {
  const uint32_t var_int_len;
  const uint32_t script_sig_len;
};

// quickaccess aliases
typedef struct byte_view_struct byte_view_t;
typedef const byte_view_t const_view_t;
typedef const struct script_sig_struct script_sig_t;

// Utilities
bool btcspv_truncated_uint256_equality(const uint8_t *trun,
                                       const uint8_t *full);
bool buf_eq(const uint8_t *loc1, uint32_t len1, const uint8_t *loc2,
            uint32_t len2);
bool view_eq_buf(const_view_t *view, const uint8_t *loc, uint32_t len);
bool view_eq(const_view_t *view1, const_view_t *view2);
void buf_rev(uint8_t *to, const uint8_t *from, uint32_t len);
uint8_t btcspv_determine_var_int_data_length(uint8_t tag);

// Hash Functions
void btcspv_ripemd160(uint8_t *result, const_view_t *preimage);
void btcspv_sha256(uint8_t *result, const_view_t *preimage);
void btcspv_hash160(uint8_t *result, const_view_t *preimage);
void btcspv_hash256(uint8_t *result, const_view_t *preimage);

// Input & vin Functions
bool btcspv_is_legacy_input(const_view_t *tx_in);
byte_view_t btcspv_extract_sequence_le_witness(const_view_t *tx_in);
uint32_t btcspv_extract_sequence_witness(const_view_t *tx_in);
script_sig_t btcspv_extract_script_sig_len(const_view_t *tx_in);
byte_view_t btcspv_extract_script_sig(const_view_t *tx_in);
byte_view_t btcspv_extract_sequence_le_legacy(const_view_t *tx_in);
uint32_t btcspv_extract_sequence_legacy(const_view_t *tx_in);
uint32_t btcspv_determine_input_length(const_view_t *tx_in);
byte_view_t btcspv_extract_input_at_index(const_view_t *vin, uint8_t index);
byte_view_t btcspv_extract_outpoint(const_view_t *tx_in);
byte_view_t btcspv_extract_input_tx_id_le(const_view_t *tx_in);
byte_view_t btcspv_extract_tx_index_le(const_view_t *tx_in);
uint32_t btcspv_extract_tx_index(const_view_t *tx_in);

// Output & vout Functions
uint32_t btcspv_determine_output_length(const_view_t *tx_out);
byte_view_t btcspv_extract_output_at_index(const_view_t *vout, uint8_t index);
uint32_t btcspv_extract_output_script_len(const_view_t *tx_out);
byte_view_t btcspv_extract_value_le(const_view_t *tx_out);
uint64_t btcspv_extract_value(const_view_t *tx_out);
byte_view_t btcspv_extract_op_return_data(const_view_t *tx_out);
byte_view_t btcspv_extract_hash(const_view_t *tx_out);

// Tx Functions
bool btcspv_validate_vin(const_view_t *vin);
bool btcspv_validate_vout(const_view_t *vout);

// Header Functions
byte_view_t btcspv_extract_merkle_root_le(const_view_t *header);
void btcspv_extract_merkle_root_be(uint256 hash, const_view_t *header);
void btcspv_extract_target_le(uint256 target, const_view_t *header);
void btcspv_extract_target(uint256 target, const_view_t *header);
uint64_t btcspv_calculate_difficulty(uint256 target);
byte_view_t btcspv_extract_prev_block_hash_le(const_view_t *header);
void btcspv_extract_prev_block_hash_be(uint256 hash, const_view_t *header);
byte_view_t btcspv_extract_timestamp_le(const_view_t *header);
uint32_t btcspv_extract_timestamp(const_view_t *header);
uint64_t btcspv_extract_difficulty(const_view_t *header);
void btcspv_hash256_merkle_step(uint8_t *result, const_view_t *a,
                                const_view_t *b);
bool btcspv_verify_hash256_merkle(const_view_t *proof, uint32_t index);
void btcspv_retarget_algorithm(uint256 new_target,
                               const uint256 previous_target,
                               uint32_t first_timestamp,
                               uint32_t second_timestamp);

#endif /* SUMMA_CKB_BTCSPV_H_ */
