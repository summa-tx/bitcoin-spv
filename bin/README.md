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
$ ./cli --help
Bitcoin SPV Proof Builder
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
The argument is the txid.

```bash
$ ./bin/cli proof fff0d18db9f52e6bff445c26cb8bb9658882c8045997a74be26003225713e762

{
  "version": "01000000",
  "vin": "0168fe12339c9eb3ceaf21899b775a53dc10901f88f57ba7b360bbd285fe1b8731000000006a47304402206f33a57c88e473a26eca617c21aa9545101b18df83b127bc485bf0fea1a831b702204d56bc0e39fa14ff254d0677f46c3f7f26f6dea8e6a9c5ba90aace3c8476f1d401210396dd84815a4f121bf29b882c283ec1cd8b5bfa92773008a79cb44d981821a399ffffffff",
  "vout": "0230182b00000000001976a91452ada19e1305964e80a1a1cbbafea97f6b632fae88aca7ec3703000000001976a914f9da3787e63ad9261517a6d4d9dabd2cf40fb80988ac",
  "locktime": "00000000",
  "tx_id": "fff0d18db9f52e6bff445c26cb8bb9658882c8045997a74be26003225713e762",
  "tx_id_le": "62e71357220360e24ba7975904c8828865b98bcb265c44ff6b2ef5b98dd1f0ff",
  "index": 6,
  "confirming_header": {
    "raw": "00e0002074859a363c5a885b262722d5c5c5cd912e2cd1a53d0c0c000000000000000000a0c7ea544dcc99af8af5415d4293856da7c07f9f1a3b145d2498b39bf5fa5e36fbd1d45dd1201617d64b8b4c",
    "hash": "00000000000000000003e7124509796d4f15ef47fedc71c79cea60d1ff503410",
    "hash_le": "103450ffd160ea9cc771dcfe47ef154f6d79094512e703000000000000000000",
    "height": 604596,
    "prevhash": "0000000000000000000c0c3da5d12c2e91cdc5c5d52227265b885a3c369a8574",
    "prevhash_le": "74859a363c5a885b262722d5c5c5cd912e2cd1a53d0c0c000000000000000000",
    "merkle_root": "365efaf59bb398245d143b1a9f7fc0a76d8593425d41f58aaf99cc4d54eac7a0",
    "merkle_root_le": "a0c7ea544dcc99af8af5415d4293856da7c07f9f1a3b145d2498b39bf5fa5e36"
  },
  "intermediate_nodes": "c7ca43c16c6a587c3554d45a1c0d56e801ef2dc929fae3cc95bb604b3f566de1f6e9750121695b84989ba819f6cea180315f8a3ae71d644f1bb90379577dbc6d7167faee2d76d172fcec41469346d3d731a901fa86e71528a8569a414ef42ed5585623d28015eb91eb1dda03615196918e49e5f1ff0ef229748389698c91c8a5c61d721352a53cea50a25cbff4002b96d0cd93f0fe48d4e7c8f27a9bd4c54ade1c12d25788981d287caac5ee10094957a15d5cc4f65885ff97e292f0512942eba083dcbcab960639f672f7d10e745da5e7b271abca32a9e2060ea8ddbf545db2b89a2ecad745853bab40a383f612ae5ab94815f55b9dd26aa199d39fb7cde85326bce3f94cdad64b6470397f2aa5ff57126a2f343c5d133510f96bda999ee69d99ced303a1076d415b9c404c8fb73a36ae142b359e7106ab73da4862064f472e1459b5d923cb387b83559c100195428443bb8211ab2b57a6dd28c8fd5a44e1a1"
}
```


### Headers

User the `headers` command to create a chain of headers.
The `--height` flag is used here to specify the starting
height.

```bash
$ ./bin/cli headers 2 --height 10
{
  "headers": "010000000508085c47cc849eb80ea905cc7800a3be674ffc57263cf210c59d8d00000000112ba175a1e04b14ba9e7ea5f76ab640affeef5ec98173ac9799a852fa39add320cd6649ffff001d1e2de565"
}
```
