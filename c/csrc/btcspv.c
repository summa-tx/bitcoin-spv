#include "rmd160.h"
#include "sha256.h"

#include "btcspv.h"

const uint64_t BTCSPV_ERR_BAD_ARG = 0xffffffff;


// Order matters
bool btcspv_truncated_uint256_equality(const uint8_t *trun,
                                       const uint8_t *full) {
  for (int i = 0; i < 32; i++) {
    if ((trun[i] & full[i]) != trun[i]) {
      return false;
    }
  }
  return true;
}

// equality for 2 buffers
bool btcspv_buf_eq(const uint8_t *loc1, uint32_t len1, const uint8_t *loc2,
            uint32_t len2) {
  if (len1 != len2) {
    return false;
  }
  return 0 == memcmp(loc1, loc2, len1);
}

// equality for a view and a buffer
bool btcspv_view_eq_buf(const_view_t *view, const uint8_t *loc, uint32_t len) {
  return btcspv_buf_eq(view->loc, view->len, loc, len);
}

// convenience function for view equality
bool btcspv_view_eq(const_view_t *view1, const_view_t *view2) {
  return btcspv_buf_eq(view1->loc, view1->len, view2->loc, view2->len);
}

// reverse a buffer
void btcspv_buf_rev(uint8_t *to, const uint8_t *from, uint32_t len) {
  for (int i = 0; i < len; i++) {
    to[len - 1 - i] = from[i];
  }
}

uint8_t btcspv_determine_var_int_data_length(uint8_t tag) {
  switch (tag) {
    case 0xfd:
      return 2;
    case 0xfe:
      return 4;
    case 0xff:
      return 8;
    default:
      return 0;
  }
}

var_int_t btcspv_parse_var_int(const_view_t *b) {
  uint64_t data_length = btcspv_determine_var_int_data_length(b->loc[0]);
  if (data_length == 0) {
    var_int_t result = {.var_int_len = 0, .number = b->loc[0]};
    return result;
  }

  if (b->len < 1 + data_length) {
    var_int_t result = {.var_int_len = BTCSPV_ERR_BAD_ARG, .number = 0};
    return result;
  }

  const_view_t payload = {.loc = b->loc + 1, .len = data_length};
  uint64_t number = 0;
  // lazy varlength LE bytes->uint
  for (uint8_t i = 0; i < data_length; i++) {
    number += payload.loc[i] * (0x01 << i * 8);
  }
  var_int_t result = {.var_int_len = data_length, .number = number};
  return result;
}

//
// Hash Functions
//

// pass in a 20-byte array to hold the result
void btcspv_ripemd160(uint8_t *result, const_view_t *preimage) {
  RMD160(result, preimage->loc, preimage->len);
}

// pass in a 32-byte array to hold the result
void btcspv_sha256(uint8_t *result, const_view_t *preimage) {
  SHA256_CTX sha256_ctx;
  sha256_init(&sha256_ctx);
  sha256_update(&sha256_ctx, preimage->loc, preimage->len);
  sha256_final(&sha256_ctx, result);
}

// pass in a 20-byte array to hold the result
void btcspv_hash160(uint8_t *result, const_view_t *preimage) {
  uint8_t intermediate[32];
  const_view_t intermediate_view = VIEW_FROM_ARR(intermediate);
  btcspv_sha256(intermediate, preimage);
  btcspv_ripemd160(result, &intermediate_view);
}

// pass in a 32-byte array to hold the result
void btcspv_hash256(uint8_t *result, const_view_t *preimage) {
  uint8_t intermediate[32];
  const_view_t intermediate_view = VIEW_FROM_ARR(intermediate);
  btcspv_sha256(intermediate, preimage);
  btcspv_sha256(result, &intermediate_view);
}

//
// Input Functions
//

bool btcspv_is_legacy_input(const_view_t *tx_in) {
  return (tx_in->loc)[36] != 0;
}

byte_view_t btcspv_extract_sequence_le_witness(const_view_t *tx_in) {
  byte_view_t seq = {tx_in->loc + 37, 4};
  return seq;
}

uint32_t btcspv_extract_sequence_witness(const_view_t *tx_in) {
  const_view_t seq = btcspv_extract_sequence_le_witness(tx_in);
  return AS_LE_UINT32(seq.loc);
}

