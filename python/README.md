## Bitcoin SPV Proofs in Python

### What is it?

`bitcoin-spv` provides utilities for working with Bitcoin SPV proofs from other
chains. No chain currently has Python smart contract support, although Tezos's
two Pythonic languages (Pyligo and SmartPy) are approaching
production-readiness. In the meantime, this Python package provides 2 standard
data-structures `RelayHeader` and `SPVProof` and (de)serialization methods that
are compatible with our Golang, JS, and Solidity implementations.

### IMPORTANT WARNING

It is extremely easy to write insecure code using these libraries. We do not
recommend a specific security model. Any SPV verification involves complex
security assumptions. Please seek external review for your design before
building with these libraries.

### Development Setup

We use `pyenv` and `pipenv` for environment management.

```sh
pipenv install -d
pipenv run test
```

### Usage Example

```Python
import json

from btcspv import ser

p = open('../testProofs.json')
proof_vectors = json.loads(p.read())

valid_proofs = [
    ser.deserialize_spv_proof(p) for p in self.proof_vectors['valid']
]
```

## Supported by

![Summa, Cross Chain Group](../logo-summa-ccg.jpg)

- [Summa](https://summa.one)
- [Cross Chain Group](https://crosschain.group/)

-------
