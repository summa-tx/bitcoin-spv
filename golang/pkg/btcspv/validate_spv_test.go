package btcspv

import (

	// "reflect"
	// "github.com/stretchr/testify/suite"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

func (suite *UtilsSuite) TestProve() {
	fixture := suite.Fixtures["prove"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(bool)
		inputs := testCase.Input.(map[string]interface{})
		txIDLE := inputs["txIdLE"].([]byte)
		merkleRootLE := inputs["merkleRootLE"].([]byte)
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
		expected := testCase.Output.([]byte)
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
		expectedTxID := expected["txId"].([]byte)
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
		expectedPayload := expected["payload"].([]byte)
		input := testCase.Input.([]byte)
		actualValue, actualOutputType, actualPayload := ParseOutput(input)
		suite.Equal(expectedValue, actualValue)
		suite.Equal(expectedPayload, actualPayload)
		suite.Equal(expectedOutputType, actualOutputType)
	}
}

func (suite *UtilsSuite) TestParseHeader() {
	fixture := suite.Fixtures["parseHeader"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(map[string]interface{})
		expectedDigest := expected["digest"].([]byte)
		expectedVersion := uint(expected["version"].(int))
		expectedPrevHash := expected["prevHash"].([]byte)
		expectedMerkleRoot := expected["merkleRoot"].([]byte)
		expectedTimestamp := uint(expected["timestamp"].(int))
		expectedTarget := BytesToBigUint(expected["target"].([]byte))
		expectedNonce := uint(expected["nonce"].(int))
		input := testCase.Input.([]byte)
		actualDigest, actualVersion, actualPrevHash, actualMerkleRoot, actualTimestamp, actualTarget, actualNonce, err := ParseHeader(input)
		suite.Nil(err)
		suite.Equal(expectedDigest, actualDigest)
		suite.Equal(expectedVersion, actualVersion)
		suite.Equal(expectedPrevHash, actualPrevHash)
		suite.Equal(expectedMerkleRoot, actualMerkleRoot)
		suite.Equal(expectedTimestamp, actualTimestamp)
		suite.Equal(expectedTarget, actualTarget)
		suite.Equal(expectedNonce, actualNonce)
	}

	fixture = suite.Fixtures["parseHeaderError"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.ErrorMessage.(string)
		input := testCase.Input.([]byte)
		digest, version, prevHash, merkleRoot, timestamp, target, nonce, err := ParseHeader(input)
		suite.Nil(digest)
		suite.Equal(version, uint(0))
		suite.Nil(prevHash)
		suite.Nil(merkleRoot)
		suite.Equal(timestamp, uint(0))
		suite.Equal(target, sdk.NewUint(0))
		suite.Equal(nonce, uint(0))
		suite.EqualError(err, expected)
	}
}

func (suite *UtilsSuite) TestValidateHeaderWork() {
	var target sdk.Uint
	fixture := suite.Fixtures["validateHeaderWork"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(bool)
		inputs := testCase.Input.(map[string]interface{})
		digest := inputs["digest"].([]byte)
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
		header := inputs["header"].([]byte)
		prevHash := inputs["prevHash"].([]byte)
		actual := ValidateHeaderPrevHash(header, prevHash)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestValidateHeaderChain() {
	fixture := suite.Fixtures["validateHeaderChain"]

	for i := range fixture {
		testCase := fixture[i]
		expected := sdk.NewUint(uint64(testCase.Output.(int)))
		actual, err := ValidateHeaderChain(testCase.Input.([]byte))
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixture = suite.Fixtures["validateHeaderChainError"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.ErrorMessage.(string)
		actual, err := ValidateHeaderChain(testCase.Input.([]byte))
		suite.EqualError(err, expected)
		suite.Equal(actual, sdk.NewUint(0))
	}
}
