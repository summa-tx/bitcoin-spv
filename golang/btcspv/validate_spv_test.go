package btcspv_test

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

func (suite *UtilsSuite) TestProve() {
	fixture := suite.Fixtures.Prove

	for i := range fixture {
		testCase := fixture[i]

		txIDLE := testCase.Input.TxIdLE
		merkleRootLE := testCase.Input.MerkleRootLE
		proof := testCase.Input.Proof
		index := testCase.Input.Index

		expected := testCase.Output
		actual := btcspv.Prove(txIDLE, merkleRootLE, proof, index)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestCalculateTxID() {
	fixture := suite.Fixtures.CalculateTxID

	for i := range fixture {
		testCase := fixture[i]

		version := testCase.Input.Version
		vin := testCase.Input.Vin
		vout := testCase.Input.Vout
		locktime := testCase.Input.Locktime

		expected := testCase.Output
		actual := btcspv.CalculateTxID(version, vin, vout, locktime)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestValidateHeaderWork() {
	fixture := suite.Fixtures.ValidateHeaderWork

	for i := range fixture {
		testCase := fixture[i]

		digest := testCase.Input.Digest
		target := testCase.Input.Target

		expected := testCase.Output
		actual := btcspv.ValidateHeaderWork(digest, target)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestValidateHeaderPrevHash() {
	fixture := suite.Fixtures.ValidateHeaderPrevHash

	for i := range fixture {
		testCase := fixture[i]

		header := testCase.Input.Header
		prevHash := testCase.Input.PrevHash

		expected := testCase.Output
		actual := btcspv.ValidateHeaderPrevHash(header, prevHash)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestValidateHeaderChain() {
	fixture := suite.Fixtures.ValidateHeaderChain

	for i := range fixture {
		testCase := fixture[i]
		expected := sdk.NewUint(testCase.Output)
		actual, err := btcspv.ValidateHeaderChain(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ValidateHeaderChainError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := btcspv.ValidateHeaderChain(testCase.Input)
		suite.Equal(actual, sdk.NewUint(0))
		suite.EqualError(err, testCase.ErrorMessage)
	}
}
