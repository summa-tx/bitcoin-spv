/* global BigInt */

exports.EMPTY = '0x0000000000000000000000000000000000000000000000000000000000000000';
// https://www.blockchain.com/btc/tx/d60033c5cf5c199208a9c656a29967810c4e428c22efb492fdd816e6a0a1e548
// https://blockchain.info/rawtx/d60033c5cf5c199208a9c656a29967810c4e428c22efb492fdd816e6a0a1e548
// https://blockchain.info/rawtx/d60033c5cf5c199208a9c656a29967810c4e428c22efb492fdd816e6a0a1e548?format=hex

exports.HEADER_ERR = {
  // Changed Header01 prevHash to be the same as Header00 prevHash to create invalid chain
  HEADER_CHAIN_INVALID_PREVHASH: '0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d951590000002073bd2184edd9c4fc76642ea6754ee40136970efc10c419000000000000000000c63a8848a448a43c9e4402bd893f701cd11856e14cbbe026699e8fdc445b35a8d93c9c5ba1192817b945dc6c00000020f402c0b551b944665332466753f1eebb846a64ef24c71700000000000000000033fc68e070964e908d961cd11033896fa6c9b8b76f64a2db7ea928afa7e304257d3f9c5ba11928176164145d0000ff3f63d40efa46403afd71a254b54f2b495b7b0164991c2d22000000000000000000f046dc1b71560b7d0786cfbdb25ae320bd9644c98d5c7c77bf9df05cbe96212758419c5ba1192817a2bb2caa00000020e2d4f0edd5edd80bdcb880535443747c6b22b48fb6200d0000000000000000001d3799aa3eb8d18916f46bf2cf807cb89a9b1b4c56c3f2693711bf1064d9a32435429c5ba1192817752e49ae0000002022dba41dff28b337ee3463bf1ab1acf0e57443e0f7ab1d000000000000000000c3aadcc8def003ecbd1ba514592a18baddddcd3a287ccf74f584b04c5c10044e97479c5ba1192817c341f595',

  // Removed a byte from Header00's version to create invalid chain length
  HEADER_CHAIN_INVALID_LEN: '0x00002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b00000020fe70e48339d6b17fbbf1340d245338f57336e97767cc240000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d9515900000020baaea6746f4c16ccb7cd961655b636d39b5fe1519b8f15000000000000000000c63a8848a448a43c9e4402bd893f701cd11856e14cbbe026699e8fdc445b35a8d93c9c5ba1192817b945dc6c00000020f402c0b551b944665332466753f1eebb846a64ef24c71700000000000000000033fc68e070964e908d961cd11033896fa6c9b8b76f64a2db7ea928afa7e304257d3f9c5ba11928176164145d0000ff3f63d40efa46403afd71a254b54f2b495b7b0164991c2d22000000000000000000f046dc1b71560b7d0786cfbdb25ae320bd9644c98d5c7c77bf9df05cbe96212758419c5ba1192817a2bb2caa00000020e2d4f0edd5edd80bdcb880535443747c6b22b48fb6200d0000000000000000001d3799aa3eb8d18916f46bf2cf807cb89a9b1b4c56c3f2693711bf1064d9a32435429c5ba1192817752e49ae0000002022dba41dff28b337ee3463bf1ab1acf0e57443e0f7ab1d000000000000000000c3aadcc8def003ecbd1ba514592a18baddddcd3a287ccf74f584b04c5c10044e97479c5ba1192817c341f595',

  HEADER_CHAIN_LEN: '0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b000020fe70e48339d6b17fbbf1340d245338f57336e97767cc240000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d9515900000020baaea6746f4c16ccb7cd961655b636d39b5fe1519b8f15000000000000000000c63a8848a448a43c9e4402bd893f701cd11856e14cbbe026699e8fdc445b35a8d93c9c5ba1192817b945dc6c00000020f402c0b551b944665332466753f1eebb846a64ef24c71700000000000000000033fc68e070964e908d961cd11033896fa6c9b8b76f64a2db7ea928afa7e304257d3f9c5ba11928176164145d0000ff3f63d40efa46403afd71a254b54f2b495b7b0164991c2d22000000000000000000f046dc1b71560b7d0786cfbdb25ae320bd9644c98d5c7c77bf9df05cbe96212758419c5ba1192817a2bb2caa00000020e2d4f0edd5edd80bdcb880535443747c6b22b48fb6200d0000000000000000001d3799aa3eb8d18916f46bf2cf807cb89a9b1b4c56c3f2693711bf1064d9a32435429c5ba1192817752e49ae0000002022dba41dff28b337ee3463bf1ab1acf0e57443e0f7ab1d000000000000000000c3aadcc8def003ecbd1ba514592a18baddddcd3a287ccf74f584b04c5c10044e97479c5ba1192817c341f595',

  HEADER_0_LEN: '0x00002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b',

  // Changed 1 byte near end to make work low
  HEADER_CHAIN_LOW_WORK: '0xbbbbbbbb7777777777777777777777777777777777777777777777777777777777777777e0e333d0fd648162d344c1a760a319f2184ab2dce1335353f36da2eea155f97fccccccccffff001fe85f0000bbbbbbbbcbee0f1f713bdfca4aa550474f7f252581268935ef8948f18d48ec0a2b4800008888888888888888888888888888888888888888888888888888888888888888ccccccccffff001f01440000bbbbbbbbfe6c72f9b42e11c339a9cbe1185b2e16b74acce90c8316f4a5c8a6c0a10f00008888888888888888888888888888888888888888888888888888888888888888dcccccccffff001f30340000'
};

