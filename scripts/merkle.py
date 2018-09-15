import sys
import json
import requests
from riemann import tx, utils


def get_tx_from_api(tx_id):
    url = 'https://chain.so/api/v2/get_tx/BTC/{}'.format(tx_id)
    raw_url = 'https://blockchain.info/rawtx/{}?format=hex'.format(tx_id)

    tx_json = requests.get(url)
    tx_hex = requests.get(raw_url)

    tx_json = json.loads(tx_json.text)
    t = tx.Tx.from_bytes(bytes.fromhex(tx_hex.text))
    return tx_json, t


def get_block_from_api(block_hash):
    block_hash = str(block_hash)

    url = 'https://chain.so/api/v2/get_block/BTC/{}'.format(block_hash)
    raw_url = 'https://blockchain.info/rawblock/{}?format=hex' \
        .format(block_hash)

    block_json = requests.get(url.format(block_hash))
    block_json = json.loads(block_json.text)

    block_hex = requests.get(raw_url)
    return block_json, bytes.fromhex(block_hex.text)


def txns_from_block(block_json, block):
    tx_list = []
    current = 0
    # Get the VarInt countn
    tx_count = tx.VarInt.from_bytes(block[80:])
    # txns are after the header and VarInt count
    txns = block[80 + len(tx_count):]
    try:
        for i in range(tx_count.number):
            # Parse a tx
            t = tx.Tx.from_bytes(txns[current:])

            # Add it to the list and jump forward
            tx_list.append(t)
            current += len(t)

            # Compare against the explorer's list
            if(t.tx_id.hex() != block_json['data']['txs'][i]):
                raise ValueError(
                    'WRONG HASH {} {} {}'
                    .format(i, t.tx_id.hex(), block_json['data']['txs'][i]))
    except Exception as e:
        print(e)
        print(len(tx_list))
        # print(txns[current:current + 200].hex())  # Useful for debugging
        raise

    return tx_list


def create_proof(tx_hashes, index):
    idx = index - 1  # This is 0-indexed
    # TODO: making creating and verifying indexes the same
    hashes = [h for h in tx_hashes]  # copy the list
    proof = bytearray(hashes[idx])

    while len(hashes) > 1:
        next_tree_row = []

        # if length is odd, duplicate last entry
        if len(hashes) % 2 != 0:
            hashes.append(hashes[-1])

        # Append next hash to proof
        proof += hashes[idx + (1 if idx % 2 == 0 else -1)]

        # Half the index
        idx = idx // 2

        # Take each pair in order, and hash them
        for i in range(0, len(hashes), 2):
            next_tree_row.append(utils.hash256(hashes[i] + hashes[i + 1]))

        # update tx_hashes
        hashes = next_tree_row

    # Put the root on the end
    proof.extend(hashes[0])
    return proof


def verify_proof(proof, index):
    index = index  # This is 1 indexed
    # TODO: making creating and verifying indexes the same
    root = proof[-32:]
    current = proof[0:32]

    # For all hashes between first and last
    for i in range(1, len(proof) // 32 - 1):
        # If the current index is even,
        # The next hash goes before the current one
        if index % 2 == 0:
            current = utils.hash256(
                proof[i * 32: (i + 1) * 32] +
                current
            )
            # Halve and floor the index
            index = index // 2
        else:
            # The next hash goes after the current one
            current = utils.hash256(
                current +
                proof[i * 32: (i + 1) * 32]
            )
            # Halve and ceil the index
            index = index // 2 + 1
    # At the end we should have made the root
    if current != root:
        return False
    return True


def main():
    # Read tx_id from args, and then get it and its block from explorers
    tx_id = str(sys.argv[1])
    (tx_json, t) = get_tx_from_api(tx_id)
    (block_json, block) = get_block_from_api(tx_json['data']['blockhash'])

    # Read off the header
    header = block[0:80]

    # Build the LE hash array
    tx_hashes = [txn.tx_id_le for txn in txns_from_block(block_json, block)]

    # Find the tx we want in the hash array
    # modify the index so it's 1-indexed
    index = tx_hashes.index(bytes.fromhex(tx_id)[::-1]) + 1

    # Create a proof using the hashes and index
    proof = create_proof(tx_hashes, index)

    # Error if the proof isn't valid
    assert(verify_proof(proof, index))

    print()
    print()
    print('---- TX ----')
    print(t.hex())
    print()
    print()
    print('--- HEADER ---')
    print(header.hex())
    print()
    print()
    print('--- PROOF ---')
    print(proof.hex())
    print()
    print()
    print('--- INDEX ---')
    print(index)


if __name__ == '__main__':
    main()
