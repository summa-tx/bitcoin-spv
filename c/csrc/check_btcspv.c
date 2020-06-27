#include <check.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#include "btcspv.h"
#include "evalspv.h"
#include "test_utils.h"

void load_json_vectors(void) {
  read_test_vectors();
  parse_test_vectors();
}

void free_json_vectors(void) {
  free(test_vec_tokens);
  free(test_vec_js);
}

START_TEST(equalities) {
  uint256 a = {0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7,
               0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7};
  uint256 b = {0, 1, 2, 3, 4, 5, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0,
               0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
  uint256 c = {0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7,
               0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 8, 8, 8, 8};

  ck_assert(!btcspv_truncated_uint256_equality(a, b));  // order matters!
  ck_assert(btcspv_truncated_uint256_equality(b, a));

  ck_assert(!btcspv_truncated_uint256_equality(a, c));
  ck_assert(!btcspv_truncated_uint256_equality(c, a));

  ck_assert(btcspv_truncated_uint256_equality(b, c));  // order matters!
  ck_assert(!btcspv_truncated_uint256_equality(c, b));

  ck_assert(btcspv_buf_eq(a, 32, a, 32));
  ck_assert(!btcspv_buf_eq(a, 32, b, 32));
  ck_assert(!btcspv_buf_eq(b, 32, a, 32));
  ck_assert(!btcspv_buf_eq(a, 32, c, 32));
  ck_assert(!btcspv_buf_eq(c, 32, a, 32));
  ck_assert(!btcspv_buf_eq(b, 32, c, 32));
  ck_assert(!btcspv_buf_eq(c, 32, b, 32));

  // check shortcut non-equal lengths
  ck_assert(!btcspv_buf_eq(b, 32, c, 10));
  ck_assert(!btcspv_buf_eq(c, 10, b, 32));
}
END_TEST

START_TEST(prove) {
  TEST_LOOP_START("prove")

  size_t input_pos = val_pos_by_key(case_pos, "input");
  size_t tx_id_le_pos = val_pos_by_key(input_pos, "txIdLE");
  size_t root_pos = val_pos_by_key(input_pos, "merkleRootLE");
  size_t intermediate_nodes_pos = val_pos_by_key(input_pos, "proof");
  size_t idx_pos = val_pos_by_key(input_pos, "index");

  uint8_t *tx_id_buf;
  pos_as_hex_buf(&tx_id_buf, tx_id_le_pos);

  uint8_t *root_buf;
  pos_as_hex_buf(&root_buf, root_pos);

  uint8_t *nodes_buf;
  const uint32_t nodes_len = pos_as_hex_buf(&nodes_buf, intermediate_nodes_pos);
  const_merkle_array_t nodes = {nodes_buf, nodes_len};

  uint32_t idx = pos_as_long(idx_pos);

  bool expected = token_as_bool(output_tok);

  ck_assert(evalspv_prove(tx_id_buf, root_buf, &nodes, idx) == expected);

  TEST_LOOP_END
}
END_TEST

START_TEST(calculate_txid) {
  TEST_LOOP_START("calculateTxId")

  size_t input_pos = val_pos_by_key(case_pos, "input");
  size_t version_pos = val_pos_by_key(input_pos, "version");
  size_t vin_pos = val_pos_by_key(input_pos, "vin");
  size_t vout_pos = val_pos_by_key(input_pos, "vout");
  size_t locktime_pos = val_pos_by_key(input_pos, "locktime");

  uint8_t *version_buf;
  const uint32_t version_len = pos_as_hex_buf(&version_buf, version_pos);
  const_view_t version = {version_buf, version_len};

  uint8_t *vin_buf;
  const uint32_t vin_len = pos_as_hex_buf(&vin_buf, vin_pos);
  const_vin_t vin = {vin_buf, vin_len};

  uint8_t *vout_buf;
  const uint32_t vout_len = pos_as_hex_buf(&vout_buf, vout_pos);
  const_vout_t vout = {vout_buf, vout_len};

  uint8_t *locktime_buf;
  const uint32_t locktime_len = pos_as_hex_buf(&locktime_buf, locktime_pos);
  const_view_t locktime = {locktime_buf, locktime_len};

  uint8_t *expected_buf;
  token_as_hex_buf(&expected_buf, output_tok);

  uint256 actual_buf = {0};
  evalspv_calculate_txid(actual_buf, &version, &vin, &vout, &locktime);

  ck_assert(btcspv_buf_eq(expected_buf, 32, actual_buf, 32));

  free(version_buf);
  free(vin_buf);
  free(vout_buf);
  free(locktime_buf);
  free(expected_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(validate_header_work) {
  TEST_LOOP_START("validateHeaderWork")

  size_t input_pos = val_pos_by_key(case_pos, "input");
  size_t digest_pos = val_pos_by_key(input_pos, "digest");
  size_t target_pos = val_pos_by_key(input_pos, "target");

  uint8_t *digest_buf;
  pos_as_hex_buf(&digest_buf, digest_pos);

  uint8_t *target_buf;
  pos_as_hex_buf(&target_buf, target_pos);

  bool expected = token_as_bool(output_tok);
  bool actual = evalspv_validate_header_work(digest_buf, target_buf);

  ck_assert(expected == actual);

  free(digest_buf);
  free(target_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(validate_header_prev_hash) {
  TEST_LOOP_START("validateHeaderPrevHash")

  size_t input_pos = val_pos_by_key(case_pos, "input");
  size_t header_pos = val_pos_by_key(input_pos, "header");
  size_t prev_hash_pos = val_pos_by_key(input_pos, "prevHash");

  uint8_t *header_buf;
  uint32_t header_len = pos_as_hex_buf(&header_buf, header_pos);
  const_header_t header_view = {header_buf, header_len};

  uint8_t *prev_hash_buf;
  pos_as_hex_buf(&prev_hash_buf, prev_hash_pos);

  bool expected = token_as_bool(output_tok);
  bool actual = evalspv_validate_header_prev_hash(&header_view, prev_hash_buf);

  ck_assert(expected == actual);

  free(header_buf);
  free(prev_hash_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(validate_header_chain) {
  TEST_LOOP_START("validateHeaderChain")

  uint8_t *headers_buf;
  uint32_t headers_len = token_as_hex_buf(&headers_buf, input_tok);
  const_header_array_t headers_view = {headers_buf, headers_len};

  uint64_t expected = token_as_long(output_tok);
  uint64_t actual = evalspv_validate_header_chain(&headers_view);

  ck_assert_int_eq(actual, expected);

  free(headers_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(validate_header_chain_errors) {
  TEST_LOOP_START("validateHeaderChainError")

  uint8_t *headers_buf;
  uint32_t headers_len = token_as_hex_buf(&headers_buf, input_tok);
  const_header_array_t headers_view = {headers_buf, headers_len};

  size_t c_error_pos = val_pos_by_key(case_pos, "cError");

  uint8_t *expected_buf;
  pos_as_hex_buf(&expected_buf, c_error_pos);

  uint64_t actual = evalspv_validate_header_chain(&headers_view);

  ck_assert_int_eq(actual, AS_UINT64(expected_buf));

  free(headers_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(test_determine_var_int_data_length) {
  TEST_LOOP_START("determineVarIntDataLength")

  uint8_t input = token_as_long(input_tok);
  uint8_t actual = btcspv_determine_var_int_data_length(input);

  uint8_t expected = token_as_long(output_tok);

  ck_assert_int_eq(actual, expected);

  TEST_LOOP_END
}
END_TEST

START_TEST(hash160) {
  TEST_LOOP_START("hash160")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_view_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  uint8_t actual[20] = {0};
  btcspv_hash160(actual, &input);

  ck_assert(btcspv_buf_eq(actual, 20, expected.loc, expected.len));

  free(expected_buf);
  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(hash256) {
  TEST_LOOP_START("hash256")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_view_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  uint8_t actual[32] = {0};
  btcspv_hash256(actual, &input);

  ck_assert(btcspv_buf_eq(actual, 32, expected.loc, expected.len));

  free(expected_buf);
  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(is_legacy_input) {
  TEST_LOOP_START("isLegacyInput")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_view_t input = {input_buf, input_len};

  const_txin_t txin = VIEW_FROM_VIEW(input);
  bool actual = btcspv_is_legacy_input(&txin);
  bool expected = token_as_bool(output_tok);

  ck_assert(actual == expected);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_sequence_le_witness) {
  TEST_LOOP_START("extractSequenceLEWitness")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txin_t txin = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_view_t actual = btcspv_extract_sequence_le_witness(&txin);

  ck_assert(btcspv_view_eq(&actual, &expected));

  free(input_buf);
  free(expected_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_sequence_witness) {
  TEST_LOOP_START("extractSequenceWitness")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txin_t txin = {input_buf, input_len};

  uint32_t expected = token_as_long(output_tok);

  uint32_t actual = btcspv_extract_sequence_witness(&txin);

  ck_assert_int_eq(actual, expected);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_script_sig_len) {
  TEST_LOOP_START("extractScriptSigLen")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txin_t input = {input_buf, input_len};

  size_t output1 = val_pos_by_key(case_pos, "output") + 1;
  size_t output2 = after(output1);

  uint32_t expected_var_int_len = pos_as_long(output1);
  uint32_t expected_script_sig_len = pos_as_long(output2);

  uint64_t actual = 0;
  bool success = btcspv_extract_script_sig_len(&actual, &input);

  ck_assert(success);
  ck_assert_int_eq(btcspv_compact_int_length(actual) - 1, expected_var_int_len);
  ck_assert_int_eq(actual, expected_script_sig_len);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_script_sig) {
  TEST_LOOP_START("extractScriptSig")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txin_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_scriptsig_t actual = btcspv_extract_script_sig(&input);
  ck_assert(btcspv_buf_eq(actual.loc, actual.len, expected.loc, expected.len));

  free(input_buf);
  free(expected_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_sequence_le_legacy) {
  TEST_LOOP_START("extractSequenceLELegacy")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txin_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_view_t actual = btcspv_extract_sequence_le_legacy(&input);

  ck_assert(btcspv_view_eq(&actual, &expected));

  free(input_buf);
  free(expected_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_sequence_legacy) {
  TEST_LOOP_START("extractSequenceLegacy")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txin_t input = {input_buf, input_len};

  uint32_t expected = token_as_long(output_tok);

  uint32_t actual = btcspv_extract_sequence_legacy(&input);

  ck_assert_int_eq(actual, expected);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(determine_input_length) {
  TEST_LOOP_START("determineInputLength")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txin_t input = {input_buf, input_len};

  uint32_t expected = token_as_long(output_tok);

  uint64_t actual = 0;
  bool success = btcspv_determine_input_length(&actual, &input);

  ck_assert(success);
  ck_assert_int_eq(actual, expected);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_input_at_index) {
  TEST_LOOP_START("extractInputAtIndex")

  size_t input_obj_pos = val_pos_by_key(case_pos, "input");
  size_t vin_val_pos = val_pos_by_key(input_obj_pos, "vin");
  size_t idx_pos = val_pos_by_key(input_obj_pos, "index");

  uint8_t *vin_buf;
  const uint32_t vin_buf_len =
      token_as_hex_buf(&vin_buf, &test_vec_tokens[vin_val_pos]);
  const_vin_t vin_view = {vin_buf, vin_buf_len};

  uint8_t input_index = token_as_long(&test_vec_tokens[idx_pos]);

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_txin_t actual = btcspv_extract_input_at_index(&vin_view, input_index);

  ck_assert(btcspv_view_eq_buf(&expected, actual.loc, actual.len));

  free(vin_buf);
  free(expected_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_input_at_index_error) {
  TEST_LOOP_START("extractInputAtIndexError")

  size_t input_obj_pos = val_pos_by_key(case_pos, "input");
  size_t vin_val_pos = val_pos_by_key(input_obj_pos, "vin");
  size_t idx_pos = val_pos_by_key(input_obj_pos, "index");

  uint8_t *vin_buf;
  const uint32_t vin_buf_len =
      token_as_hex_buf(&vin_buf, &test_vec_tokens[vin_val_pos]);
  const_vin_t vin_view = {vin_buf, vin_buf_len};

  uint8_t input_index = token_as_long(&test_vec_tokens[idx_pos]);

  const_txin_t actual = btcspv_extract_input_at_index(&vin_view, input_index);

  ck_assert(actual.loc == NULL);
  ck_assert_int_eq(actual.len, 0);

  free(vin_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_outpoint) {
  TEST_LOOP_START("extractOutpoint")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txin_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_outpoint_t actual = btcspv_extract_outpoint(&input);

  ck_assert(btcspv_buf_eq(actual.loc, actual.len, expected.loc, expected.len));
  free(input_buf);
  free(expected_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_input_tx_id_le) {
  TEST_LOOP_START("extractInputTxIdLE")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txin_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_view_t actual = btcspv_extract_input_tx_id_le(&input);

  ck_assert(btcspv_view_eq(&actual, &expected));

  free(input_buf);
  free(expected_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_tx_index_le) {
  TEST_LOOP_START("extractTxIndexLE")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txin_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_view_t actual = btcspv_extract_tx_index_le(&input);

  ck_assert(btcspv_view_eq(&actual, &expected));

  free(input_buf);
  free(expected_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_tx_index) {
  TEST_LOOP_START("extractTxIndex")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txin_t input = {input_buf, input_len};

  uint32_t expected = token_as_long(output_tok);

  uint32_t actual = btcspv_extract_tx_index(&input);

  ck_assert_int_eq(actual, expected);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(determine_output_length) {
  TEST_LOOP_START("determineOutputLength")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_view_t input = {input_buf, input_len};

  uint32_t expected = token_as_long(output_tok);

  uint64_t actual = 0;
  bool success = btcspv_determine_output_length(&actual, &input);

  ck_assert(success);
  ck_assert_int_eq(actual, expected);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_output_at_index) {
  TEST_LOOP_START("extractOutputAtIndex")

  size_t input_obj_pos = val_pos_by_key(case_pos, "input");
  size_t vout_val_pos = val_pos_by_key(input_obj_pos, "vout");
  size_t idx_pos = val_pos_by_key(input_obj_pos, "index");

  uint8_t *vout_buf;
  const uint32_t vout_buf_len =
      token_as_hex_buf(&vout_buf, &test_vec_tokens[vout_val_pos]);
  const_vout_t vout_view = {vout_buf, vout_buf_len};

  uint8_t input_index = token_as_long(&test_vec_tokens[idx_pos]);

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_txout_t actual = btcspv_extract_output_at_index(&vout_view, input_index);

  ck_assert(actual.loc != NULL);
  ck_assert_int_ne(actual.len, 0);
  ck_assert(btcspv_buf_eq(actual.loc, actual.len, expected.loc, expected.len));

  free(vout_buf);
  free(expected_buf);

  TEST_LOOP_END
}
END_TEST


START_TEST(extract_output_at_index_error) {
  TEST_LOOP_START("extractOutputAtIndexError")

  size_t input_obj_pos = val_pos_by_key(case_pos, "input");
  size_t vout_val_pos = val_pos_by_key(input_obj_pos, "vout");
  size_t idx_pos = val_pos_by_key(input_obj_pos, "index");

  uint8_t *vout_buf;
  const uint32_t vout_buf_len =
      token_as_hex_buf(&vout_buf, &test_vec_tokens[vout_val_pos]);
  const_vout_t vout_view = {vout_buf, vout_buf_len};

  uint8_t output_index = token_as_long(&test_vec_tokens[idx_pos]);
  const_txout_t actual = btcspv_extract_output_at_index(&vout_view, output_index);

  ck_assert(actual.loc == NULL);
  ck_assert_int_eq(actual.len, 0);

  free(vout_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_value_le) {
  TEST_LOOP_START("extractValueLE")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txout_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_view_t actual = btcspv_extract_value_le(&input);

  ck_assert(btcspv_view_eq(&actual, &expected));

  free(input_buf);
  free(expected_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_value) {
  TEST_LOOP_START("extractValue")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txout_t input = {input_buf, input_len};

  uint32_t expected = token_as_long(output_tok);

  uint64_t actual = btcspv_extract_value(&input);

  ck_assert_int_eq(actual, expected);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_op_return_data) {
  TEST_LOOP_START("extractOpReturnData")
  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txout_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_op_return_t actual = btcspv_extract_op_return_data(&input);

  ck_assert(actual.loc != NULL);
  ck_assert_int_ne(actual.len, 0);
  ck_assert(btcspv_buf_eq(actual.loc, actual.len, expected.loc, expected.len));

  free(input_buf);
  free(expected_buf);
  TEST_LOOP_END
}
END_TEST

START_TEST(extract_op_return_data_error) {
  TEST_LOOP_START("extractOpReturnDataError")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txout_t input = {input_buf, input_len};

  const_op_return_t actual = btcspv_extract_op_return_data(&input);

  ck_assert(actual.loc == NULL);
  ck_assert_int_eq(actual.len, 0);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_hash) {
  TEST_LOOP_START("extractHash")
  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txout_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_view_t actual = btcspv_extract_hash(&input);

  ck_assert(btcspv_view_eq(&actual, &expected));

  free(input_buf);
  free(expected_buf);
  TEST_LOOP_END
}
END_TEST

START_TEST(extract_hash_error) {
  TEST_LOOP_START("extractHashError")
  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_txout_t input = {input_buf, input_len};

  const_view_t actual = btcspv_extract_hash(&input);

  ck_assert(actual.loc == NULL);
  ck_assert_int_eq(actual.len, 0);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(validate_vin) {
  TEST_LOOP_START("validateVin")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_vin_t input = {input_buf, input_len};

  bool actual = btcspv_validate_vin(&input);
  bool expected = token_as_bool(output_tok);

  ck_assert(actual == expected);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(validate_vout) {
  TEST_LOOP_START("validateVout")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_vout_t input = {input_buf, input_len};

  bool actual = btcspv_validate_vout(&input);
  bool expected = token_as_bool(output_tok);

  ck_assert(actual == expected);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_target) {
  TEST_LOOP_START("extractTarget")
  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_header_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  uint256 target = {0};
  btcspv_extract_target(target, &input);
  ck_assert(btcspv_view_eq_buf(&expected, target, 32));

  // also check that extractDifficulty is working

  uint64_t extracted = btcspv_extract_difficulty(&input);
  uint64_t calculated = btcspv_calculate_difficulty(target);
  ck_assert_int_eq(calculated, extracted);

  free(input_buf);
  free(expected_buf);
  TEST_LOOP_END
}
END_TEST

START_TEST(extract_timestamp) {
  TEST_LOOP_START("extractTimestamp")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_header_t input = {input_buf, input_len};

  uint32_t expected = token_as_long(output_tok);

  uint32_t actual = btcspv_extract_timestamp(&input);

  ck_assert_int_eq(actual, expected);

  free(input_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(extract_merkle_root_le) {
  TEST_LOOP_START("extractMerkleRootLE")

  uint8_t *input_buf;
  const uint32_t input_len = token_as_hex_buf(&input_buf, input_tok);
  const_header_t input = {input_buf, input_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  const_view_t actual = btcspv_extract_merkle_root_le(&input);

  ck_assert(btcspv_view_eq(&actual, &expected));

  free(input_buf);
  free(expected_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(hash256_merkle_step) {
  TEST_LOOP_START("hash256MerkleStep")

  size_t input_array_pos = val_pos_by_key(case_pos, "input");
  size_t a_val_pos = input_array_pos + 1;  // first array item
  size_t b_val_pos = input_array_pos + 2;  // second array item

  uint8_t *a_buf;
  const uint32_t a_len = token_as_hex_buf(&a_buf, &test_vec_tokens[a_val_pos]);
  const_merkle_node_t a = {a_buf, a_len};

  uint8_t *b_buf;
  const uint32_t b_len = token_as_hex_buf(&b_buf, &test_vec_tokens[b_val_pos]);
  const_merkle_node_t b = {b_buf, b_len};

  uint8_t *expected_buf;
  const uint32_t expected_len = token_as_hex_buf(&expected_buf, output_tok);
  const_view_t expected = {expected_buf, expected_len};

  uint8_t hash[32] = {0};
  btcspv_hash256_merkle_step(hash, &a, &b);

  ck_assert(btcspv_view_eq_buf(&expected, hash, 32));

  free(a_buf);
  free(b_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(verify_hash256_merkle) {
  TEST_LOOP_START("verifyHash256Merkle")

  size_t input_obj_pos = val_pos_by_key(case_pos, "input");
  size_t proof_pos = val_pos_by_key(input_obj_pos, "proof");
  size_t idx_pos = val_pos_by_key(input_obj_pos, "index");

  uint8_t *proof_buf;
  const uint32_t proof_buf_len =
      token_as_hex_buf(&proof_buf, &test_vec_tokens[proof_pos]);
  const_view_t proof_view = {proof_buf, proof_buf_len};

  uint32_t idx = token_as_long(&test_vec_tokens[idx_pos]);

  bool expected = token_as_bool(output_tok);
  bool actual = btcspv_verify_hash256_merkle(&proof_view, idx);
  ck_assert(actual == expected);

  free(proof_buf);

  TEST_LOOP_END
}
END_TEST

START_TEST(retarget_algorithm) {
  TEST_LOOP_START("retargetAlgorithm")
  size_t input_array_pos = val_pos_by_key(case_pos, "input");
  size_t first_header = input_array_pos + 1;
  size_t second_header = after(first_header);
  size_t third_header = after(second_header);

  size_t first_timestamp_pos = val_pos_by_key(first_header, "timestamp");
  uint32_t first_timestamp = pos_as_long(first_timestamp_pos);
  size_t first_header_raw_pos = val_pos_by_key(first_header, "hex");

  uint8_t *first_header_raw_buf;
  const uint32_t first_header_raw_len = token_as_hex_buf(
      &first_header_raw_buf, &test_vec_tokens[first_header_raw_pos]);
  const_header_t first_header_raw = {first_header_raw_buf, first_header_raw_len};

  size_t second_timestamp_pos = val_pos_by_key(second_header, "timestamp");
  uint32_t second_timestamp = pos_as_long(second_timestamp_pos);

  size_t third_header_raw_pos = val_pos_by_key(third_header, "hex");
  uint8_t *third_header_raw_buf;
  const uint32_t third_header_raw_len = token_as_hex_buf(
      &third_header_raw_buf, &test_vec_tokens[third_header_raw_pos]);
  const_header_t third_header_raw = {third_header_raw_buf, third_header_raw_len};

  uint256 previous = {0};
  btcspv_extract_target(previous, &first_header_raw);

  uint256 expected = {0};
  btcspv_extract_target(expected, &third_header_raw);

  uint256 actual = {0};
  btcspv_retarget_algorithm(actual, previous, first_timestamp,
                            second_timestamp);

  ck_assert(btcspv_truncated_uint256_equality(expected, actual));

  // additionally check 4x cap
  // long
  uint32_t long_second_timestamp = first_timestamp + 5 * 2016 * 10 * 60;
  uint256 longRes = {0};
  btcspv_retarget_algorithm(longRes, previous, first_timestamp,
                            long_second_timestamp);
  // TODO: assertion

  // short
  uint32_t short_second_timestamp = first_timestamp + 5 * 2016 * 10 * 60;
  uint256 shortRes = {0};
  btcspv_retarget_algorithm(shortRes, previous, first_timestamp,
                            short_second_timestamp);

  // TODO: assertion

  free(first_header_raw_buf);
  free(third_header_raw_buf);

  TEST_LOOP_END
}
END_TEST

int main(int argc, char *argv[]) {
  Suite *btcspv_suite = suite_create("btcspv");
  TCase *btcspv_case = tcase_create("btcspv");
  SRunner *sr = srunner_create(btcspv_suite);
  int number_failed;

  tcase_add_unchecked_fixture(btcspv_case, load_json_vectors,
                              free_json_vectors);

  tcase_add_test(btcspv_case, equalities);
  tcase_add_test(btcspv_case, test_determine_var_int_data_length);
  tcase_add_test(btcspv_case, hash160);
  tcase_add_test(btcspv_case, hash256);
  tcase_add_test(btcspv_case, is_legacy_input);
  tcase_add_test(btcspv_case, extract_sequence_le_witness);
  tcase_add_test(btcspv_case, extract_sequence_witness);
  tcase_add_test(btcspv_case, extract_script_sig_len);
  tcase_add_test(btcspv_case, extract_script_sig);
  tcase_add_test(btcspv_case, extract_sequence_le_legacy);
  tcase_add_test(btcspv_case, extract_sequence_legacy);
  tcase_add_test(btcspv_case, determine_input_length);
  tcase_add_test(btcspv_case, extract_input_at_index);
  tcase_add_test(btcspv_case, extract_input_at_index_error);
  tcase_add_test(btcspv_case, extract_outpoint);
  tcase_add_test(btcspv_case, extract_input_tx_id_le);
  tcase_add_test(btcspv_case, extract_tx_index_le);
  tcase_add_test(btcspv_case, extract_tx_index);
  tcase_add_test(btcspv_case, determine_output_length);
  tcase_add_test(btcspv_case, extract_output_at_index);
  tcase_add_test(btcspv_case, extract_output_at_index_error);
  tcase_add_test(btcspv_case, extract_value_le);
  tcase_add_test(btcspv_case, extract_value);
  tcase_add_test(btcspv_case, extract_op_return_data);
  tcase_add_test(btcspv_case, extract_op_return_data_error);
  tcase_add_test(btcspv_case, extract_hash);
  tcase_add_test(btcspv_case, extract_hash_error);
  tcase_add_test(btcspv_case, validate_vin);
  tcase_add_test(btcspv_case, validate_vout);
  tcase_add_test(btcspv_case, extract_target);
  tcase_add_test(btcspv_case, extract_merkle_root_le);
  tcase_add_test(btcspv_case, extract_timestamp);
  tcase_add_test(btcspv_case, hash256_merkle_step);
  tcase_add_test(btcspv_case, verify_hash256_merkle);
  tcase_add_test(btcspv_case, retarget_algorithm);

  tcase_add_test(btcspv_case, prove);
  tcase_add_test(btcspv_case, calculate_txid);
  tcase_add_test(btcspv_case, validate_header_work);
  tcase_add_test(btcspv_case, validate_header_prev_hash);
  tcase_add_test(btcspv_case, validate_header_chain);
  tcase_add_test(btcspv_case, validate_header_chain_errors);

  suite_add_tcase(btcspv_suite, btcspv_case);

  srunner_run_all(sr, CK_ENV);
  number_failed = srunner_ntests_failed(sr);
  srunner_free(sr);

  return number_failed == 0 ? 0 : 1;
}