script_sig_t btcspv_extract_script_sig_len(const_view_t *tx_in) {
  if (tx_in->len < 37) {
    script_sig_t result = {.var_int_len = BTCSPV_ERR_BAD_ARG, .script_sig_len = 0};
    return result;
  }

  const_view_t after_outpoint = {.loc = tx_in->loc + 36, .len = tx_in->len - 36};

  var_int_t var_int = btcspv_parse_var_int(&after_outpoint);

  script_sig_t res = {.var_int_len = var_int.var_int_len, .script_sig_len = var_int.number};
  return res;
}

byte_view_t btcspv_extract_script_sig(const_view_t *tx_in) {
  const script_sig_t ss = btcspv_extract_script_sig_len(tx_in);
  uint32_t length = 1 + ss.var_int_len + ss.script_sig_len;

  byte_view_t script_sig = {(tx_in->loc) + 36, length};
  return script_sig;
}

byte_view_t btcspv_extract_sequence_le_legacy(const_view_t *tx_in) {
  const script_sig_t ss = btcspv_extract_script_sig_len(tx_in);
  const uint32_t offset = 36 + 1 + ss.var_int_len + ss.script_sig_len;

  byte_view_t seq = {(tx_in->loc) + offset, 4};
  return seq;
}

uint32_t btcspv_extract_sequence_legacy(const_view_t *tx_in) {
  const_view_t seq = btcspv_extract_sequence_le_legacy(tx_in);
  return AS_LE_UINT32(seq.loc);
}

uint64_t btcspv_determine_input_length(const_view_t *tx_in) {
  const script_sig_t ss = btcspv_extract_script_sig_len(tx_in);
  if (ss.var_int_len == BTCSPV_ERR_BAD_ARG) {
    return BTCSPV_ERR_BAD_ARG;
  }
  return 41 + ss.var_int_len + ss.script_sig_len;
}

byte_view_t btcspv_extract_input_at_index(const_view_t *vin, uint64_t index) {
  var_int_t var_int = btcspv_parse_var_int(vin);

  if (var_int.number == 0 || var_int.var_int_len == BTCSPV_ERR_BAD_ARG) {
    RET_NULL_VIEW;
  }
  if (index >= var_int.number) {
    RET_NULL_VIEW;  // wanted to read more inputs than there are
  }

  uint32_t length = 0;
  uint32_t offset = 1 + var_int.var_int_len;

  for (int i = 0; i < index + 1; i++) {
    const_view_t remaining = {(vin->loc) + offset, (vin->len) - offset};
    length = btcspv_determine_input_length(&remaining);
    if (length == 0 || length == BTCSPV_ERR_BAD_ARG) {
      RET_NULL_VIEW;
    }
    if (i != index) {
      offset += length;
    }
  }

  if (offset + length > vin->len) {
    RET_NULL_VIEW;
  }

  byte_view_t input = {(vin->loc) + offset, length};
  return input;
}

byte_view_t btcspv_extract_outpoint(const_view_t *tx_in) {
  byte_view_t outpoint = {tx_in->loc, 36};
  return outpoint;
}

byte_view_t btcspv_extract_input_tx_id_le(const_view_t *tx_in) {
  byte_view_t tx_id_le = {tx_in->loc, 32};
  return tx_id_le;
}

byte_view_t btcspv_extract_tx_index_le(const_view_t *tx_in) {
  byte_view_t idx = {tx_in->loc + 32, 4};
  return idx;
}

uint32_t btcspv_extract_tx_index(const_view_t *tx_in) {
  const_view_t idx = btcspv_extract_tx_index_le(tx_in);
  return AS_LE_UINT32(idx.loc);
}

//
// Output Functions
//

uint64_t btcspv_determine_output_length(const_view_t *tx_out) {
  if (tx_out->len < 9) {
    return BTCSPV_ERR_BAD_ARG;
  }

  const_view_t after_value = {.loc = tx_out->loc + 8, .len = tx_out->len - 8};

  var_int_t var_int = btcspv_parse_var_int(&after_value);

  if (var_int.var_int_len == BTCSPV_ERR_BAD_ARG) {
    return BTCSPV_ERR_BAD_ARG;
  }

  return 8 + 1 + var_int.var_int_len + var_int.number;
}

