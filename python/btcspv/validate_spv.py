from riemann import tx

from riemann import utils as rutils

from btcspv.types import RelayHeader, SPVProof


def validate_vin(s: SPVProof) -> bool:
    return s['vin'] == _extract_vin(s['tx'])


def _extract_vin(t: tx.Tx) -> bytes:
    '''Get the length-prefixed input vector from a tx'''
    b = bytearray([len(t.tx_ins)])
    for tx_in in t.tx_ins:
        b.extend(tx_in)
    return b


def validate_vout(s: SPVProof) -> bool:
    return s['vout'] == _extract_vout(s['tx'])


def _extract_vout(t: tx.Tx) -> bytes:
    '''Get the length-prefixed output vector from a tx'''
    b = bytearray([len(t.tx_outs)])
    for tx_out in t.tx_outs:
        b.extend(tx_out)
    return b


def extract_merkle_root_le(h: bytes) -> bytes:
    return h[36:68]


def extract_prev_block_le(h: bytes) -> bytes:
    return h[4:36]


def extract_prev_block_be(h: bytes) -> bytes:
    return extract_prev_block_le(h)[::-1]

# /**
#  *
#  * Checks validity of an entire bitcoin header
#  *
#  * @dev                   Checks that each element in a bitcoin header
# is valid
#  * @param {Object}        header A valid Bitcoin header object, see
# README for
#  *                          more information on creating an Bitcoin
# Header object
#  * @param {Uint8Array}    header.raw The bitcoin header
#  * @param {Uint8Array}    header.hash The hash of the header
#  * @param {Uint8Array}    header.hash_le The LE hash of the header
#  * @param {Number}        header.height The height
#  * @param {Uint8Array}    header.merkle_root The merkle root of the header
#  * @param {Uint8Array}    header.merkle_root_le The LE merkle root
#  * @param {Uint8Array}    header.prevhash The hash of the previous header
#  * @returns {Boolean}     True if the header object is syntactically valid
#  * @throws {Error}        If any of the bitcoin header elements are invalid
# */
# export function validateHeader(header) {
#   // Check that HashLE is the correct hash of the raw header
#   const headerHash = BTCUtils.hash256(header.raw);
#   if (!utils.typedArraysAreEqual(headerHash, header.hash_le)) {
#     throw new Error('Hash LE is not the correct hash of the header');
#   }

#   // Check that HashLE is the reverse of Hash
#   const reversedHash = utils.reverseEndianness(header.hash);
#   if (!utils.typedArraysAreEqual(reversedHash, header.hash_le)) {
#     throw new Error('HashLE is not the LE version of Hash');
#   }

#   // Check that the MerkleRootLE is the correct MerkleRoot for the header
#   const extractedMerkleRootLE = BTCUtils.extractMerkleRootLE(header.raw);
#   if (!utils.typedArraysAreEqual(extractedMerkleRootLE, header.merkle_root_le)) {
#     throw new Error('MerkleRootLE is not the correct merkle root of the header');
#   }

#   // Check that MerkleRootLE is the reverse of MerkleRoot
#   const reversedMerkleRoot = utils.reverseEndianness(header.merkle_root);
#   if (!utils.typedArraysAreEqual(reversedMerkleRoot, header.merkle_root_le)) {
#     throw new Error('MerkleRootLE is not the LE version of MerkleRoot');
#   }

#   // Check that PrevHash is the correct PrevHash for the header
#   const extractedPrevHash = BTCUtils.extractPrevBlockBE(header.raw);
#   if (!utils.typedArraysAreEqual(extractedPrevHash, header.prevhash)) {
#     throw new Error('Prev hash is not the correct previous hash of the header');
#   }

#   return true;
# }


