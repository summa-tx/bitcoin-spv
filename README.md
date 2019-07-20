## Bitcoin SPV Proofs in Solidity

### What is it?

`bitcoin-spv` is a collection of Solidity libraries for working with Bitcoin
transactions in Solidity contracts. Basically, these tools help you parse,
inspect, and authenticate Bitcoin transactions.

### IMPORTANT WARNING

It is extremely easy to write insecure code using these libraries. We do not
espouse a specific security model. Any SPV verification involves complex
security assumptions. Please seek external review for your design before
building with these libraries.

### Deployed Instances (for DELEGATECALLs)

| Contract    | Version |  Solc     |  Main                                        |  Ropsten
|-------------|---------|-----------|----------------------------------------------|-------------------------------------------
| ValidateSPV |  1.0.0  |  v0.4.25  |  0xaa75a0d48fca26ec2102ab68047e98a80a63df1d  |  0x112ef10aef3bde1cd8fd062d805ae8173ec36d66
| BTCUtils    |	 1.0.0  |  v0.4.25  |  0xD0d4EA34e4a5c27cA40e78838a4Ed5C1bB033BbC  |  0x7a79d4112d79af980e741e0b10c47ffa543cc93a
| BytesLib    |	 1.0.0  |  v0.4.25  |  0x302A17fcE39E877966817b7cc5479D8BfCe05295  |  0xcc69fec9ba70d6b4e386bfdb70b94349aff15f53
| ValidateSPV |  1.0.0  |  v0.4.25  |  NOT YET DEPLOYED                            |  NOT YET DEPLOYED
| BTCUtils    |	 1.0.0  |  v0.4.25  |  NOT YET DEPLOYED                            |  NOT YET DEPLOYED
| BytesLib    |	 1.0.0  |  v0.4.25  |  NOT YET DEPLOYED                            |  NOT YET DEPLOYED


### Solidity Compiler

Starting from version `1.1.0`, required solidity compiler (`solc`) version is
at least `0.5.10`.

### Development Setup

```
npm install
npm run compile
npm test
```

### Generating merkle proofs from mainnet Bitcoin

We included a basic tool for this! It uses Electrum to get tx data. Make sure
you have python3.6 or greater, then do the following:

```
pipenv install
pipenv run python scripts/merkle.py {txid BE}
```

### Generating header chains from scratch (useful for testing)

Not recommended to set nbits lower than 2000ffff.

```
pipenv install
pipenv run python scripts/header_chain.py {num_headers} {nbits_as_hex_string}
pipenv run python scripts/header_chain.py 7 2000ffff
```


### Usage notes (gotchas)
Blockchain.info shows txids and merkle root in BE format

They should be in LE for the proof construction

They need to be in LE for hashing

They are in LE in the block

### Test Txns

These transactions are used in tests:

#### P2WPKH With witness:
https://www.blockchain.com/btc/tx/10e3eaed1ef21787944f0d151a1a6553397e2ee4074887e344a112e13f22b70b
LE ID: `0bb7223fe112a144e3874807e42e7e3953651a1a150d4f948717f21eedeae310`
```
0200000000010134e62927bfb718ac6a6bcda87e02fce897a8af524d748c1d172570bce3a7b11a00000000008004000001145c92000000000016001486a92a3c9bd01ed7d9844c842295ccd29bbef467034730440220115db53ebdb1ad3a47399a55a246101fb234e2487a09d509df7d56da91aa8a83022021f90d37e65c457890dbddbe6f1cb60af90541ff539782aa69f846fd0c4b0d1f01004d632102302a34a02288ae9cb62d5f099b78b463124f108b4140e9c2c9657e223419d45267028004b2752102ecc5b51c462ee2ecf47e1ef67e73e884f5f539c779fdc779c7a90615a659a30e68ac00000000
```

#### 1 input, 1 WSH output, 1 op_return
https://blockchair.com/bitcoin/transaction/d60033c5cf5c199208a9c656a29967810c4e428c22efb492fdd816e6a0a1e548
```
010000000001011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000
```
