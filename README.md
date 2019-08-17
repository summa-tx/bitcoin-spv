## bitcoin-spv

`bitcoin-spv` is a low-level toolkit for working with Bitcoin from other
blockchains. It supplies a set of pure functions that can be used to validate
almost all Bitcoin transactions and headers, as well as higher-level
functions that can evaluate header chains and transaction inclusion proofs.

### What smart contract chains are supported?

We have well-tested implementations in Solidty and ES6+ (JS). These support any
EVM-based chain (Ethereum, Celo, and others), as well as projects based on
[Lotion](https://github.com/nomic-io/lotion). Our ES6+ work will also work on
[Agoric](https://agoric.com/)'s SES-based smart contract system at launch.

We have an in-progress implementation in golang, targeting use by projects
based on the [Cosmos sdk](https://github.com/cosmos/cosmos-sdk/).

### Quickstart guide:

There really isn't one. Using these tools requires in-depth knowledge of the
Bitcoin transaction format. The implementations include setup and development
instructions. If you have a project in mind, feel free to reach out and ask
questions.

### IMPORTANT WARNING

It is extremely easy to write insecure code using these libraries. We do not
recommend a specific security model. Any SPV verification involves complex
security assumptions. Please seek external review for your design before
building with these libraries.

### Bitcoin Endianness Gotchas
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
