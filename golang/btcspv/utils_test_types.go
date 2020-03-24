package btcspv

type EncodeP2SHTC struct {
	Input  HexBytes `json:"input"`
	Output string   `json:"output"`
}

type EncodeP2PKHTC struct {
	Input  HexBytes `json:"input"`
	Output string   `json:"output"`
}

type EncodeP2WSHTC struct {
	Input  Hash256Digest `json:"input"`
	Output string        `json:"output"`
}

type EncodeP2WPKHTC struct {
	Input  HexBytes `json:"input"`
	Output string   `json:"output"`
}

// func (suite *UtilsSuite) TestEncodeP2WPKH() {
// 	fixture := suite.Fixtures["encodeP2WPKH"]

// 	for i := range fixture {
// 		testCase := fixture[i]

// 		input := testCase.Input.([]byte)
// 		expected := testCase.Output
// 		actual, err := EncodeP2WPKH(input)
// 		suite.Nil(err)
// 		suite.Equal(expected, actual)
// 	}
// }
