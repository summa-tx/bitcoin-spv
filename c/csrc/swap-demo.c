/*
 * A Proof of Concept SPV proof verifier
 * Includes the SPV Proof libraries
 *
 * Currently broken:
 *   When loading the output script hash,
 *   the buffer does not start with 0xd7.
 *   Instead, it starts with 0xd8 and I
 *   don't know why
 *
 * Future work:
 *  should load args Script args
 *
 */

// ckb
#include "ckb_consts.h"
#include "ckb_syscalls.h"

#include "btcspv.c"
#include "btcspv.h"
#include "evalspv.c"
#include "evalspv.h"

#include "blockchain.h"

#define ERROR_ENCODING -2
#define ERROR_SYSCALL -3

#define ERROR_WITNESS_SIZE -22

#define ERROR_BAD_WITNESS -100
#define ERROR_BAD_VIN -101
#define ERROR_BAD_VOUT -102
#define ERROR_INVALID_MERKLE_PROOF -103
#define ERROR_INVALID_HEADER_CHAIN -104
#define ERROR_LOW_WORK_HEADER_CHAIN -105
#define ERROR_NOT_ENOUGH_WORK -106
#define ERROR_WRONG_PAYEE -107
#define ERROR_NOT_ENOUGH_OUTPUT_CAPACITY -108
#define ERROR_WRONG_LISTING -109

#define MAX_WITNESS_SIZE 32768
#define SCRIPT_SIZE 32768

/*
 * Args:
 * - 8-bytes amount of CKB being sold
 * - 8-byte work requirement
 * - 36-byte outpoint
 */
#define SCRIPT_ARGS_SIZE (8 + 8 + 36)
bool load_args(uint8_t *view) {
  /* Load args */
  int ret;
  uint64_t len = 0;
  unsigned char script[SCRIPT_SIZE];

  len = SCRIPT_SIZE;
  ret = ckb_load_script(script, &len, 0);

  if (ret != CKB_SUCCESS) {
    return false;
  }

  if (len > SCRIPT_SIZE) {
    return false;
  }

  mol_seg_t script_seg;
  script_seg.ptr = (uint8_t *)script;
  script_seg.size = len;
  if (MolReader_Script_verify(&script_seg, false) != MOL_OK) {
    return false;
  }

  mol_seg_t args_seg = MolReader_Script_get_args(&script_seg);
  mol_seg_t args_bytes_seg = MolReader_Bytes_raw_bytes(&args_seg);

  if (args_bytes_seg.size != SCRIPT_ARGS_SIZE) {
    return false;
  }

  memcpy(view, args_bytes_seg.ptr, SCRIPT_ARGS_SIZE);
  return true;
}

header_array_t extract_headers(const_view_t *wit) {
  uint8_t num_headers = wit->loc[0];

  // drop the length prefix
  const_header_array_t headers = {wit->loc + 1, 80 * num_headers};
  return headers;
}

byte_view_t extract_intermediate_nodes(const_view_t *wit, uint32_t offset) {
  uint32_t num_nodes = wit->loc[offset];

  // drop the length prefix
  byte_view_t nodes = {wit->loc + 1 + offset, 32 * num_nodes};
  return nodes;
}

const_vin_t extract_vin(const_view_t *wit, uint32_t offset) {
  const_vin_t tmp_vin = {wit->loc + offset, wit->len - offset};
  const uint8_t num_ins = tmp_vin.loc[0];

  uint32_t vin_bytes = 1;

  for (int i = 0; i < num_ins; i++) {
    const_txin_t input = btcspv_extract_input_at_index(&tmp_vin, i);
    vin_bytes += input.len;
  }

  const_vin_t vin = {wit->loc + offset, vin_bytes};
  return vin;
}

const_vout_t extract_vout(const_view_t *wit, uint32_t offset) {
  const_vout_t tmp_vout = {wit->loc + offset, wit->len - offset};
  const uint8_t num_outs = tmp_vout.loc[0];

  uint32_t vout_bytes = 1;

  for (int i = 0; i < num_outs; i++) {
    const_txout_t output = btcspv_extract_output_at_index(&tmp_vout, i);
    vout_bytes += output.len;
  }

  const_vout_t vout = {wit->loc + offset, vout_bytes};
  return vout;
}

/*
 * Witness:
 * - Inclusion proof
 * --- length-prefixed header vector
 * --- length-prefixed intermediate-node vector
 * --- 4-byte LE tx index number
 * - Bitcoin tx
 * --- 4-byte version number
 * --- length-prefixed input vector
 * --- length-prefixed output vector containing address
 * --- 4-byte locktime number
 */