exports.OP_RETURN = {
  VERSION: '0x01000000',
  VIN: '0x011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff',
  VOUT: '0x024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211',
  LOCKTIME_LE: '0x00000000',
  LOCKTIME: 0,
  N_INPUTS_HEX: '0x01',
  N_INPUTS: 1,
  N_OUTPUTS_HEX: '0x02',
  N_OUTPUTS: 2,
  INPUTS: '0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff',
  OUTPUTS: '0x4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211',
  INDEXED_INPUTS: [
    {
      INPUT: '0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff',
      SEQUENCE_LE: '0xffffffff',
      SEQUENCE: 4294967295,
      HASH_LE: '0x48e5a1a0e616d8fd92b4ef228c424e0c816799a256c6a90892195ccfc53300d6',
      HASH_BE: '0xd60033c5cf5c199208a9c656a29967810c4e428c22efb492fdd816e6a0a1e548',
      INDEX: 0
    }
  ],
  INDEXED_OUTPUTS: [
    {
      OUTPUT: '0x4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c18',
      VALUE: 497480,
      VALUE_LE: '0x4897070000000000',
      PAYLOAD: '0xa4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c18',
      TYPE: 1 // WPKH
    },
    {
      OUTPUT: '0x0000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211',
      VALUE: 0,
      VALUE_LE: '0x0000000000000000',
      PAYLOAD: '0xedb1b5c2f39af0fec151732585b1049b07895211',
      TYPE: 3 // OP_RETURN
    }
  ],
  TX: '0x010000000001011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000',
  TXID_BE: '0xd60033c5cf5c199208a9c656a29967810c4e428c22efb492fdd816e6a0a1e548',
  TXID_LE: '0x48e5a1a0e616d8fd92b4ef228c424e0c816799a256c6a90892195ccfc53300d6',
  HEADER_CHAIN: '0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b00000020fe70e48339d6b17fbbf1340d245338f57336e97767cc240000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d9515900000020baaea6746f4c16ccb7cd961655b636d39b5fe1519b8f15000000000000000000c63a8848a448a43c9e4402bd893f701cd11856e14cbbe026699e8fdc445b35a8d93c9c5ba1192817b945dc6c00000020f402c0b551b944665332466753f1eebb846a64ef24c71700000000000000000033fc68e070964e908d961cd11033896fa6c9b8b76f64a2db7ea928afa7e304257d3f9c5ba11928176164145d0000ff3f63d40efa46403afd71a254b54f2b495b7b0164991c2d22000000000000000000f046dc1b71560b7d0786cfbdb25ae320bd9644c98d5c7c77bf9df05cbe96212758419c5ba1192817a2bb2caa00000020e2d4f0edd5edd80bdcb880535443747c6b22b48fb6200d0000000000000000001d3799aa3eb8d18916f46bf2cf807cb89a9b1b4c56c3f2693711bf1064d9a32435429c5ba1192817752e49ae0000002022dba41dff28b337ee3463bf1ab1acf0e57443e0f7ab1d000000000000000000c3aadcc8def003ecbd1ba514592a18baddddcd3a287ccf74f584b04c5c10044e97479c5ba1192817c341f595',
  INDEXED_HEADERS: [
    {
      INDEX: 0,
      HEADER: '0x0000002073bd2184edd9c4fc76642ea6754ee40136970efc10c4190000000000000000000296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c216349c5ba11928170d38782b',
      DIGEST_BE: '0x00000000000000000024cc6777e93673f53853240d34f1bb7fb1d63983e470fe',
      DIGEST_LE: '0xfe70e48339d6b17fbbf1340d245338f57336e97767cc24000000000000000000',
      VERSION_LE: '0x00000020',
      VERSION: 536870912,
      PREV_HASH_BE: '0x00000000000000000019c410fc0e973601e44e75a62e6476fcc4d9ed8421bd73',
      PREV_HASH_LE: '0x73bd2184edd9c4fc76642ea6754ee40136970efc10c419000000000000000000',
      MERKLE_ROOT_BE: '0xc2c86141dac443ac71c37aadb19dd487be947dbf225f69cfa56da93e12ef9602',
      MERKLE_ROOT_LE: '0x0296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c2',
      TIMESTAMP_LE: '0x16349c5b',
      TIMESTAMP: 1536963606,
      NBITS: '0xa1192817',
      TARGET: 3840827764407250199942201944063224491938810378873470976,
      NONCE_LE: '0x0d38782b',
      NONCE: 729298957
    },
    {
      INDEX: 1,
      HEADER: '0x00000020fe70e48339d6b17fbbf1340d245338f57336e97767cc240000000000000000005af53b865c27c6e9b5e5db4c3ea8e024f8329178a79ddb39f7727ea2fe6e6825d1349c5ba1192817e2d95159',
      DIGEST_LE: '0xbaaea6746f4c16ccb7cd961655b636d39b5fe1519b8f15000000000000000000'
    },
    {
      INDEX: 6,
      DIGEST_BE: '0000000000000000000431d2d0fcd57f81315cd7e0a00ec57eb713680a834e07'
    }
  ],
  PROOF_INDEX: 281,
  PROOF: '0xe35a0d6de94b656694589964a252957e4673a9fb1d2f8b4a92e3f0a7bb654fddb94e5a1e6d7f7f499fd1be5dd30a73bf5584bf137da5fdd77cc21aeb95b9e35788894be019284bd4fbed6dd6118ac2cb6d26bc4be4e423f55a3a48f2874d8d02a65d9c87d07de21d4dfe7b0a9f4a23cc9a58373e9e6931fefdb5afade5df54c91104048df1ee999240617984e18b6f931e2373673d0195b8c6987d7ff7650d5ce53bcec46e13ab4f2da1146a7fc621ee672f62bc22742486392d75e55e67b09960c3386a0b49e75f1723d6ab28ac9a2028a0c72866e2111d79d4817b88e17c821937847768d92837bae3832bb8e5a4ab4434b97e00a6c10182f211f592409068d6f5652400d9a3d1cc150a7fb692e874cc42d76bdafc842f2fe0f835a7c24d2d60c109b187d64571efbaa8047be85821f8e67e0e85f2f5894bc63d00c2ed9d64',
  TX_ERR: {
    TX_VERSION: '0x030000000001011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000',
    TX_MARKER: '0x010000001101011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000',
    TX_WITNESS_FLAG: '0x010000000003011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000',
    TX_NO_MARKER_WITNESS_FLAG: '0x01000000011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000',
    TX_INPUT_0_HASH: '0x010000000001010000000000000000000000000000000000000000000000000000000000000000000000000000000000024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000',
    TX_NINPUT_ZERO: '0x010000000001001746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000',
    TX_NOUTPUT_ZERO: '0x010000000001011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff004897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211024730440220276e0ec78028582054d86614c65bc4bf85ff5710b9d3a248ca28dd311eb2fa6802202ec950dd2a8c9435ff2d400cc45d7a4854ae085f49e05cc3f503834546d410de012103732783eef3af7e04d3af444430a629b16a9261e4025f52bf4d6d026299c37c7400000000',
  },
  PROOF_ERR: {
    PROOF_FIRST_HASH: '0x08e5a1a0e616d8fd92b4ef228c424e0c816799a256c6a90892195ccfc53300d6e35a0d6de94b656694589964a252957e4673a9fb1d2f8b4a92e3f0a7bb654fddb94e5a1e6d7f7f499fd1be5dd30a73bf5584bf137da5fdd77cc21aeb95b9e35788894be019284bd4fbed6dd6118ac2cb6d26bc4be4e423f55a3a48f2874d8d02a65d9c87d07de21d4dfe7b0a9f4a23cc9a58373e9e6931fefdb5afade5df54c91104048df1ee999240617984e18b6f931e2373673d0195b8c6987d7ff7650d5ce53bcec46e13ab4f2da1146a7fc621ee672f62bc22742486392d75e55e67b09960c3386a0b49e75f1723d6ab28ac9a2028a0c72866e2111d79d4817b88e17c821937847768d92837bae3832bb8e5a4ab4434b97e00a6c10182f211f592409068d6f5652400d9a3d1cc150a7fb692e874cc42d76bdafc842f2fe0f835a7c24d2d60c109b187d64571efbaa8047be85821f8e67e0e85f2f5894bc63d00c2ed9d640296ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c2',
    PROOF_LAST_HASH: '0x48e5a1a0e616d8fd92b4ef228c424e0c816799a256c6a90892195ccfc53300d6e35a0d6de94b656694589964a252957e4673a9fb1d2f8b4a92e3f0a7bb654fddb94e5a1e6d7f7f499fd1be5dd30a73bf5584bf137da5fdd77cc21aeb95b9e35788894be019284bd4fbed6dd6118ac2cb6d26bc4be4e423f55a3a48f2874d8d02a65d9c87d07de21d4dfe7b0a9f4a23cc9a58373e9e6931fefdb5afade5df54c91104048df1ee999240617984e18b6f931e2373673d0195b8c6987d7ff7650d5ce53bcec46e13ab4f2da1146a7fc621ee672f62bc22742486392d75e55e67b09960c3386a0b49e75f1723d6ab28ac9a2028a0c72866e2111d79d4817b88e17c821937847768d92837bae3832bb8e5a4ab4434b97e00a6c10182f211f592409068d6f5652400d9a3d1cc150a7fb692e874cc42d76bdafc842f2fe0f835a7c24d2d60c109b187d64571efbaa8047be85821f8e67e0e85f2f5894bc63d00c2ed9d640096ef123ea96da5cf695f22bf7d94be87d49db1ad7ac371ac43c4da4161c8c2'
  }
};

