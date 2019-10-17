from riemann import utils as rutils


def verify_proof(proof: bytes, index: int):
    idx = index
    length = (len(proof) // 32) - 1

    if len(proof) % 32 != 0:
        return False

    if len(proof) == 32:
        return True

    # Should never occur
    if len(proof) == 64:
        return False

    current = proof[:32]
    root = proof[-32:]
    # For all hashes between first and last
    for i in range(1, length):
        next = proof[i * 32:i * 32 + 32]
        if idx % 2 == 1:
            current = rutils.hash256(next + current)
        else:
            current = rutils.hash256(current + next)
        idx = idx >> 1
    return current == root