int main() {
  // Load arguments
  uint8_t args[SCRIPT_ARGS_SIZE];
  bool loaded = load_args(args);
  if (!loaded) {
    return ERROR_ENCODING;
  }

  // Load witness of first input
  // This has 20 bytes at the front, and 8 at the end, and I don't understand
  // why
  // Oh it's because it's molecule
  // TODO: rewrite this to use molecule :)
  uint8_t witness[MAX_WITNESS_SIZE];
  uint64_t witness_len = MAX_WITNESS_SIZE;
  int wit_load_ret =
      ckb_load_witness(witness, &witness_len, 0, 0, CKB_SOURCE_GROUP_INPUT);
  if (wit_load_ret != CKB_SUCCESS) {
    return ERROR_SYSCALL;
  }
  if (witness_len > MAX_WITNESS_SIZE) {
    return ERROR_WITNESS_SIZE;
  }

  //
  // Extract elements of the witness
  //

  // This is our witness view. We'll parse headers, etc, out of it.
  uint32_t offset = 0;
  const_view_t wit = {witness + 20, witness_len - 20 - 8};

  const_header_array_t headers = extract_headers(&wit);
  offset += 1 + headers.len;

  const_view_t intermediate_nodes = extract_intermediate_nodes(&wit, offset);
  offset += 1 + intermediate_nodes.len;

  // offset 0x01d2 == -46
  uint32_t tx_index = AS_LE_UINT32((wit.loc + offset));
  offset += 4;

  // offset 0x01d6 == -42
  const_view_t version = {wit.loc + offset, 4};
  offset += 4;

  // offset 0x01da == -38
  const_vin_t vin = extract_vin(&wit, offset);
  offset += vin.len;

  if (!btcspv_validate_vin(&vin)) {
    return ERROR_BAD_VIN;
  }

  // offset 0x22d == 45
  const_vout_t vout = extract_vout(&wit, offset);
  offset += vout.len;

  if (!btcspv_validate_vout(&vout)) {
    return ERROR_BAD_VOUT;
  }

  // offset 0x28b == -117
  const_view_t locktime = {wit.loc + offset, 4};
  offset += 4;

  if (wit.len != offset) {
    return ERROR_BAD_WITNESS;
  }

  //
  // CHECK BTC TX INCLUSION
  //

  uint256 txid;
  evalspv_calculate_txid(txid, &version, &vin, &vout, &locktime);

  const_header_t first = {headers.loc, 80};
  const_view_t root = btcspv_extract_merkle_root_le(&first);
  bool valid = evalspv_prove(txid, root.loc, &intermediate_nodes, tx_index);
  if (!valid) {
    return ERROR_INVALID_MERKLE_PROOF;
  }

  uint64_t accDiff = evalspv_validate_header_chain(&headers);
  if (accDiff == BTCSPV_ERR_INVALID_CHAIN) {
    return ERROR_INVALID_HEADER_CHAIN;
  }
  if (accDiff == BTCSPV_ERR_LOW_WORK) {
    return ERROR_LOW_WORK_HEADER_CHAIN;
  }

  if (accDiff < AS_UINT64((args + 8))) {
    return ERROR_NOT_ENOUGH_WORK;
  }

  //
  // CHECK PAYMENT WAS MADE PROPERLY
  //

  const_view_t actual_outpoint = {vin.loc + 1, 36};
  const_view_t expected_oupoint = {args + 16, 36};
  if (!btcspv_view_eq(&actual_outpoint, &expected_oupoint)) {
    return ERROR_WRONG_LISTING;
  }

  // load the first output lock
  uint8_t out_lock_hash[SCRIPT_SIZE] = {0};
  uint64_t out_lock_hash_len = SCRIPT_SIZE;
  int lock_hash_load_ret =
      ckb_load_cell_by_field(out_lock_hash, &out_lock_hash_len,
                             0,  // offset
                             0,  // index
                             CKB_SOURCE_OUTPUT, CKB_CELL_FIELD_LOCK);

  if (lock_hash_load_ret != CKB_SUCCESS) {
    return lock_hash_load_ret;
  }

  // parse the code hash from the lock
  mol_seg_t output_script;
  output_script.ptr = (uint8_t *)out_lock_hash;
  output_script.size = out_lock_hash_len;
  if (MolReader_Script_verify(&output_script, false) != MOL_OK) {
    return ERROR_ENCODING;
  }

  mol_seg_t payee = MolReader_Script_get_code_hash(&output_script);

  // check that this output pays the right person
  const_txout_t second_output = btcspv_extract_output_at_index(&vout, 1);
  const_op_return_t expected_payee = btcspv_extract_op_return_data(&second_output);

  uint32_t comparison_len = 20; // NB: BAD HACKS. Don't do in prod
  if (memcmp(payee.ptr, expected_payee.loc, comparison_len) != 0) {
    return ERROR_WRONG_PAYEE;
  }

  // load the capacity so we can check that against args
  uint8_t out_value[8] = {0};
  uint64_t out_value_len = 8;
  int capacity_load_ret =
      ckb_load_cell_by_field(out_value, &out_value_len,
                             0,  // offset
                             0,  // index
                             CKB_SOURCE_OUTPUT, CKB_CELL_FIELD_CAPACITY);

  if (capacity_load_ret != CKB_SUCCESS) {
    return capacity_load_ret;
  }

  if (AS_LE_UINT64(out_value) < AS_LE_UINT64(args)) {
    return ERROR_NOT_ENOUGH_OUTPUT_CAPACITY;
  }

  return CKB_SUCCESS;
}