def validate_header(header: RelayHeader) -> bool:
    '''
    Verifies a bitcoin header
    Args:
        proof (object): The header as an object
    Returns:
        (bool): True if valid header, else False
    '''
    # Check that HashLE is the correct hash of the raw header
    headerHash = rutils.hash256(header.raw)
    if headerHash != header.hash_le:
        # throw new Error('Hash LE is not the correct hash of the header')
        return False

    # Check that HashLE is the reverse of Hash
    reversedHash = header.hash[::-1]
    if reversedHash != header.hash_le:
        # throw new Error('HashLE is not the LE version of Hash');
        return False

    # Check that the MerkleRootLE is the correct MerkleRoot for the header
    extractedMerkleRootLE = extract_merkle_root_le(header.raw)
    if extractedMerkleRootLE != header.merkle_root_le:
        # throw new Error('MerkleRootLE is not the correct merkle root of the header')
        return False

    # Check that MerkleRootLE is the reverse of MerkleRoot
    reversedMerkleRoot = header.merkle_root[::-1]
    if reversedMerkleRoot != header.merkle_root_le:
        # throw new Error('MerkleRootLE is not the LE version of MerkleRoot');
        return False

    # Check that PrevHash is the correct PrevHash for the header
    extractedPrevHash = extract_prev_block_be(header.raw)
    if extractedPrevHash != header.prevhash:
        # throw new Error('Prev hash is not the correct previous hash of the header');
        return False

    return True


# /**
#  *
#  * Checks validity of an entire SPV Proof
#  *
#  * @dev                   Checks that each element in an SPV Proof is valid
#  * @param {Object}        proof A valid SPV Proof object, see README for
#  *                          more information on creating an SPV Proof object
#  * @param {Uint8Array}    proof.version The version
#  * @param {Uint8Array}    proof.vin The vin
#  * @param {Uint8Array}    proof.vout The vout
#  * @param {Uint8Array}    proof.locktime The locktime
#  * @param {Uint8Array}    proof.tx_id The tx ID
#  * @param {Uint8Array}    proof.tx_id_le The LE tx ID
#  * @param {Number}        proof.index The index
#  * @param {Uint8Array}    proof.intermediate_nodes The intermediate nodes
#  * @param {Uint8Array}    proof.confirming_header.raw The bitcoin header
#  * @param {Uint8Array}    proof.confirming_header.hash The hash of the header
#  * @param {Uint8Array}    proof.confirming_header.hash_le The LE hash of the header
#  * @param {Number}        proof.confirming_header.height The height
#  * @param {Uint8Array}    proof.confirming_header.merkle_root The merkle root of the header
#  * @param {Uint8Array}    proof.confirming_header.merkle_root_le The LE merkle root
#  * @param {Uint8Array}    proof.confirming_header.prevhash The hash of the previous header
#  * @returns {Boolean}     Teturns true if the SPV Proof object is syntactically valid
#  * @throws {Error}        If any of the SPV Proof elements are invalid
# */
# export function validateProof(proof) {
#   const {
#     version,
#     vin,
#     vout,
#     locktime,
#     tx_id_le: txIdLE,
#     index,
#     intermediate_nodes: intermediateNodes,
#     confirming_header: confirmingHeader
#   } = proof;
#   const { merkle_root_le: merkleRootLE } = confirmingHeader;

#   const validVin = BTCUtils.validateVin(vin);
#   if (!validVin) {
#     throw new Error('Vin is not valid');
#   }

#   const validVout = BTCUtils.validateVout(vout);
#   if (!validVout) {
#     throw new Error('Vout is not valid');
#   }

#   const txID = calculateTxId(version, vin, vout, locktime);
#   if (!utils.typedArraysAreEqual(txID, txIdLE)) {
#     throw new Error('Version, Vin, Vout and Locktime did not yield correct TxID');
#   }

#   validateHeader(confirmingHeader);

#   const validProof = prove(txIdLE, merkleRootLE, intermediateNodes, index);
#   if (!validProof) {
#     throw new Error('Merkle Proof is not valid');
#   }

#   return true;
# }


def validate_spvproof(proof: object) -> bool:
    '''
    Verifies an SPV proof object
    Args:
        proof (object): The SPV Proof as an object
    Returns:
        (bool): True if valid proof, else False
    '''
    # validVin = validate_vin(proof.vin)
    # if !validVin:
    #     throw new Error('Vin is not valid')
