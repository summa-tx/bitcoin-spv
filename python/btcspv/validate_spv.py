from riemann import tx
from riemann.tx import shared
from riemann import utils as rutils

from btcspv import utils

from typing import List
from btcspv.types import RelayHeader, SPVProof


def validate_vin(vin: bytes) -> bool:
    '''Checks that the vin is properly formatted'''
    if vin[0] > 0xfc or vin[0] == 0:
        return False
    try:
        deser = _deserialize_vin(vin)
    except (IndexError, ValueError):
        return False
    return sum(map(len, deser)) + 1 == len(vin)


def _deserialize_vin(vin: bytes) -> List[tx.TxIn]:
    # Get the length of the tx_in vector
    tx_ins = []
    tx_ins_num = shared.VarInt.from_bytes(vin)

    # `current` is the index of next read
    current = len(tx_ins_num)

    # Deserialize all tx_ins
    for _ in range(tx_ins_num.number):
        tx_in = tx.TxIn.from_bytes(vin[current:])
        current += len(tx_in)
        tx_ins.append(tx_in)

    return tx_ins


def validate_vout(vout: bytes) -> bool:
    '''Checks that the vout is properly formatted'''
    if vout[0] > 0xfc or vout[0] == 0:
        return False
    try:
        deser = _deserialize_vout(vout)
    except (IndexError, ValueError):
        return False
    return sum(map(len, deser)) + 1 == len(vout)


def _deserialize_vout(vout: bytes) -> List[tx.TxOut]:
    # Get the length of the tx_in vector
    tx_outs = []
    tx_outs_num = shared.VarInt.from_bytes(vout)

    # `current` is the index of next read
    current = len(tx_outs_num)

    # Deserialize all tx_outs
    for _ in range(tx_outs_num.number):
        tx_out = tx.TxOut.from_bytes(vout[current:])
        current += len(tx_out)
        tx_outs.append(tx_out)

    return tx_outs


def extract_merkle_root_le(header: bytes) -> bytes:
    '''Extracts the transaction merkle root from a header (little-endian)'''
    return header[36:68]


def extract_prev_block_le(header: bytes) -> bytes:
    '''Extracts the previous block's hash from a header (little-endian)'''
    return header[4:36]


def prove(
    txid: bytes, merkle_root: bytes, intermediate_nodes: bytes, index: int) \
        -> bool:
    '''
    Validates a tx inclusion in the block.
    Note that `index` is not a reliable indicator of location within a block.
    '''
    if txid == merkle_root and index == 0 and len(intermediate_nodes) == 0:
        return True

    proof = txid + intermediate_nodes + merkle_root
    return utils.verify_proof(proof, index)


def validate_header(header: RelayHeader) -> bool:
    '''
    Verifies a bitcoin header
    Args:
        header (RelayHeader): The header as an object

    Returns:
        (bool): True if valid header, else False
    '''
    # Check that HashLE is the correct hash of the raw header
    header_hash = rutils.hash256(header['raw'])
    if header_hash != header['hash_le']:
        return False

    # Check that HashLE is the reverse of Hash
    reversed_hash = header['hash'][::-1]
    if reversed_hash != header['hash_le']:
        return False

    # Check that the MerkleRootLE is the correct MerkleRoot for the header
    extracted_merkle_root_le = extract_merkle_root_le(header['raw'])
    if extracted_merkle_root_le != header['merkle_root_le']:
        return False

    # Check that MerkleRootLE is the reverse of MerkleRoot
    reversed_merkle_root = header['merkle_root'][::-1]
    if reversed_merkle_root != header['merkle_root_le']:
        return False

    # Check that PrevHash is the correct PrevHash for the header
    extracted_prevhash_le = extract_prev_block_le(header['raw'])
    if extracted_prevhash_le != header['prevhash_le']:
        return False

    # Check that PrevHashLE is the reverse of PrevHash
    reversed_prevhash = header['prevhash'][::-1]
    if reversed_prevhash != header['prevhash_le']:
        return False
    return True


def validate_spvproof(proof: SPVProof) -> bool:
    '''
    Verifies an SPV proof object
    Args:
        proof (SPVProof): The SPV Proof as an object
    Returns:
        (bool): True if valid proof, else False
    '''
    if not validate_vin(proof['vin']):
        return False

    if not validate_vout(proof['vout']):
        return False

    tx_id = rutils.hash256(
        proof['version'] +
        proof['vin'] +
        proof['vout'] +
        proof['locktime']
    )
    if tx_id != proof['tx_id_le']:
        return False

    if not validate_header(proof['confirming_header']):
        return False

    valid_proof = prove(
        proof['tx_id_le'],
        proof['confirming_header']['merkle_root_le'],
        proof['intermediate_nodes'],
        proof['index']
    )
    if not valid_proof:
        return False
    return True
