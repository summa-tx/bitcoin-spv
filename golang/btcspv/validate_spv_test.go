package btcspv

func normalizeToByteSlice(b interface{}) []byte {
	switch b.(type) {
	case []byte:
		return b.([]byte)
	case Hash256Digest:
		h := b.(Hash256Digest)
		return h[:]
	case RawHeader:
		h := b.(RawHeader)
		return h[:]
	default:
		panic("Bad normalization")
	}
}

// func (suite *UtilsSuite) TestProve() {
// 	fixture := suite.Fixtures["prove"]

// 	for i := range fixture {
// 		testCase := fixture[i]
// 		expected := testCase.Output.(bool)
// 		inputs := testCase.Input.(map[string]interface{})
// 		txIDLE := inputs["txIdLE"].(Hash256Digest)
// 		merkleRootLE := inputs["merkleRootLE"].(Hash256Digest)
// 		proof := inputs["proof"].([]byte)
// 		index := uint(inputs["index"].(int))
// 		actual := Prove(txIDLE, merkleRootLE, proof, index)
// 		suite.Equal(expected, actual)
// 	}
// }

// func (suite *UtilsSuite) TestCalculateTxId() {
// 	fixture := suite.Fixtures["calculateTxId"]

// 	for i := range fixture {
// 		testCase := fixture[i]
// 		expected := testCase.Output.(Hash256Digest)
// 		inputs := testCase.Input.(map[string]interface{})
// 		version := inputs["version"].([]byte)
// 		vin := inputs["vin"].([]byte)
// 		vout := inputs["vout"].([]byte)
// 		locktime := inputs["locktime"].([]byte)
// 		actual := CalculateTxID(version, vin, vout, locktime)
// 		suite.Equal(expected, actual)
// 	}
// }

// func (suite *UtilsSuite) TestValidateHeaderWork() {
// 	var target sdk.Uint
// 	fixture := suite.Fixtures["validateHeaderWork"]

// 	for i := range fixture {
// 		testCase := fixture[i]
// 		expected := testCase.Output.(bool)
// 		inputs := testCase.Input.(map[string]interface{})
// 		digest := inputs["digest"].(Hash256Digest)

// 		switch inputs["target"].(type) {
// 		case int:
// 			targetInt := inputs["target"].(int)
// 			target = sdk.NewUint(uint64(targetInt))
// 		case Hash256Digest:
// 			buf := inputs["target"].(Hash256Digest)
// 			target = BytesToBigUint(buf[:])
// 		case []byte:
// 			buf := inputs["target"].([]byte)
// 			target = BytesToBigUint(buf[:])
// 		}

// 		actual := ValidateHeaderWork(digest, target)
// 		suite.Equal(expected, actual)
// 	}
// }

// func (suite *UtilsSuite) TestValidateHeaderPrevHash() {
// 	fixture := suite.Fixtures["validateHeaderPrevHash"]

// 	for i := range fixture {
// 		testCase := fixture[i]
// 		expected := testCase.Output.(bool)
// 		inputs := testCase.Input.(map[string]interface{})
// 		header := inputs["header"].(RawHeader)
// 		prevHash := inputs["prevHash"].(Hash256Digest)
// 		actual := ValidateHeaderPrevHash(header, prevHash)
// 		suite.Equal(expected, actual)
// 	}
// }

// func (suite *UtilsSuite) TestValidateHeaderChain() {
// 	fixture := suite.Fixtures["validateHeaderChain"]

// 	for i := range fixture {
// 		testCase := fixture[i]
// 		expected := sdk.NewUint(uint64(testCase.Output.(int)))
// 		actual, err := ValidateHeaderChain(testCase.Input.([]byte))
// 		suite.Nil(err)
// 		suite.Equal(expected, actual)
// 	}

// 	fixture = suite.Fixtures["validateHeaderChainError"]

// 	for i := range fixture {
// 		testCase := fixture[i]
// 		expected := testCase.ErrorMessage.(string)
// 		actual, err := ValidateHeaderChain(testCase.Input.([]byte))
// 		suite.EqualError(err, expected)
// 		suite.Equal(actual, sdk.NewUint(0))
// 	}
// }
