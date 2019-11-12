from riemann import tx

from mypy_extensions import TypedDict


class RelayHeader(TypedDict):
    raw: bytes
    hash: bytes
    hash_le: bytes
    height: int
    prevhash: bytes
    prevhash_le: bytes
    merkle_root: bytes
    merkle_root_le: bytes


class SPVProof(TypedDict):
    tx: tx.Tx
    version: bytes
    vin: bytes
    vout: bytes
    locktime: bytes
    tx_id: bytes
    tx_id_le: bytes
    index: int
    intermediate_nodes: bytes
    confirming_header: RelayHeader
