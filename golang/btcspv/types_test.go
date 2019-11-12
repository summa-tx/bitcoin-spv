package btcspv

import (
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"os"
	"testing"

	"github.com/stretchr/testify/suite"
)

type SerializedCases struct {
	Valid           []string              `json:"valid"`
	InvalidHeaders  []InvalidHeadersCases `json:"badHeaders"`
	InvalidProofs   []InvalidProofsCases  `json:"badSPVProofs"`
	BadHexBytes     string                `json:"errBadHexBytes"`
	BadHexHash256   string                `json:"errBadHexHash256"`
	BadLenHash256   string                `json:"errBadLenHash256"`
	BadHexRawHeader string                `json:"errBadHexRawHeader"`
	BadLenRawHeader string                `json:"errBadLenRawHeader"`
}

type InvalidHeadersCases struct {
	Header BitcoinHeader `json:"header"`
	Error  string        `json:"e"`
}

type InvalidProofsCases struct {
	Proof SPVProof `json:"proof"`
	Error string   `json:"e"`
}

type TypesSuite struct {
	suite.Suite
	Fixtures   SerializedCases
	ValidProof SPVProof
}

func TestTypes(t *testing.T) {
	jsonFile, err := os.Open("../../testProofs.json")
	defer jsonFile.Close()
	logIfErr(err)

	byteValue, err := ioutil.ReadAll(jsonFile)
	logIfErr(err)

	fixtures := new(SerializedCases)
	err = json.Unmarshal([]byte(byteValue), &fixtures)
	logIfErr(err)

	spvProof := new(SPVProof)
	err = json.Unmarshal([]byte(fixtures.Valid[0]), &spvProof)
	logIfErr(err)

	typesSuite := TypesSuite{
		*new(suite.Suite),
		*fixtures,
		*spvProof,
	}

	suite.Run(t, &typesSuite)
}

func (suite *TypesSuite) TestUnmarshalSPVProof() {
	valid := suite.Fixtures.Valid

	for i := range valid {
		s := new(SPVProof)
		testCase := valid[i]
		err := json.Unmarshal([]byte(testCase), &s)
		suite.Nil(err)
	}
}

func (suite *TypesSuite) TestMarshalSPVProof() {
	valid := suite.Fixtures.Valid
	spvProof := new(SPVProof)
	json.Unmarshal([]byte(valid[0]), &spvProof)

	// Extra assertions here will catch random broken stuff
	suite.Equal(
		"74d6d6dc1fc9b0f393abde12e76adeeb3d674b38b7fbea4d9fc28b3bb0f67651",
		hex.EncodeToString(spvProof.TxID[:]))
	suite.Equal(
		"5176f6b03b8bc29f4deafbb7384b673debde6ae712deab93f3b0c91fdcd6d674",
		hex.EncodeToString(spvProof.TxIDLE[:]))
	suite.Equal(uint32(26), spvProof.Index)
	// // TODO: assert header equalities
	suite.Equal(384, len(spvProof.IntermediateNodes))

	j, err := json.Marshal(spvProof)
	suite.Nil(err)

	actual := new(SPVProof)
	json.Unmarshal(j, &actual)
	suite.Equal(spvProof, actual)
}

func (suite *TypesSuite) TestUnmarshalBadHexBytes() {
	badHexBytes := suite.Fixtures.BadHexBytes
	s := new(SPVProof)
	err := json.Unmarshal([]byte(badHexBytes), &s)
	suite.EqualError(err, "encoding/hex: invalid byte: U+0051 'Q'")
}

func (suite *TypesSuite) TestUnmarshalBadHexHash256() {
	badHexHash256 := suite.Fixtures.BadHexHash256
	s := new(SPVProof)
	err := json.Unmarshal([]byte(badHexHash256), &s)
	suite.EqualError(err, "encoding/hex: invalid byte: U+0052 'R'")
}

func (suite *TypesSuite) TestUnmarshalBadLenHash256() {
	badLenHash256 := suite.Fixtures.BadLenHash256
	s := new(SPVProof)
	err := json.Unmarshal([]byte(badLenHash256), &s)
	suite.EqualError(err, "Expected 32 bytes, got 31 bytes")
}

