package btcspv

import (
	// "bytes"
	// "encoding/hex"
	// "encoding/json"
	// "io/ioutil"
	// "log"
	// "os"
	// "testing"

	// "github.com/stretchr/testify/suite"

	// sdk "github.com/cosmos/cosmos-sdk/types"
)

func (suite *UtilsSuite) TestProve() {
	fixture := suite.Fixtures["prove"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		inputs := testCase.Input.(map[string]interface{})
		txIdLE := inputs["txIdLE"].([]byte)
		merkleRootLE := inputs["merkleRootLE"].([]byte)
		proof := inputs["proof"].([]byte)
		index := uint(inputs["index"].(int))
		actual := Prove(txIdLE, merkleRootLE, proof, index)
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
		actual := CalculateTxId(version, vin, vout, locktime)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestParseInput() {
	fixture := suite.Fixtures["parseInput"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(map[string]interface{})
		expectedSequence := uint(expected["sequence"].(int))
		expectedTxId := expected["txId"].([]byte)
		expectedIndex := uint(expected["index"].(int))
		expectedType := INPUT_TYPE(expected["type"].(string))
		input := testCase.Input.([]byte)
		actualSequence, actualTxId, actualIndex, actualType := ParseInput(input)
		suite.Equal(expectedSequence, actualSequence)
		suite.Equal(expectedTxId, actualTxId)
		suite.Equal(expectedIndex, actualIndex)
		suite.Equal(expectedType, actualType)
	}
}

func (suite *UtilsSuite) TestParseOutput() {
	suite.T().Skip()
	fixture := suite.Fixtures["parseOutput"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(map[string]interface{})
		expectedValue := uint(expected["value"].(int))
		// expectedType := expected["type"].(string)
		expectedPayload := expected["payload"].([]byte)
		input := testCase.Input.([]byte)
		actualValue, actualOutputType, actualPayload := ParseOutput(input)
		suite.Equal(expectedValue, actualValue)
		suite.Equal(expectedPayload, actualPayload)
		// // suite.Equal(expectedType, actualType)
	}
}

func (suite *UtilsSuite) TestParseHeader() {
	suite.T().Skip()
	fixture := suite.Fixtures["parseHeader"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(map[string]interface{})
		// expected := expected
		// expected := expected
		// expected := expected
		// expected := expected
		// expected := expected
		// expected := expected
		// expected := expected
		// actual := ParseHeader()
	}
}

// func (suite *UtilsSuite) TestValidateHeaderWork() {
// 	suite.T().Skip()
// 	fixture := suite.Fixtures["validateHeaderWork"]

// for i := range fixture {
// 	testCase := fixture[i]
// 	actual := ValidateHeaderWork()
// 	}
// }

// func (suite *UtilsSuite) TestValidateHeaderPrevHash() {
// 	suite.T().Skip()
// 	fixture := suite.Fixtures["validateHeaderPrevHash"]

// for i := range fixture {
// 	testCase := fixture[i]
// 	actual := ValidateHeaderPrevHash()
// 	}
// }

// func (suite *UtilsSuite) TestValidateHeaderChain() {
// 	suite.T().Skip()
// 	fixture := suite.Fixtures["validateHeaderChain"]

// for i := range fixture {
// 	testCase := fixture[i]
// 	actual := ValidateHeaderChain()
// 	}
// }
