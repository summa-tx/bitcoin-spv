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

# Read in the test vectors
f = open('../testProofs.json')
vectors = json.loads(f.read())

# Test vectors are double-serialized, so an additional load step is necessary
# Most use cases will only need one load step
valid_json_string = vectors['valid'][0]
proof = json.loads(valid_json_string)

print(proof)
print(proof['confirming_header']['merkle_root_le'].hex())
```

## Supported by

![Summa, Cross Chain Group](../logo-summa-ccg.jpg)

- [Summa](https://summa.one)
- [Cross Chain Group](https://crosschain.group/)

-------