func (suite *TypesSuite) TestUnmarshalBadHexRawHeader() {
	badHexRawHeader := suite.Fixtures.BadHexRawHeader
	s := new(SPVProof)
	err := json.Unmarshal([]byte(badHexRawHeader), &s)
	suite.EqualError(err, "encoding/hex: invalid byte: U+0053 'S'")
}

func (suite *TypesSuite) TestUnmarshalBadLenRawHeader() {
	badLenRawHeader := suite.Fixtures.BadLenRawHeader
	s := new(SPVProof)
	err := json.Unmarshal([]byte(badLenRawHeader), &s)
	suite.EqualError(err, "Expected 80 bytes, got 79 bytes")
}

func (suite *TypesSuite) TestValidateBitcoinHeader() {
	validHeader, err := suite.ValidProof.ConfirmingHeader.Validate()
	invalidHeaders := suite.Fixtures.InvalidHeaders

	suite.Nil(err)
	suite.Equal(validHeader, true)

	for i := 0; i < len(invalidHeaders); i++ {
		headerCase := invalidHeaders[i]

		valid, err := headerCase.Header.Validate()

		suite.Equal(false, valid)
		suite.EqualError(err, headerCase.Error)
	}
}

func (suite *TypesSuite) TestValidateSPVProof() {
	validProof, err := suite.ValidProof.Validate()
	suite.Nil(err)
	suite.Equal(validProof, true)

	invalidHeader := suite.ValidProof
	invalidHeader.ConfirmingHeader.MerkleRoot = Hash256Digest{0xdd, 0xe2, 0x5e, 0x5d, 0x1c, 0xb2, 0x9a, 0xc6, 0xc0, 0x8b, 0xe7, 0x37, 0x83, 0x73, 0xc6, 0x46, 0xad, 0x18, 0xfc, 0x90, 0xb1, 0x44, 0x35, 0xa9, 0x2a, 0xc8, 0xab, 0x42, 0x28, 0xc9, 0x1a, 0xb6}
	invalidProof, validationErr := invalidHeader.Validate()
	suite.Equal(invalidProof, false)
	suite.EqualError(validationErr, "MerkleRootLE is not the LE version of MerkleRoot")

	invalidProofs := suite.Fixtures.InvalidProofs

	for i := 0; i < len(invalidProofs); i++ {
		proofCase := invalidProofs[i]

		valid, err := proofCase.Proof.Validate()

		suite.Equal(false, valid)
		suite.EqualError(err, proofCase.Error)
	}
}

func (suite *TypesSuite) TestNewHash160Digest() {
	input := DecodeIfHex("0x1b60c31dba9403c74d81af255f0c300bfed5faa3")
	output := Hash160Digest{0x1b, 0x60, 0xc3, 0x1d, 0xba, 0x94, 0x3, 0xc7, 0x4d, 0x81, 0xaf, 0x25, 0x5f, 0xc, 0x30, 0xb, 0xfe, 0xd5, 0xfa, 0xa3}

	digest, err := NewHash160Digest(input)
	suite.Nil(err)
	suite.Equal(digest, output)

	badLengthInput := input[0:18]
	_, err = NewHash160Digest(badLengthInput)
	suite.EqualError(err, "Expected 20 bytes in a Hash160Digest, got 18")
}

