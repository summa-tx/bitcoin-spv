from riemann import tx

from mypy_extensions import TypedDict


class RelayHeader(TypedDict):
    hex: str
    hash: str
    hash_le: str
    height: int
    prevhash: str
    merkle_root: str
    merkle_root_le: str


class SPVProof(TypedDict):
    tx: tx.Tx
    tx_id: str
    tx_id_le: str
    index: int
    intermediate_nodes: str
    confirming_header: RelayHeader
