package btcspv

import sdk "github.com/cosmos/cosmos-sdk/types"

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
	fixture := suite.Fixtures.Prove

	for i := range fixture {
		testCase := fixture[i]

		txIDLE := testCase.Input.TxIdLE
		merkleRootLE := testCase.Input.MerkleRootLE
		proof := testCase.Input.Proof
		index := testCase.Input.Index

		expected := testCase.Output
		actual := Prove(txIDLE, merkleRootLE, proof, index)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestCalculateTxId() {
	fixture := suite.Fixtures.CalculateTxId

	for i := range fixture {
		testCase := fixture[i]

		version := testCase.Input.Version
		vin := testCase.Input.Vin
		vout := testCase.Input.Vout
		locktime := testCase.Input.Locktime

		expected := testCase.Output
		actual := CalculateTxID(version, vin, vout, locktime)
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
		actual := ValidateHeaderWork(digest, target)
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
		actual := ValidateHeaderPrevHash(header, prevHash)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestValidateHeaderChain() {
	fixture := suite.Fixtures.ValidateHeaderChain

	for i := range fixture {
		testCase := fixture[i]
		expected := sdk.NewUint(testCase.Output)
		actual, err := ValidateHeaderChain(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ValidateHeaderChainError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := ValidateHeaderChain(testCase.Input)
		suite.Equal(actual, sdk.NewUint(0))
		suite.EqualError(err, testCase.ErrorMessage)
	}
}
