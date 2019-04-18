# bitcoin-spv

This branch may be submoduled into truffle and other solidity projects.

To do so:
```
cd contracts
git submodule add -f -b 1.0.0-embedabble git@github.com:summa-tx/bitcoin-spv.git
git submodule update --init --recursive
```

This should place a `contracts/bitcoin-spv` folder in your contracts folder.

Truffle _should_ be able to find this :)
