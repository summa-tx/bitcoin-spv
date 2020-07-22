#ifndef SUMMA_CKB_EVALSPV_H_
#define SUMMA_CKB_EVALSPV_H_

#include "stdbool.h"
#include "stdint.h"
#include "stdlib.h"
#include "string.h"

#include "btcspv.h"

const uint64_t BTCSPV_ERR_BAD_LENGTH;
const uint64_t BTCSPV_ERR_INVALID_CHAIN;
const uint64_t BTCSPV_ERR_LOW_WORK;

/// @brief Evaluates a Bitcoin merkle inclusion proof.
///
/// @warning The index may be malleated. It is NOT necessarily the index of the
/// tx in the block's transaction vector.
///
/// @param txid                The txid (LE)
/// @param merkle_root         The merkle root (as in the block header)
/// @param intermediate_nodes  The proof's intermediate nodes (digests between
///                            leaf and root)
/// @param index               The leaf's index in the tree (0-indexed)
///
/// @return true if a valid proof, otherwise false.
bool evalspv_prove(const uint256 txid, const uint256 root,
                   const_merkle_array_t *intermediate_nodes, uint32_t index);

/// @brief              Hashes transaction to get txid
/// @note               Supports Legacy and Witness
/// @param _version     4-bytes version
/// @param _vin         Raw bytes length-prefixed input vector
/// @param _vout        Raw bytes length-prefixed output vector
/// @param _locktime    4-byte tx locktime
/// @warning  overwrites `txid` with the transaction ID
/// @warning  caller must ensure `txid` is allocated and can hold 32 bytes
void evalspv_calculate_txid(uint256 txid, const_view_t *version,
                            const_vin_t *vin, const_vout_t *vout,
                            const_view_t *locktime);

/// @brief             Checks validity of header work
/// @param _digest      Header digest
/// @param _target      The target threshold
/// @return             true if header work is valid, false otherwise
bool evalspv_validate_header_work(const uint256 header_digest,
                                  const uint256 target);

/// @brief                      Checks validity of header chain
/// @note                       Compares current header prevHash to previous
///                             header's digest
/// @param _header              The raw bytes header
/// @param _prevHeaderDigest    The previous header's digest
/// @return                     true if the connection is valid, false otherwise
bool evalspv_validate_header_prev_hash(const_header_t *header,
                                       const uint256 prev_hash);

/// @brief              Checks validity of header chain
/// @note               Checks work of each header, connection,
/// @param _headers     Raw byte array of header chain
/// @return             The total accumulated difficulty of the header chain,
///                     or an error code
/// @warning            Caller must check response to ensure it is not an error
/// code
uint64_t evalspv_validate_header_chain(const_header_array_t *headers);

#endif /* SUMMA_CKB_EVALSPV_H_ */
