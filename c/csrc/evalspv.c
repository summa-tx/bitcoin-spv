#include "evalspv.h"

const uint64_t BTCSPV_ERR_BAD_LENGTH = 0xffffffffffffffff;
const uint64_t BTCSPV_ERR_INVALID_CHAIN = 0xfffffffffffffffe;
const uint64_t BTCSPV_ERR_LOW_WORK = 0xfffffffffffffffd;

bool evalspv_prove(const uint256 txid, const uint256 root,
                   const_merkle_array_t *intermediate_nodes, uint32_t index) {
  const uint32_t nodes_len = intermediate_nodes->len;
  if (UINT256_EQ(txid, root) && index == 0 && nodes_len == 0) {
    return true;
  }

  uint8_t *proof = malloc(sizeof(uint8_t) * 64 + nodes_len);
  memcpy(proof, txid, 32);
  memcpy(proof + 32, intermediate_nodes->loc, nodes_len);
  memcpy(proof + 32 + nodes_len, root, 32);

  const_view_t proof_view = {proof, 64 + nodes_len};

  bool result = btcspv_verify_hash256_merkle(&proof_view, index);

  free(proof);

  return result;
}

void evalspv_calculate_txid(uint256 txid, const_view_t *version,
                            const_vin_t *vin, const_vout_t *vout,
                            const_view_t *locktime) {
  uint32_t tx_size = (4 + vin->len + vout->len + 4);

  uint8_t *tx = malloc(sizeof(uint8_t) * tx_size);
  memcpy(tx, version->loc, 4);
  memcpy(tx + 4, vin->loc, vin->len);
  memcpy(tx + 4 + vin->len, vout->loc, vout->len);
  memcpy(tx + tx_size - 4, locktime->loc, 4);

  const_view_t tx_view = {tx, tx_size};

  btcspv_hash256(txid, &tx_view);

  free(tx);
}

// digest is LE, target is BE. this seems weird :/
bool evalspv_validate_header_work(const uint256 digest, const uint256 target) {
  uint256 zero = {0};
  if (UINT256_EQ(digest, zero)) {
    return false;
  }

  uint256 digest_be = {0};
  btcspv_buf_rev(digest_be, digest, 32);
  return (UINT256_LT(digest_be, target));
}

bool evalspv_validate_header_prev_hash(const_header_t *header,
                                       const uint256 prev_hash) {
  const_view_t actual = btcspv_extract_prev_block_hash_le(header);
  return btcspv_view_eq_buf(&actual, prev_hash, 32);
}

uint64_t evalspv_validate_header_chain(const_header_array_t *headers) {
  if (headers->len % 80 != 0) {
    return BTCSPV_ERR_BAD_LENGTH;
  }
  uint32_t offset;
  uint256 digest = {0};
  uint64_t accumulated_work = 0x00;
  uint32_t num_headers = headers->len / 80;
  for (int i = 0; i < num_headers; i++) {
    offset = i * 80;
    const_header_t header = {headers->loc + offset, 80};

    // skip on first header
    if (i != 0 && !evalspv_validate_header_prev_hash(&header, digest)) {
      return BTCSPV_ERR_INVALID_CHAIN;
    }

    uint256 target = {0};
    btcspv_extract_target(target, &header);
    uint64_t header_work = btcspv_calculate_difficulty(target);

    const_view_t preimage = { header.loc, header.len };
    btcspv_hash256(digest, &preimage);
    if (header_work == 0 || !(evalspv_validate_header_work(digest, target))) {
      return BTCSPV_ERR_LOW_WORK;
    }
    accumulated_work += header_work;
  }
  return accumulated_work;
}
