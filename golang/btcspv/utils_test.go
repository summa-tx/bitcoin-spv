package btcspv

func (suite *UtilsSuite) TestDecodeIfHex() {
	var expected []byte
	var actual []byte

	expected = []byte{0}
	actual = DecodeIfHex("0x00")
	suite.Equal(expected, actual)

	expected = []byte{0}
	actual = DecodeIfHex("00")
	suite.Equal(expected, actual)

	expected = []byte{0, 1, 2, 42, 100, 101, 102, 255}
	actual = DecodeIfHex("0x0001022a646566ff")
	suite.Equal(expected, actual)
}

func (suite *UtilsSuite) TestGetOutputType() {
	var expected string
	var actual string

	expected = "Output None"
	actual = GetOutputType(0)
	suite.Equal(expected, actual)

	expected = "WPKH"
	actual = GetOutputType(1)
	suite.Equal(expected, actual)

	expected = "WSH"
	actual = GetOutputType(2)
	suite.Equal(expected, actual)

	expected = "Op Return"
	actual = GetOutputType(3)
	suite.Equal(expected, actual)

	expected = "PKH"
	actual = GetOutputType(4)
	suite.Equal(expected, actual)

	expected = "SH"
	actual = GetOutputType(5)
	suite.Equal(expected, actual)

	expected = "Nonstandard"
	actual = GetOutputType(6)
	suite.Equal(expected, actual)
}

func (suite *UtilsSuite) TestGetInputType() {
	var expected string
	var actual string

	expected = "Input None"
	actual = GetInputType(0)
	suite.Equal(expected, actual)

	expected = "Legacy"
	actual = GetInputType(1)
	suite.Equal(expected, actual)

	expected = "Compatibility"
	actual = GetInputType(2)
	suite.Equal(expected, actual)

	expected = "Witness"
	actual = GetInputType(3)
	suite.Equal(expected, actual)
}

func (suite *UtilsSuite) TestEncodeP2SH() {
	fixture := suite.Fixtures["encodeP2SH"]

	for i := range fixture {
		testCase := fixture[i]

		input := testCase.Input.([]byte)
		expected := testCase.Output
		actual := DecodeIfHex(EncodeP2SH(input))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestEncodeP2PKH() {
	fixture := suite.Fixtures["encodeP2PKH"]

	for i := range fixture {
		testCase := fixture[i]

		input := testCase.Input.([]byte)
		expected := testCase.Output
		actual := DecodeIfHex(EncodeP2PKH(input))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestEncodeP2WSH() {
	fixture := suite.Fixtures["encodeP2WSH"]

	for i := range fixture {
		testCase := fixture[i]

		input := testCase.Input.([]byte)
		expected := testCase.Output
		addr, err := EncodeP2WSH(input)
		suite.Nil(err)

		actual := DecodeIfHex(addr)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestEncodeP2WPKH() {
	fixture := suite.Fixtures["encodeP2WPKH"]

	for i := range fixture {
		testCase := fixture[i]

		input := testCase.Input.([]byte)
		expected := testCase.Output
		addr, err := EncodeP2WPKH(input)
		suite.Nil(err)

		actual := DecodeIfHex(addr)
		suite.Equal(expected, actual)
	}
}
