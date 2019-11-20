package btcspv

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
)

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

func (suite *UtilsSuite) TestProve() {
	fixture := suite.Fixtures["prove"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(bool)
		inputs := testCase.Input.(map[string]interface{})
		txIDLE := inputs["txIdLE"].(Hash256Digest)
		merkleRootLE := inputs["merkleRootLE"].(Hash256Digest)
		proof := inputs["proof"].([]byte)
		index := uint(inputs["index"].(int))
		actual := Prove(txIDLE, merkleRootLE, proof, index)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestCalculateTxId() {
	fixture := suite.Fixtures["calculateTxId"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(Hash256Digest)
		inputs := testCase.Input.(map[string]interface{})
		version := inputs["version"].([]byte)
		vin := inputs["vin"].([]byte)
		vout := inputs["vout"].([]byte)
		locktime := inputs["locktime"].([]byte)
		actual := CalculateTxID(version, vin, vout, locktime)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestParseInput() {
	fixture := suite.Fixtures["parseInput"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(map[string]interface{})
		expectedSequence := uint(expected["sequence"].(int))
		expectedTxID := expected["txId"].(Hash256Digest)
		expectedIndex := uint(expected["index"].(int))
		expectedType := InputType(expected["type"].(int))
		input := testCase.Input.([]byte)
		actualSequence, actualTxID, actualIndex, actualType := ParseInput(input)
		suite.Equal(expectedSequence, actualSequence)
		suite.Equal(expectedTxID, actualTxID)
		suite.Equal(expectedIndex, actualIndex)
		suite.Equal(expectedType, actualType)
	}
}

func (suite *UtilsSuite) TestParseOutput() {
	fixture := suite.Fixtures["parseOutput"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(map[string]interface{})
		expectedValue := uint(expected["value"].(int))
		expectedOutputType := OutputType(expected["type"].(int))
		expectedPayload := normalizeToByteSlice(expected["payload"])
		input := normalizeToByteSlice(testCase.Input)
		actualValue, actualOutputType, actualPayload := ParseOutput(input)
		suite.Equal(expectedValue, actualValue)
		suite.Equal(expectedPayload, actualPayload)
		suite.Equal(expectedOutputType, actualOutputType)
	}
}

// func (suite *UtilsSuite) TestParseHeader() {
// 	fixture := suite.Fixtures["parseHeader"]

// 	for i := range fixture {
// 		testCase := fixture[i]
// 		expected := testCase.Output.(map[string]interface{})
// 		expectedDigest := expected["digest"].(Hash256Digest)
// 		expectedVersion := uint(expected["version"].(int))
// 		expectedPrevHash := expected["prevHash"].(Hash256Digest)
// 		expectedMerkleRoot := expected["merkleRoot"].(Hash256Digest)
// 		expectedTimestamp := uint(expected["timestamp"].(int))
// 		expectedTarget := BytesToBigUint(expected["target"].([]byte))
// 		expectedNonce := uint(expected["nonce"].(int))
// 		input := testCase.Input.(RawHeader)
// 		actualDigest, actualVersion, actualPrevHash, actualMerkleRoot, actualTimestamp, actualTarget, actualNonce, err := ParseHeader(input)
// 		suite.Nil(err)
// 		suite.Equal(expectedDigest, actualDigest)
// 		suite.Equal(expectedVersion, actualVersion)
// 		suite.Equal(expectedPrevHash, actualPrevHash)
// 		suite.Equal(expectedMerkleRoot, actualMerkleRoot)
// 		suite.Equal(expectedTimestamp, actualTimestamp)
// 		suite.Equal(expectedTarget, actualTarget)
// 		// suite.Equal(actualTarget, actualTarget)
// 		suite.Equal(expectedNonce, actualNonce)
// 	}
// }

func (suite *UtilsSuite) TestValidateHeaderWork() {
	var target sdk.Uint
	fixture := suite.Fixtures["validateHeaderWork"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(bool)
		inputs := testCase.Input.(map[string]interface{})
		digest := inputs["digest"].(Hash256Digest)
		targetInt, okInt := inputs["target"].(int)
		if okInt {
			target = sdk.NewUint(uint64(targetInt))
		} else {
			target = BytesToBigUint(inputs["target"].([]byte))
		}
		actual := ValidateHeaderWork(digest, target)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestValidateHeaderPrevHash() {
	fixture := suite.Fixtures["validateHeaderPrevHash"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(bool)
		inputs := testCase.Input.(map[string]interface{})
		header := inputs["header"].(RawHeader)
		prevHash := inputs["prevHash"].(Hash256Digest)
		actual := ValidateHeaderPrevHash(header, prevHash)
		suite.Equal(expected, actual)
	}
}

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