byte_view_t btcspv_extract_output_at_index(const_view_t *vout, uint64_t index) {
  var_int_t var_int = btcspv_parse_var_int(vout);

  if (var_int.number == 0 || var_int.var_int_len == BTCSPV_ERR_BAD_ARG) {
    RET_NULL_VIEW;
  }
  if (index >= var_int.number) {
    RET_NULL_VIEW;
  }

  uint32_t length = 0;
  uint32_t offset = 1 + var_int.var_int_len;

  for (int i = 0; i < index + 1; i++) {
    const_view_t remaining = {(vout->loc) + offset, (vout->len) - offset};
    length = btcspv_determine_output_length(&remaining);
    if (length == 0 || length == BTCSPV_ERR_BAD_ARG) {
      RET_NULL_VIEW;
    }
    if (i != index) {
      offset += length;
    }
  }

  if (offset + length > vout->len) {
    RET_NULL_VIEW;
  }

  const_view_t tx_out = {(vout->loc) + offset, length};
  return tx_out;
}

uint32_t btcspv_extract_output_script_len(const_view_t *tx_out) {
  return tx_out->loc[8];
}

byte_view_t btcspv_extract_value_le(const_view_t *tx_out) {
  const_view_t val = {tx_out->loc, 8};
  return val;
}

uint64_t btcspv_extract_value(const_view_t *tx_out) {
  const_view_t val = btcspv_extract_value_le(tx_out);
  return AS_LE_UINT64(val.loc);
}

byte_view_t btcspv_extract_op_return_data(const_view_t *tx_out) {
  if (tx_out->loc[9] != 0x6a) {
    RET_NULL_VIEW;
  }
  uint8_t data_len = tx_out->loc[10];

  if (tx_out->len < data_len + 8 + 3) {
    RET_NULL_VIEW;
  }

  const_view_t payload = {tx_out->loc + 11, data_len};
  return payload;
}

byte_view_t btcspv_extract_hash(const_view_t *tx_out) {
  const_view_t tag = {tx_out->loc + 8, 3};

  if (tx_out->loc[9] == 0) {
    uint32_t script_len = btcspv_extract_output_script_len(tx_out) - 2;
    if (tx_out->loc[10] == script_len) {
      const_view_t payload = {tx_out->loc + 11, script_len};
      return payload;
    }
    RET_NULL_VIEW;
  }

  uint8_t P2PKH_PREFIX[3] = {0x19, 0x76, 0xa9};
  if (btcspv_view_eq_buf(&tag, P2PKH_PREFIX, 3)) {
    const_view_t last_two = {tx_out->loc + tx_out->len - 2, 2};
    uint8_t P2PKH_POSTFIX[2] = {0x88, 0xac};
    if (tx_out->loc[11] != 0x14 || !btcspv_view_eq_buf(&last_two, P2PKH_POSTFIX, 2)) {
      RET_NULL_VIEW;
    }
    const_view_t payload = {tx_out->loc + 12, 20};
    return payload;
  }

  uint8_t P2SH_PREFIX[3] = {0x17, 0xa9, 0x14};
  if (btcspv_view_eq_buf(&tag, P2SH_PREFIX, 3)) {
    if (tx_out->loc[tx_out->len - 1] != 0x87) {
      RET_NULL_VIEW;
    }
    const_view_t payload = {tx_out->loc + 11, 20};
    return payload;
  }

  RET_NULL_VIEW;
}

//
// Tx Functions
//

bool btcspv_validate_vin(const_view_t *vin) {
  var_int_t var_int = btcspv_parse_var_int(vin);

  if (var_int.number == 0 || var_int.var_int_len == BTCSPV_ERR_BAD_ARG) {
    return false;
  }

  uint64_t n_ins = var_int.number;
  uint64_t offset = 1 + var_int.var_int_len;

  for (int i = 0; i < n_ins; i++) {
    if (offset >= vin->len) {
      return false;
    }

    const_view_t remaining = {vin->loc + offset, vin->len - offset};
    uint64_t input_len = btcspv_determine_input_length(&remaining);
    if (input_len == BTCSPV_ERR_BAD_ARG) {
      return false;
    }

    offset += input_len;
  }
  return offset == vin->len;
}

bool btcspv_validate_vout(const_view_t *vout) {
  var_int_t var_int = btcspv_parse_var_int(vout);

  if (var_int.number == 0 || var_int.var_int_len == BTCSPV_ERR_BAD_ARG) {
    return false;
  }

  uint64_t n_ins = var_int.number;
  uint64_t offset = 1 + var_int.var_int_len;

  for (int i = 0; i < n_ins; i++) {
    if (offset >= vout->len) {
      return false;
    }

    const_view_t remaining = {vout->loc + offset, vout->len - offset};
    uint64_t output_len = btcspv_determine_output_length(&remaining);
    if (output_len == BTCSPV_ERR_BAD_ARG) {
      return false;
    }

    offset += output_len;
  }
  return offset == vout->len;
}

