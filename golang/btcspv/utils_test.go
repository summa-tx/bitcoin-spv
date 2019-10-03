package btcspv

// import (
// 	sdk "github.com/cosmos/cosmos-sdk/types"
// )

// func (suite *UtilsSuite) TestProve() {
// 	fixture := suite.Fixtures["prove"]

// 	for i := range fixture {
// 		testCase := fixture[i]
// 		expected := testCase.Output.(bool)
// 		inputs := testCase.Input.(map[string]interface{})
// 		txIDLE := inputs["txIdLE"].([]byte)
// 		merkleRootLE := inputs["merkleRootLE"].([]byte)
// 		proof := inputs["proof"].([]byte)
// 		index := uint(inputs["index"].(int))
// 		actual := Prove(txIDLE, merkleRootLE, proof, index)
// 		suite.Equal(expected, actual)
// 	}
// }
