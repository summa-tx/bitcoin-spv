# Bitcoin Stateless SPV Proof CLI

Create Bitcoin Stateless SPV Proofs using this
command line tool.

## Usage

Must sync a `bcoin` full node. All proofs are
created using `bcoin` as a backend.
See https://github.com/bcoin-org/bcoin for configuration
information. Be sure to build `bitcoin-spv/js` before
trying to use this CLI tool.

```bash
$ node index.js --help
bitcoin-verifier-ses proof builder
Version: 0.0.1 Author: Mark Tyneway <mark.tyneway@gmail.com>
Commands:
  $ proof [txid]: Get SPV Proof
  $ headers [count]: Create Header By Count
  $ info: Get Node Info
Flags:
  --network/-n {main|testnet|regtest}
  --url/u <node url>
  --api-key/-k <node api key>
  --ssl/-s {true|false}
  --http-host/-h <http host>
  --http-port/-p <http port>
  --height/-e <block height>
```

Note that any flags can be set as environment variables.
Use the prefix `BITCOIN_VERIFIER_SES_` with a flag name
to set it. For example, to set the api key, use the
environment variable `BITCOIN_VERIFIER_SES_API_KEY`.

### Proof

Use the `proof` command to create a stateless SPV Proof.
The first argument is the txid.

### Headers

User the `headers` command to create a chain of headers.
The `--height` flag is used here to specify the starting
height.

