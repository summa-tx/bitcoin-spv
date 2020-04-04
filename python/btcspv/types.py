from riemann import tx

from mypy_extensions import TypedDict


class RelayHeader(TypedDict):
    raw: bytes
    hash: bytes
    height: int
    prevhash: bytes
    merkle_root: bytes


class SPVProof(TypedDict):
    tx: tx.Tx
    version: bytes
    vin: bytes
    vout: bytes
    locktime: bytes
    tx_id: bytes
    index: int
    intermediate_nodes: bytes
    confirming_header: RelayHeader
