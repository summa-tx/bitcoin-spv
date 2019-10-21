# TODO: why doesn't it like these imports?
from riemann import tx

from riemann import utils as rutils

from btcspv.types import RelayHeader, SPVProof

from btcspv.utils import verify_proof


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

# TODO: add documentation to all of these
def extract_merkle_root_le(h: bytes) -> bytes:
    return h[36:68]


def extract_prev_block_le(h: bytes) -> bytes:
    return h[4:36]


def extract_prev_block_be(h: bytes) -> bytes:
    return extract_prev_block_le(h)[::-1]


def prove(txid: bytes, merkle_root: bytes, intermediate_nodes: bytes, index: int) -> bool:
    if txid == merkle_root and index == 0 and len(intermediate_nodes) == 0:
        return True

    proof = txid + intermediate_nodes + merkle_root
    return verify_proof(proof, index)


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
        # TODO: Throw error instead of returning false
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


def validate_spvproof(proof: object) -> bool:
    '''
    Verifies an SPV proof object
    Args:
        proof (object): The SPV Proof as an object
    Returns:
        (bool): True if valid proof, else False
    '''
    validVin = validate_vin(proof.vin)
    if not validVin:
        # throw new Error('Vin is not valid')
        return False

    validVout = validate_vout(proof.vout)
    if not validVout:
        # throw new Error('Vout is not valid')
        return False

    # txID = calculateTxId(version, vin, vout, locktime)
    txID = rutils.hash256(
        proof.confirming_header['version'][2:] +
        proof.confirming_header['vin'][2:] +
        proof.confirming_header['vout'][2:] +
        proof.confirming_header['locktime'][2:]
    )
    if txID != proof.tx_id_le:
        # throw new Error('Version, Vin, Vout and Locktime did not yield correct TxID');
        return False

    validate_header(proof.confirming_header)

    validProof = prove(
        proof.tx_id_le,
        proof.merkle_root_le,
        proof.intermediate_nodes,
        proof.index
    )
    if not validProof:
        # throw new Error('Merkle Proof is not valid')
        return False

    return True
