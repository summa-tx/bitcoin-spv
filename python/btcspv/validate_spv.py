from riemann import tx
from riemann import utils as rutils

from btcspv import utils

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
    '''Checks that the vout is properly formatted'''
    return s['vout'] == _extract_vout(s['tx'])


def _extract_vout(t: tx.Tx) -> bytes:
    '''Get the length-prefixed output vector from a tx'''
    b = bytearray([len(t.tx_outs)])
    for tx_out in t.tx_outs:
        b.extend(tx_out)
    return b


def extract_merkle_root_le(h: bytes) -> bytes:
    '''Extracts the transaction merkle root from a header (little-endian)'''
    return h[36:68]


def extract_prev_block_le(h: bytes) -> bytes:
    '''Extracts the previous block's hash from a header (little-endian)'''
    return h[4:36]


def extract_prev_block_be(h: bytes) -> bytes:
    '''Extracts the previous block's hash from a header (big-endian)'''
    return extract_prev_block_le(h)[::-1]


def prove(
    txid: bytes, merkle_root: bytes, intermediate_nodes: bytes, index: int) \
        -> bool:
    '''Validates a tx inclusion in the block'''
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
    extracted_prevhash = extract_prev_block_be(header['raw'])
    if extracted_prevhash != header['prevhash']:
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
    if not validate_vin(proof):
        return False

    if not validate_vout(proof):
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