//
// Header Functions
//

byte_view_t btcspv_extract_merkle_root_le(const_view_t *header) {
  const_view_t root = {header->loc + 36, 32};
  return root;
}

void btcspv_extract_target_le(uint256 target, const_view_t *header) {
  uint8_t exponent = header->loc[75] - 3;
  target[exponent + 0] = header->loc[72];
  target[exponent + 1] = header->loc[73];
  target[exponent + 2] = header->loc[74];
}

void btcspv_extract_target(uint256 target, const_view_t *header) {
  uint256 target_le = {0};
  btcspv_extract_target_le(target_le, header);
  btcspv_buf_rev(target, target_le, 32);
}

uint64_t btcspv_calculate_difficulty(uint256 target) {
  uint64_t d1t = 0xffff000000000000;
  uint64_t t = AS_UINT64(target + 4);
  if (t == 0) {
    return 0;
  }
  return d1t / t;
}

byte_view_t btcspv_extract_prev_block_hash_le(const_view_t *header) {
  const_view_t prev_hash = {header->loc + 4, 32};
  return prev_hash;
}

byte_view_t btcspv_extract_timestamp_le(const_view_t *header) {
  const_view_t timestamp = {header->loc + 68, 4};
  return timestamp;
}

uint32_t btcspv_extract_timestamp(const_view_t *header) {
  const_view_t timestamp = btcspv_extract_timestamp_le(header);
  return AS_LE_UINT32(timestamp.loc);
}

uint64_t btcspv_extract_difficulty(const_view_t *header) {
  uint256 target = {0};
  btcspv_extract_target(target, header);
  return btcspv_calculate_difficulty(target);
}

void btcspv_hash256_merkle_step(uint8_t *result, const_view_t *a,
                                const_view_t *b) {
  uint8_t intermediate[32] = {0};

  SHA256_CTX sha256_ctx;
  sha256_init(&sha256_ctx);
  sha256_update(&sha256_ctx, a->loc, a->len);
  sha256_update(&sha256_ctx, b->loc, b->len);
  sha256_final(&sha256_ctx, intermediate);

  sha256_init(&sha256_ctx);
  sha256_update(&sha256_ctx, intermediate, 32);
  sha256_final(&sha256_ctx, result);
}

bool btcspv_verify_hash256_merkle(const_view_t *proof, uint32_t index) {
  uint32_t idx = index;
  if (proof->len % 32 != 0) {
    return false;
  }

  if (proof->len == 32) {
    return true;
  }

  if (proof->len == 64) {
    return false;
  }

  byte_view_t current = {proof->loc, 32};
  const_view_t root = {proof->loc + (proof->len - 32), 32};
  const uint32_t num_steps = (proof->len / 32) - 1;
  uint8_t hash[32] = {0};

  for (int i = 1; i < num_steps; i++) {
    const_view_t next = {proof->loc + (i * 32), 32};

    if (idx % 2 == 1) {
      btcspv_hash256_merkle_step(hash, &next, &current);
    } else {
      btcspv_hash256_merkle_step(hash, &current, &next);
    }
    current.loc = hash;
    idx >>= 1;
  }
  return btcspv_view_eq(&current, &root);
}

// new_target should be BE here
void btcspv_retarget_algorithm(uint256 new_target,
                               const uint256 previous_target,
                               uint32_t first_timestamp,
                               uint32_t second_timestamp) {
  uint32_t retarget_period = 1209600;
  uint32_t elapsed = second_timestamp - first_timestamp;

  uint32_t upper_bound = retarget_period * 4;
  uint32_t lower_bound = retarget_period / 4;

  if (elapsed > upper_bound) {
    elapsed = upper_bound;
  }
  if (elapsed < lower_bound) {
    elapsed = lower_bound;
  }

  // multiplication of previous by elapsed
  // doesn't overflow. takes least signficiant bits instead
  uint32_t carry = 0;
  for (int i = 31; i >= 0; i--) {
    uint64_t current = carry + previous_target[i] * elapsed;
    new_target[i] = current & 0xFF;
    carry = current / 256;
  }

  // long division in-place by retarget_period
  carry = 0;
  for (int i = 0; i < 32; i++) {
    uint64_t current = new_target[i] + carry * 256;
    new_target[i] = current / retarget_period;
    carry = current % retarget_period;
  }
}