exports.RETARGET_TUPLES = [[{
  hash:
       '000000000000000000043c0b1ba0e06f1569ff7cebca6a78a84f4025712067ae',
  version: 541065216,
  prev_block:
       '00000000000000000015a08d0a60237487070fe0d956d5fb5fd9d21ad6d7b2d3',
  merkle_root:
       'd192743a2c190a7421f92fefe92505579d7b8eda568cacee13b25751ac704c66',
  timestamp: 1545175965,
  nbits: 'f41e3717',
  nonce: '21bae3e7',
  difficulty: BigInt('5106422924659'),
  hex:
       '00004020d3b2d7d61ad2d95ffbd556d9e00f07877423600a8da015000000000000000000d192743a2c190a7421f92fefe92505579d7b8eda568cacee13b25751ac704c669d83195cf41e371721bae3e7',
  height: 554400,
  accumulated_work: 8158513584539755
},
{
  hash:
       '00000000000000000008f4f64baaa9b28d4476f2a000c459df492d5664320b12',
  version: 536870912,
  prev_block:
       '0000000000000000002089653c6ee3ecd6ecca09b937a9cab9da14ea8b387dbc',
  merkle_root:
       '7c0900cf1a9b40411141859b98bf95fb9d414f49044e08acff21fa54506022a4',
  timestamp: 1546275302,
  nbits: 'f41e3717',
  nonce: 'd2864679',
  difficulty: BigInt('5106422924659'),
  hex:
       '00000020bc7d388bea14dab9caa937b909caecd6ece36e3c6589200000000000000000007c0900cf1a9b40411141859b98bf95fb9d414f49044e08acff21fa54506022a4e6492a5cf41e3717d2864679',
  height: 556415,
  accumulated_work: 18447955777727640
},
{
  hash:
       '0000000000000000002a531985d49cdb5adcd1db0578845a233a3a2cfdefdf8f',
  version: 536870912,
  prev_block:
       '00000000000000000008f4f64baaa9b28d4476f2a000c459df492d5664320b12',
  merkle_root:
       '5cb4b52150fe7dec217b74db424e442ef8b24105c244ebaeb59f638db9c48ef3',
  timestamp: 1546276809,
  nbits: 'a5183217',
  nonce: 'b412a530',
  difficulty: BigInt('5618595848853'),
  hex:
       '00000020120b3264562d49df59c400a0f276448db2a9aa4bf6f4080000000000000000005cb4b52150fe7dec217b74db424e442ef8b24105c244ebaeb59f638db9c48ef3c94f2a5ca5183217b412a530',
  height: 556416,
  accumulated_work: 18453574373576492
}],
[{
  hash:
       '0000000000000000002a531985d49cdb5adcd1db0578845a233a3a2cfdefdf8f',
  version: 536870912,
  prev_block:
       '00000000000000000008f4f64baaa9b28d4476f2a000c459df492d5664320b12',
  merkle_root:
       '5cb4b52150fe7dec217b74db424e442ef8b24105c244ebaeb59f638db9c48ef3',
  timestamp: 1546276809,
  nbits: 'a5183217',
  nonce: 'b412a530',
  difficulty: BigInt('5618595848853'),
  hex:
       '00000020120b3264562d49df59c400a0f276448db2a9aa4bf6f4080000000000000000005cb4b52150fe7dec217b74db424e442ef8b24105c244ebaeb59f638db9c48ef3c94f2a5ca5183217b412a530',
  height: 556416,
  accumulated_work: 18453574373576492
},
{
  hash:
       '00000000000000000028a69d9498c46b2b073752133e3e9e585965e7dab55065',
  version: 541065216,
  prev_block:
       '0000000000000000000fe62df0a448387749c30d5d2a5f1023066c4f3a97c922',
  merkle_root:
       'e88eabc4c6398c80cea87f6d1d662c6640de4719f7949ae85afe75746dd04abb',
  timestamp: 1547431851,
  nbits: 'a5183217',
  nonce: 'f6d45f41',
  difficulty: BigInt('5618595848853'),
  hex:
       '0000402022c9973a4f6c0623105f2a5d0dc349773848a4f02de60f000000000000000000e88eabc4c6398c80cea87f6d1d662c6640de4719f7949ae85afe75746dd04abbabef3b5ca5183217f6d45f41',
  height: 558431,
  accumulated_work: 29775045009015290
},
{
  hash:
       '00000000000000000021ac236d0b29b4467f99c2c8783032451ba7b735045e3c',
  version: 805289984,
  prev_block:
       '00000000000000000028a69d9498c46b2b073752133e3e9e585965e7dab55065',
  merkle_root:
       '5988783435f506d2ccfbadb484e56d6f1d5dfdd480650acae1e3b43d3464ea73',
  timestamp: 1547432394,
  nbits: '33d62f17',
  nonce: '1d508fdb',
  difficulty: BigInt('5883988430955'),
  hex:
       '00c0ff2f6550b5dae76559589e3e3e135237072b6bc498949da6280000000000000000005988783435f506d2ccfbadb484e56d6f1d5dfdd480650acae1e3b43d3464ea73caf13b5c33d62f171d508fdb',
  height: 558432,
  accumulated_work: 29780928997446244
}],
[{
  hash:
       '00000000000000000021ac236d0b29b4467f99c2c8783032451ba7b735045e3c',
  version: 805289984,
  prev_block:
       '00000000000000000028a69d9498c46b2b073752133e3e9e585965e7dab55065',
  merkle_root:
       '5988783435f506d2ccfbadb484e56d6f1d5dfdd480650acae1e3b43d3464ea73',
  timestamp: 1547432394,
  nbits: '33d62f17',
  nonce: '1d508fdb',
  difficulty: BigInt('5883988430955'),
  hex:
       '00c0ff2f6550b5dae76559589e3e3e135237072b6bc498949da6280000000000000000005988783435f506d2ccfbadb484e56d6f1d5dfdd480650acae1e3b43d3464ea73caf13b5c33d62f171d508fdb',
  height: 558432,
  accumulated_work: 29780928997446244
},
{
  hash:
       '00000000000000000014dbca1d9ea7256a3993253c033a50d8b3064a2cbd056b',
  version: 536870912,
  prev_block:
       '00000000000000000023cf32e875ff55fc6e73dea5bb4fb92235e3a54ce5e8d8',
  merkle_root:
       '07b395f80858ee022c9c3c2f0f5cee4bd807039f0729b0559ae4326c3ba77d6b',
  timestamp: 1548656416,
  nbits: '33d62f17',
  nonce: '46ee356d',
  difficulty: BigInt('5883988430955'),
  hex:
       '00000020d8e8e54ca5e33522b94fbba5de736efc55ff75e832cf2300000000000000000007b395f80858ee022c9c3c2f0f5cee4bd807039f0729b0559ae4326c3ba77d6b209f4e5c33d62f1746ee356d',
  height: 560447,
  accumulated_work: 41637165685820570
},
{
  hash:
       '00000000000000000020adeb95048ff41daac22d2dd97414fd5c47cdc391923a',
  version: 536870912,
  prev_block:
       '00000000000000000014dbca1d9ea7256a3993253c033a50d8b3064a2cbd056b',
  merkle_root:
       '1b08df3d42cd9a38d8b66adf9dc5eb464f503633bd861085ffff723634531596',
  timestamp: 1548657313,
  nbits: '35683017',
  nonce: 'bf67b72a',
  difficulty: BigInt('5814661935891'),
  hex:
       '000000206b05bd2c4a06b3d8503a033c2593396a25a79e1dcadb140000000000000000001b08df3d42cd9a38d8b66adf9dc5eb464f503633bd861085ffff723634531596a1a24e5c35683017bf67b72a',
  height: 560448,
  accumulated_work: 41642980347756456
}],
[{
  hash:
       '00000000000000000020adeb95048ff41daac22d2dd97414fd5c47cdc391923a',
  version: 536870912,
  prev_block:
       '00000000000000000014dbca1d9ea7256a3993253c033a50d8b3064a2cbd056b',
  merkle_root:
       '1b08df3d42cd9a38d8b66adf9dc5eb464f503633bd861085ffff723634531596',
  timestamp: 1548657313,
  nbits: '35683017',
  nonce: 'bf67b72a',
  difficulty: BigInt('5814661935891'),
  hex:
       '000000206b05bd2c4a06b3d8503a033c2593396a25a79e1dcadb140000000000000000001b08df3d42cd9a38d8b66adf9dc5eb464f503633bd861085ffff723634531596a1a24e5c35683017bf67b72a',
  height: 560448,
  accumulated_work: 41642980347756456
},
{
  hash:
       '00000000000000000019046cf62aa17f6e526636c71c09161c8e730b64d755ae',
  version: 536870912,
  prev_block:
       '0000000000000000000d58e0330e678481f4a1d73a9a262cee3e729e914a6da4',
  merkle_root:
       'd0df74c5c0ca4ee2c0f0a93e173d5ea68788413febe3d572f573bf2ef2a90667',
  timestamp: 1549817652,
  nbits: '35683017',
  nonce: 'deaa6854',
  difficulty: BigInt('5814661935891'),
  hex:
       '00000020a46d4a919e723eee2c269a3ad7a1f48184670e33e0580d000000000000000000d0df74c5c0ca4ee2c0f0a93e173d5ea68788413febe3d572f573bf2ef2a906673457605c35683017deaa6854',
  height: 562463,
  accumulated_work: 53359524148576824
},
{
  hash:
       '0000000000000000000db7442b5662bbd980d7c2db1aef2ca925917ae392df11',
  version: 536870912,
  prev_block:
       '00000000000000000019046cf62aa17f6e526636c71c09161c8e730b64d755ae',
  merkle_root:
       'f7825fe0714275fe54521f66e898cf743ed43dd93f185cb628df995823e4ee2d',
  timestamp: 1549817981,
  nbits: '886f2e17',
  nonce: '6d085a4c',
  difficulty: BigInt('6061518831027'),
  hex:
       '00000020ae55d7640b738e1c16091cc73666526e7fa12af66c0419000000000000000000f7825fe0714275fe54521f66e898cf743ed43dd93f185cb628df995823e4ee2d7d58605c886f2e176d085a4c',
  height: 562464,
  accumulated_work: 53365585667407850
}],
[{
  hash:
       '0000000000000000000db7442b5662bbd980d7c2db1aef2ca925917ae392df11',
  version: 536870912,
  prev_block:
       '00000000000000000019046cf62aa17f6e526636c71c09161c8e730b64d755ae',
  merkle_root:
       'f7825fe0714275fe54521f66e898cf743ed43dd93f185cb628df995823e4ee2d',
  timestamp: 1549817981,
  nbits: '886f2e17',
  nonce: '6d085a4c',
  difficulty: BigInt('6061518831027'),
  hex:
       '00000020ae55d7640b738e1c16091cc73666526e7fa12af66c0419000000000000000000f7825fe0714275fe54521f66e898cf743ed43dd93f185cb628df995823e4ee2d7d58605c886f2e176d085a4c',
  height: 562464,
  accumulated_work: 53365585667407850
},
{
  hash:
       '00000000000000000017e5c36734296b27065045f181e028c0d91cebb336d50c',
  version: 536870912,
  prev_block:
       '0000000000000000000365d89a02f14ef85eb497a51b010622d0e48ef70efeb4',
  merkle_root:
       '34fdbe970f5d00d2e37de72755077c7039976baa5417ddfd358013d8ea9cb8d3',
  timestamp: 1551025524,
  nbits: '886f2e17',
  nonce: '95d4ee3a',
  difficulty: BigInt('6061518831027'),
  hex:
       '00000020b4fe0ef78ee4d02206011ba597b45ef84ef1029ad8650300000000000000000034fdbe970f5d00d2e37de72755077c7039976baa5417ddfd358013d8ea9cb8d374c5725c886f2e1795d4ee3a',
  height: 564479,
  accumulated_work: 65579546111927256
},
{
  hash:
       '0000000000000000002567dc317da20ddb0d7ef922fe1f9c2375671654f9006c',
  version: 536870912,
  prev_block:
       '00000000000000000017e5c36734296b27065045f181e028c0d91cebb336d50c',
  merkle_root:
       '7bc1b27489db01c85d38a4bc6d2280611e9804f506d83ad00d2a33ebd663992f',
  timestamp: 1551026038,
  nbits: '505b2e17',
  nonce: '4fb90f55',
  difficulty: BigInt('6071846049920'),
  hex:
       '000000200cd536b3eb1cd9c028e081f1455006276b293467c3e5170000000000000000007bc1b27489db01c85d38a4bc6d2280611e9804f506d83ad00d2a33ebd663992f76c7725c505b2e174fb90f55',
  height: 564480,
  accumulated_work: 65585617957977176
}],
[{
  hash:
       '0000000000000000002567dc317da20ddb0d7ef922fe1f9c2375671654f9006c',
  version: 536870912,
  prev_block:
       '00000000000000000017e5c36734296b27065045f181e028c0d91cebb336d50c',
  merkle_root:
       '7bc1b27489db01c85d38a4bc6d2280611e9804f506d83ad00d2a33ebd663992f',
  timestamp: 1551026038,
  nbits: '505b2e17',
  nonce: '4fb90f55',
  difficulty: BigInt('6071846049920'),
  hex:
       '000000200cd536b3eb1cd9c028e081f1455006276b293467c3e5170000000000000000007bc1b27489db01c85d38a4bc6d2280611e9804f506d83ad00d2a33ebd663992f76c7725c505b2e174fb90f55',
  height: 564480,
  accumulated_work: 65585617957977176
},
{
  hash:
       '0000000000000000002296c06935b34f3ed946d98781ff471a99101796e8611b',
  version: 536870912,
  prev_block:
       '0000000000000000000d19c44e45aa18947b696ce3ebfd03b06a24e5c4d86421',
  merkle_root:
       '59134ad5aaad38a0e75946c7d4cb09b3ad45b459070195dd564cde193cf0ef29',
  timestamp: 1552236227,
  nbits: '505b2e17',
  nonce: 'f61af734',
  difficulty: BigInt('6071846049920'),
  hex:
       '000000202164d8c4e5246ab003fdebe36c697b9418aa454ec4190d00000000000000000059134ad5aaad38a0e75946c7d4cb09b3ad45b459070195dd564cde193cf0ef29c33e855c505b2e17f61af734',
  height: 566495,
  accumulated_work: 77820387748565980
},
{
  hash:
       '00000000000000000015fea169c62eb0a1161aba36932ca32bc3785cbb3480bf',
  version: 536870912,
  prev_block:
       '0000000000000000002296c06935b34f3ed946d98781ff471a99101796e8611b',
  merkle_root:
       'd0098658f53531e6e67fc9448986b5a8f994da42d746079eabe10f55e561e243',
  timestamp: 1552236304,
  nbits: '17612e17',
  nonce: '35c4afdb',
  difficulty: BigInt('6068891541676'),
  hex:
       '000000201b61e8961710991a47ff8187d946d93e4fb33569c09622000000000000000000d0098658f53531e6e67fc9448986b5a8f994da42d746079eabe10f55e561e243103f855c17612e1735c4afdb',
  height: 566496,
  accumulated_work: 77826456640107650
}],
[{
  hash:
       '00000000000000000015fea169c62eb0a1161aba36932ca32bc3785cbb3480bf',
  version: 536870912,
  prev_block:
       '0000000000000000002296c06935b34f3ed946d98781ff471a99101796e8611b',
  merkle_root:
       'd0098658f53531e6e67fc9448986b5a8f994da42d746079eabe10f55e561e243',
  timestamp: 1552236304,
  nbits: '17612e17',
  nonce: '35c4afdb',
  difficulty: BigInt('6068891541676'),
  hex:
       '000000201b61e8961710991a47ff8187d946d93e4fb33569c09622000000000000000000d0098658f53531e6e67fc9448986b5a8f994da42d746079eabe10f55e561e243103f855c17612e1735c4afdb',
  height: 566496,
  accumulated_work: 77826456640107650
},
{
  hash:
       '0000000000000000001ccf7aa37a7f07e4d709eef9c6c4abd0b808686b14c314',
  version: 536870912,
  prev_block:
       '00000000000000000006ff7fe98d6da7cc7af77afe27a1d83ae17d4a4af3e254',
  merkle_root:
       'f09f9736ab073f80f014a03e68c2409cd16a3d5f43f512638e6b67131d7f7c9b',
  timestamp: 1553387053,
  nbits: '17612e17',
  nonce: '749cdf0c',
  difficulty: BigInt('6068891541676'),
  hex:
       '0000002054e2f34a4a7de13ad8a127fe7af77acca76d8de97fff06000000000000000000f09f9736ab073f80f014a03e68c2409cd16a3d5f43f512638e6b67131d7f7c9b2dce965c17612e17749cdf0c',
  height: 568511,
  accumulated_work: 90055273096584800
},
{
  hash:
       '0000000000000000001debd424683ee6c16b05a441309f96925dad309af03e80',
  version: 536870912,
  prev_block:
       '0000000000000000001ccf7aa37a7f07e4d709eef9c6c4abd0b808686b14c314',
  merkle_root:
       '68149a62b93c2c9f91fbaa2973ca1b79ba11fc5ee8c6cce9f01861e8ad02cd82',
  timestamp: 1553387093,
  nbits: '6c1f2c17',
  nonce: '77fabf78',
  difficulty: BigInt('6379265451411'),
  hex:
       '0000002014c3146b6808b8d0abc4c6f9ee09d7e4077f7aa37acf1c00000000000000000068149a62b93c2c9f91fbaa2973ca1b79ba11fc5ee8c6cce9f01861e8ad02cd8255ce965c6c1f2c1777fabf78',
  height: 568512,
  accumulated_work: 90061652362036210
}],
[{
  hash:
       '0000000000000000001debd424683ee6c16b05a441309f96925dad309af03e80',
  version: 536870912,
  prev_block:
       '0000000000000000001ccf7aa37a7f07e4d709eef9c6c4abd0b808686b14c314',
  merkle_root:
       '68149a62b93c2c9f91fbaa2973ca1b79ba11fc5ee8c6cce9f01861e8ad02cd82',
  timestamp: 1553387093,
  nbits: '6c1f2c17',
  nonce: '77fabf78',
  difficulty: BigInt('6379265451411'),
  hex:
       '0000002014c3146b6808b8d0abc4c6f9ee09d7e4077f7aa37acf1c00000000000000000068149a62b93c2c9f91fbaa2973ca1b79ba11fc5ee8c6cce9f01861e8ad02cd8255ce965c6c1f2c1777fabf78',
  height: 568512,
  accumulated_work: 90061652362036210
},
{
  hash:
       '0000000000000000000de3e7a7711130dbac9fb0a14e5ad6ab72d080182f3321',
  version: 805257216,
  prev_block:
       '000000000000000000078e0449cd368f8b463b3a3585bd8b7d197a23cf547622',
  merkle_root:
       '34e7151e2fdaf85bf6751d1281c027b630c481318c3762fa10c318b7f19286e8',
  timestamp: 1554594090,
  nbits: '6c1f2c17',
  nonce: '3f83f821',
  difficulty: BigInt('6379265451411'),
  hex:
       '0040ff2f227654cf237a197d8bbd85353a3b468b8f36cd49048e0700000000000000000034e7151e2fdaf85bf6751d1281c027b630c481318c3762fa10c318b7f19286e82a39a95c6c1f2c173f83f821',
  height: 570527,
  accumulated_work: 102915872246629380
},
{
  hash:
       '0000000000000000000d4833adbfb465d4cfb57c2918b830db228cf1b217d99f',
  version: 541065216,
  prev_block:
       '0000000000000000000de3e7a7711130dbac9fb0a14e5ad6ab72d080182f3321',
  merkle_root:
       '71b3a61247a4cf6b892055f278247f33d76fa90b48c76fda69f583268cb965f8',
  timestamp: 1554594223,
  nbits: '1d072c17',
  nonce: '0022062d',
  difficulty: BigInt('6393023717201'),
  hex:
       '0000402021332f1880d072abd65a4ea1b09facdb301171a7e7e30d00000000000000000071b3a61247a4cf6b892055f278247f33d76fa90b48c76fda69f583268cb965f8af39a95c1d072c170022062d',
  height: 570528,
  accumulated_work: 102922265270346580
}]];
