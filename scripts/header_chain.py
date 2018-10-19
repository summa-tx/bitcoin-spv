import sys
from riemann import utils as rutils

b_header_prefix = b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x21\x00\xff\xff'  # noqa: E501

VERSION = bytes.fromhex('bb' * 4)
TIME = bytes.fromhex('cc' * 4)


def make_header_chain(
        how_many,
        nbits,
        merkle_root,
        prevblock_hash):
    headers = bytearray()
    p = prevblock_hash
    m = merkle_root

    while len(headers) < (how_many * 80):
        print('starting header {}'.format(len(headers) // 80 + 1))
        header_with_work = do_work(p, m, nbits)
        print()
        m = '88' * 32
        p = header_with_work[1][::-1].hex()
        headers.extend(header_with_work[0])

    return headers.hex()


def do_work(prev_block_hash_be, merkle_root, nbits):
    nonce = 0
    b_header = make_header(
        bytes.fromhex(prev_block_hash_be),
        bytes.fromhex(merkle_root),
        bytes.fromhex(nbits))

    target = parse_nbits(nbits)

    while True:
        print("Checking nonce {}".format(nonce), end='\r')  # noqa: E999
        b_header_nonced = b_header + rutils.i2le_padded(nonce, 4)
        b_header_digest = rutils.hash256(b_header_nonced)
        if rutils.be2i(b_header_digest[::-1]) < target:
            return b_header_nonced, b_header_digest
        nonce = nonce + 1


def parse_nbits(nbits_hex):
    nbits_bytes = bytes.fromhex(nbits_hex)
    exponent = rutils.be2i(nbits_bytes[-1:])
    return rutils.le2i(nbits_bytes[:-1]) * 0xff ** (exponent - 3)


def make_header(prev_block_hash_be_bytes, merkle_root, nbits_bytes):
    return VERSION \
        + prev_block_hash_be_bytes[::-1] \
        + merkle_root \
        + TIME \
        + nbits_bytes


def main():
    args = sys.argv[1:]

    how_many = int(args[0]) if len(args) > 0 else 3
    nbits = args[1] if len(args) > 1 else 'ffff0021'
    merkle_root = args[2] if len(args) > 2 else ('88' * 32)
    prevblock_hash = args[3] if len(args) > 3 else ('77' * 32)

    print('Doing work now')
    print(make_header_chain(
        how_many=how_many,
        nbits=nbits,
        merkle_root=merkle_root,
        prevblock_hash=prevblock_hash))
    print('Congrats! You earned {} BTC!'.format(0))


if __name__ == '__main__':
    main()
