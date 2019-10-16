import json

from riemann import tx

from btcspv.types import RelayHeader, SPVProof


def dict_from_relay_header(r: RelayHeader) -> dict:
    return {
        'raw': f"0x{r['raw'].hex()}",
        'hash': f"0x{r['hash'].hex()}",
        'hash_le': f"0x{r['hash_le'].hex()}",
        'height': r['height'],
        'prevhash': f"0x{r['prevhash'].hex()}",
        'merkle_root': f"0x{r['merkle_root'].hex()}",
        'merkle_root_le': f"0x{r['merkle_root_le'].hex()}"
    }


def serialize_relay_header(r: RelayHeader) -> str:
    return json.dumps(dict_from_relay_header(r))


def dict_to_relay_header(d: dict) -> RelayHeader:
    return RelayHeader(
        raw=bytes.fromhex(d['raw'][2:]),
        hash=bytes.fromhex(d['hash'][2:]),
        hash_le=bytes.fromhex(d['hash_le'][2:]),
        height=d['height'],
        prevhash=bytes.fromhex(d['prevhash'][2:]),
        merkle_root=bytes.fromhex(d['merkle_root'][2:]),
        merkle_root_le=bytes.fromhex(d['merkle_root_le'][2:])
    )


def deserialize_relay_header(s: str) -> RelayHeader:
    return dict_to_relay_header(json.loads(s))


def dict_from_spv_proof(s: SPVProof) -> dict:
    return {
        'version': f"0x{s['version'].hex()}",
        'vin': f"0x{s['vin'].hex()}",
        'vout': f"0x{s['vout'].hex()}",
        'locktime': f"0x{s['locktime'].hex()}",
        'tx_id': f"0x{s['tx_id'].hex()}",
        'tx_id_le': f"0x{s['tx_id_le'].hex()}",
        'index': s['index'],
        'intermediate_nodes': f"0x{s['intermediate_nodes'].hex()}",
        'confirming_header': dict_from_relay_header(s['confirming_header'])
    }


def serialize_spv_proof(s: SPVProof) -> str:
    return json.dumps(dict_from_spv_proof(s))


def dict_to_spv_proof(d: dict) -> SPVProof:
    print(d)
    t = tx.Tx.from_hex(
        f'{d["version"][2:]}{d["vin"][2:]}{d["vout"][2:]}{d["locktime"][2:]}')
    return SPVProof(
        tx=t,
        version=bytes.fromhex(d['version'][2:]),
        vin=bytes.fromhex(d['vin'][2:]),
        vout=bytes.fromhex(d['vout'][2:]),
        locktime=bytes.fromhex(d['locktime'][2:]),
        tx_id=bytes.fromhex(d['tx_id'][2:]),
        tx_id_le=bytes.fromhex(d['tx_id_le'][2:]),
        intermediate_nodes=bytes.fromhex(d['intermediate_nodes'][2:]),
        index=d['index'],
        confirming_header=dict_to_relay_header(d['confirming_header'])
    )


def deserialize_spv_proof(s: str) -> SPVProof:
    return dict_to_spv_proof(json.loads(s))