func (suite *TypesSuite) TestNewHash256Digest() {
	input := DecodeIfHex("0x1406e05881e299367766d313e26c05564ec91bf721d31726bd6e46e60689539a")
	output := Hash256Digest{0x14, 0x06, 0xe0, 0x58, 0x81, 0xe2, 0x99, 0x36, 0x77, 0x66, 0xd3, 0x13, 0xe2, 0x6c, 0x05, 0x56, 0x4e, 0xc9, 0x1b, 0xf7, 0x21, 0xd3, 0x17, 0x26, 0xbd, 0x6e, 0x46, 0xe6, 0x06, 0x89, 0x53, 0x9a}

	digest, err := NewHash256Digest(input)
	suite.Nil(err)
	suite.Equal(digest, output)

	input = DecodeIfHex("0x4f8b42c22dd3729b519ba6f68d2da7cc5b2d606d05daed5ad5128cc03e6c6358")
	output = Hash256Digest{0x4f, 0x8b, 0x42, 0xc2, 0x2d, 0xd3, 0x72, 0x9b, 0x51, 0x9b, 0xa6, 0xf6, 0x8d, 0x2d, 0xa7, 0xcc, 0x5b, 0x2d, 0x60, 0x6d, 0x05, 0xda, 0xed, 0x5a, 0xd5, 0x12, 0x8c, 0xc0, 0x3e, 0x6c, 0x63, 0x58}

	digest, err = NewHash256Digest(input)
	suite.Nil(err)
	suite.Equal(digest, output)

	badLengthInput := input[0:30]
	_, err = NewHash256Digest(badLengthInput)
	suite.EqualError(err, "Expected 32 bytes in a Hash256Digest, got 30")
}

func (suite *TypesSuite) TestNewRawHeader() {
	input := DecodeIfHex("0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab3750000000000ffffffffaa15ec17524f1f7bd47ab7caa4c6652cb95eec4c58902984f9b4bcfee444567d0000000000ffff")
	output := RawHeader{0x7b, 0xb2, 0xb8, 0xf3, 0x2b, 0x9e, 0xbf, 0x13, 0xaf, 0x2b, 0x0a, 0x2f, 0x9d, 0xc0, 0x37, 0x97, 0xc7, 0xb7, 0x7c, 0xcd, 0xdc, 0xac, 0x75, 0xd1, 0x21, 0x63, 0x89, 0xab, 0xfa, 0x7a, 0xb3, 0x75, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0xaa, 0x15, 0xec, 0x17, 0x52, 0x4f, 0x1f, 0x7b, 0xd4, 0x7a, 0xb7, 0xca, 0xa4, 0xc6, 0x65, 0x2c, 0xb9, 0x5e, 0xec, 0x4c, 0x58, 0x90, 0x29, 0x84, 0xf9, 0xb4, 0xbc, 0xfe, 0xe4, 0x44, 0x56, 0x7d, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff}

	header, err := NewRawHeader(input)
	suite.Nil(err)
	suite.Equal(header, output)

	badLengthInput := input[0:70]
	_, err = NewRawHeader(badLengthInput)
	suite.EqualError(err, "Expected 80 bytes in a RawHeader got 70")
}

func (suite *TypesSuite) TestHeaderFromRaw() {
	validHeader := suite.ValidProof.ConfirmingHeader
	// PrevHash is stored in JSON as BE, we need to reverse it before comparing
	reversed, _ := NewHash256Digest(ReverseEndianness(validHeader.PrevHash[:]))
	validHeader.PrevHash = reversed
	var height uint32 = 592920

	rawHeader := HeaderFromRaw(validHeader.Raw, height)
	suite.Equal(rawHeader, validHeader)
}

func (suite *TypesSuite) TestHeaderFromHex() {
	hex := "0x0000c020c238b601308b7297346ab2ed59942d7d7ecea8d23a1001000000000000000000b61ac92842abc82aa93644b190fc18ad46c6738337e78bc0c69ab21c5d5ee2ddd6376d5d3e211a17d8706a84"
	var height uint32 = 592920

	validHeader := suite.ValidProof.ConfirmingHeader
	// PrevHash is stored in JSON as BE, we need to reverse it before comparing
	reversed, _ := NewHash256Digest(ReverseEndianness(validHeader.PrevHash[:]))
	validHeader.PrevHash = reversed

	rawHeader, err := HeaderFromHex(hex, height)
	suite.Nil(err)
	suite.Equal(rawHeader, validHeader)

	badLengthInput := hex[0:142]
	_, err = HeaderFromHex(badLengthInput, height)
	suite.EqualError(err, "Expected 80 bytes in a Hash256 digest, got 70")
}
