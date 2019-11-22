#ifndef SUMMA_CKB_EVALSPV_H_
#define SUMMA_CKB_EVALSPV_H_

#include "stdbool.h"  // CKB override
#include "stdint.h"   // CKB override

#include "btcspv.h"

const uint64_t BTCSPV_ERR_BAD_LENGTH;
const uint64_t BTCSPV_ERR_INVALID_CHAIN;
const uint64_t BTCSPV_ERR_LOW_WORK;

bool evalspv_prove(const uint256 txid, const uint256 root,
                   const_view_t *intermediate_nodes, uint32_t index);

void evalspv_calculate_txid(uint256 txid, const_view_t *version,
                            const_view_t *vin, const_view_t *vout,
                            const_view_t *locktime);

bool evalspv_validate_header_work(const uint256 header_digest,
                                  const uint256 target);
bool evalspv_validate_header_prev_hash(const_view_t *header,
                                       const uint256 prev_hash);
uint64_t evalspv_validate_header_chain(const_view_t *headers);

#endif /* SUMMA_CKB_EVALSPV_H_ */
