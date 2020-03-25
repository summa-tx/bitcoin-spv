package btcspv

func (suite *UtilsSuite) TestStrip0xPrefix() {
	suite.Equal("0", strip0xPrefix("0"))
	suite.Equal("", strip0xPrefix(""))
	suite.Equal("333", strip0xPrefix("0x333"))
}

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

	suite.Equal([]byte{0xab, 0xcd}, DecodeIfHex("abcd"))
	suite.Equal([]byte("qqqq"), DecodeIfHex("qqqq"))
	suite.Equal([]byte("foo"), DecodeIfHex("foo"))
	suite.Equal([]byte("d"), DecodeIfHex("d"))
	suite.Equal([]byte(""), DecodeIfHex(""))
}

func (suite *UtilsSuite) TestSafeSlice() {
	// badSliceErr := "Tried to slice past end of array"
	var expected []byte
	var actual []byte
	var err error

	expected = []byte{0, 1}
	actual, err = SafeSlice([]byte{0, 1, 2, 3}, 0, 2)
	suite.Nil(err)
	suite.Equal(expected, actual)

	expected = []byte{0, 1, 2, 3}
	actual, err = SafeSlice([]byte{0, 1, 2, 3}, 0, 4)
	suite.Nil(err)
	suite.Equal(expected, actual)

	actual, err = SafeSlice([]byte{0, 1, 2, 3}, 0, 5)
	suite.Equal([]byte{}, actual)
	suite.EqualError(err, "Tried to slice past end of array")

	actual, err = SafeSlice([]byte{0, 1, 2, 3}, 4, 4)
	suite.Equal([]byte{}, actual)
	suite.EqualError(err, "Slice must not have 0 length")

	actual, err = SafeSlice([]byte{0, 1, 2, 3}, -1, 4)
	suite.Equal([]byte{}, actual)
	suite.EqualError(err, "Slice must not use negative indexes")
}

func (suite *UtilsSuite) TestEncodeP2SH() {
	fixture := suite.Fixtures["encodeP2SH"]

	for i := range fixture {
		testCase := fixture[i]

		input := testCase.Input.([]byte)
		expected := testCase.Output
		actual, err := EncodeP2SH(input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestEncodeP2PKH() {
	fixture := suite.Fixtures["encodeP2PKH"]

	for i := range fixture {
		testCase := fixture[i]

		input := testCase.Input.([]byte)
		expected := testCase.Output
		actual, err := EncodeP2PKH(input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestEncodeP2WSH() {
	fixture := suite.Fixtures["encodeP2WSH"]

	for i := range fixture {
		testCase := fixture[i]

		input := testCase.Input.(Hash256Digest)
		expected := testCase.Output
		actual, err := EncodeP2WSH(input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestEncodeP2WPKH() {
	fixture := suite.Fixtures["encodeP2WPKH"]

	for i := range fixture {
		testCase := fixture[i]

		input := testCase.Input.([]byte)
		expected := testCase.Output
		actual, err := EncodeP2WPKH(input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestEncodeSegwitErrors() {
	// All 0s
	input := make([]byte, 20)
	actual, err := EncodeP2PKH(input)
	suite.Equal("", actual)
	suite.EqualError(err, zeroBytesError)

	actual, err = EncodeP2SH(input)
	suite.Equal("", actual)
	suite.EqualError(err, zeroBytesError)

	actual, err = EncodeP2WPKH(input)
	suite.Equal("", actual)
	suite.EqualError(err, zeroBytesError)

	WSH, _ := NewHash256Digest(make([]byte, 32))
	actual, err = EncodeP2WSH(WSH)
	suite.Equal("", actual)
	suite.EqualError(err, zeroBytesError)

	// Wrong Length
	input = make([]byte, 1)
	actual, err = EncodeP2PKH(input)
	suite.Equal("", actual)
	suite.EqualError(err, "PKH must be 20 bytes, got 1 bytes")

	actual, err = EncodeP2SH(input)
	suite.Equal("", actual)
	suite.EqualError(err, "SH must be 20 bytes, got 1 bytes")

	actual, err = EncodeP2WPKH(input)
	suite.Equal("", actual)
	suite.EqualError(err, "WPKH must be 20 bytes, got 1 bytes")
}
