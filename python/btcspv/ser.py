import json

from riemann import tx

from btcspv.types import RelayHeader, SPVProof


def hex_deser(h: str) -> bytes:
    body = h
    if h[:2] == '0x':
        body = h[2:]
    return bytes.fromhex(body)


def hex_ser(b: bytes) -> str:
    return f'0x{b.hex()}'


def dict_from_relay_header(r: RelayHeader) -> dict:
    '''
    Args:
        r (RelayHeader): The RelayHeader to be serialized
    Returns:
        (dict): A dictionary representing the RelayHeader with serialized keys
    '''
    return {
        'raw': hex_ser(r['raw']),
        'hash': hex_ser(r['hash']),
        'height': r['height'],
        'prevhash': hex_ser(r['prevhash']),
        'merkle_root': hex_ser(r['merkle_root']),
    }


def serialize_relay_header(r: RelayHeader) -> str:
    '''
    Args:
        r (RelayHeader): The RelayHeader to be serialized
    Returns:
        (str): A JSON-serialized RelayHeader
    '''
    return json.dumps(dict_from_relay_header(r))


def dict_to_relay_header(d: dict) -> RelayHeader:
    '''
    Args:
        d (dict): The dict with serialized keys to be deserialized
    Returns:
        (RelayHeader): The RelayHeader, a TypedDict with deserialized keys
    '''
    return RelayHeader(
        raw=hex_deser(d['raw']),
        hash=hex_deser(d['hash']),
        height=d['height'],
        prevhash=hex_deser(d['prevhash']),
        merkle_root=hex_deser(d['merkle_root'])
    )


def deserialize_relay_header(s: str) -> RelayHeader:
    '''
    Args:
        s (str): A JSON-serialized RelayHeader
    Returns:
        (RelayHeader): The deserialized RelayHeader
    '''
    return dict_to_relay_header(json.loads(s))


def dict_from_spv_proof(s: SPVProof) -> dict:
    '''
    Args:
        s (SPVProof): The SPVProof to be serialized
    Returns:
        (dict): A dictionary representing the SPVProof with serialized keys
    '''
    return {
        'version': hex_ser(s['version']),
        'vin': hex_ser(s['vin']),
        'vout': hex_ser(s['vout']),
        'locktime': hex_ser(s['locktime']),
        'tx_id': hex_ser(s['tx_id']),
        'index': s['index'],
        'intermediate_nodes': hex_ser(s['intermediate_nodes']),
        'confirming_header': dict_from_relay_header(s['confirming_header'])
    }


def serialize_spv_proof(s: SPVProof) -> str:
    '''
    Args:
        s (SPVProof): The SPVProof to be serialized
    Returns:
        (str): A JSON-serialized SPVProof
    '''
    return json.dumps(dict_from_spv_proof(s))


def dict_to_spv_proof(d: dict) -> SPVProof:
    '''
    Args:
        d (dict): The dict with serialized keys to be deserialized
    Returns:
        (SPVProof): The SPVProof, a TypedDict with deserialized keys
    '''

    t = tx.Tx.from_bytes(
        hex_deser(d['version'])
        + hex_deser(d['vin'])
        + hex_deser(d['vout'])
        + hex_deser(d['locktime'])
    )
    return SPVProof(
        tx=t,
        version=hex_deser(d['version']),
        vin=hex_deser(d['vin']),
        vout=hex_deser(d['vout']),
        locktime=hex_deser(d['locktime']),
        tx_id=hex_deser(d['tx_id']),
        intermediate_nodes=hex_deser(d['intermediate_nodes']),
        index=d['index'],
        confirming_header=dict_to_relay_header(d['confirming_header'])
    )


def deserialize_spv_proof(s: str) -> SPVProof:
    '''
    Args:
        s (str): A JSON-serialized SPVProof
    Returns:
        (SPVProof): The deserialized SPVProof
    '''
    return dict_to_spv_proof(json.loads(s))
