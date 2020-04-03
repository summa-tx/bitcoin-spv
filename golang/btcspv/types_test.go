package btcspv_test

import (
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"os"
	"testing"

	"github.com/stretchr/testify/suite"
	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

type SerializedCases struct {
	ValidProof      []string              `json:"valid"`
	ValidHeader     []string              `json:"validHeader"`
	InvalidHeaders  []InvalidHeadersCases `json:"badHeaders"`
	InvalidProofs   []InvalidProofsCases  `json:"badSPVProofs"`
	BadHexBytes     string                `json:"errBadHexBytes"`
	BadHexHash256   string                `json:"errBadHexHash256"`
	BadLenHash256   string                `json:"errBadLenHash256"`
	BadHexHash160   string                `json:"errBadHexHash160"`
	BadLenHash160   string                `json:"errBadLenHash160"`
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
	Fixtures     SerializedCases
	ValidProofs  []SPVProof
	ValidHeaders []BitcoinHeader
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

	var validProofs []SPVProof
	for i := range fixtures.ValidProof {
		spvProof := new(SPVProof)
		err = json.Unmarshal([]byte(fixtures.ValidProof[i]), &spvProof)
		logIfErr(err)
		validProofs = append(validProofs, *spvProof)
	}

	var validHeaders []BitcoinHeader
	for i := range fixtures.ValidHeader {
		bitcoinHeader := new(BitcoinHeader)
		err := json.Unmarshal([]byte(fixtures.ValidHeader[i]), &bitcoinHeader)
		logIfErr(err)
		validHeaders = append(validHeaders, *bitcoinHeader)
	}

	typesSuite := TypesSuite{
		*new(suite.Suite),
		*fixtures,
		validProofs,
		validHeaders,
	}

	suite.Run(t, &typesSuite)
}

func (suite *TypesSuite) TestUnmarshalSPVProof() {
	valid := suite.Fixtures.ValidProof

	for i := range valid {
		s := new(SPVProof)
		testCase := valid[i]
		err := json.Unmarshal([]byte(testCase), &s)
		suite.Nil(err)
	}
}

func (suite *TypesSuite) TestMarshalSPVProof() {
	valid := suite.Fixtures.ValidProof
	spvProof := new(SPVProof)
	json.Unmarshal([]byte(valid[0]), &spvProof)

	// Extra assertions here will catch random broken stuff
	suite.Equal(
		"5176f6b03b8bc29f4deafbb7384b673debde6ae712deab93f3b0c91fdcd6d674",
		hex.EncodeToString(spvProof.TxID[:]))
	suite.Equal(uint32(26), spvProof.Index)
	// TODO: assert header equalities
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

// TODO: Write these tests
func (suite *TypesSuite) TestUnmarshalBadHexHash160() {
	badHexHash160 := suite.Fixtures.BadHexHash160
	h := new(Hash160Digest)
	err := json.Unmarshal([]byte(badHexHash160), &h)
	suite.EqualError(err, "encoding/hex: invalid byte: U+0072 'r'")
}

func (suite *TypesSuite) TestUnmarshalBadLenHash160() {
	badLenHash160 := suite.Fixtures.BadLenHash160
	h := new(Hash160Digest)
	err := json.Unmarshal([]byte(badLenHash160), &h)
	suite.EqualError(err, "Expected 20 bytes, got 19 bytes")
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
	validHeaders := suite.ValidHeaders
	invalidHeaders := suite.Fixtures.InvalidHeaders

	for i := range validHeaders {
		validHeader, err := validHeaders[i].Validate()
		suite.Nil(err)
		suite.Equal(validHeader, true)
	}

	for i := range invalidHeaders {
		headerCase := invalidHeaders[i]

		valid, err := headerCase.Header.Validate()

		suite.Equal(false, valid)
		suite.EqualError(err, headerCase.Error)
	}
}

func (suite *TypesSuite) TestValidateSPVProof() {
	validProofs := suite.ValidProofs
	for i := range validProofs {
		validProof, err := validProofs[i].Validate()
		suite.Nil(err)
		suite.Equal(validProof, true)
	}

	invalidHeader := suite.ValidProofs[0]
	invalidHeader.ConfirmingHeader.MerkleRoot = Hash256Digest{0xdd, 0xe2, 0x5e, 0x5d, 0x1c, 0xb2, 0x9a, 0xc6, 0xc0, 0x8b, 0xe7, 0x37, 0x83, 0x73, 0xc6, 0x46, 0xad, 0x18, 0xfc, 0x90, 0xb1, 0x44, 0x35, 0xa9, 0x2a, 0xc8, 0xab, 0x42, 0x28, 0xc9, 0x1a, 0xb6}
	invalidProof, validationErr := invalidHeader.Validate()
	suite.Equal(invalidProof, false)
	suite.EqualError(validationErr, "MerkleRoot is not the correct merkle root of the header")

	invalidProofs := suite.Fixtures.InvalidProofs

	for i := range invalidProofs {
		proofCase := invalidProofs[i]

		valid, err := proofCase.Proof.Validate()

		suite.Equal(false, valid)
		suite.EqualError(err, proofCase.Error)
	}
}

func (suite *TypesSuite) TestNewHash160Digest() {
	input := btcspv.DecodeIfHex("0x1b60c31dba9403c74d81af255f0c300bfed5faa3")
	output := Hash160Digest{0x1b, 0x60, 0xc3, 0x1d, 0xba, 0x94, 0x3, 0xc7, 0x4d, 0x81, 0xaf, 0x25, 0x5f, 0xc, 0x30, 0xb, 0xfe, 0xd5, 0xfa, 0xa3}

	digest, err := btcspv.NewHash160Digest(input)
	suite.Nil(err)
	suite.Equal(digest, output)

	badLengthInput := input[0:18:18]
	_, err = btcspv.NewHash160Digest(badLengthInput)
	suite.EqualError(err, "Expected 20 bytes in a Hash160Digest, got 18")
}

func (suite *TypesSuite) TestMarshalHash160Digest() {
	hash := Hash160Digest{1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1}

	j, err := json.Marshal(hash)
	suite.Nil(err)

	actual := new(Hash160Digest)
	json.Unmarshal(j, &actual)
	suite.Equal(hash[:], actual[:])
}

func (suite *TypesSuite) TestNewHash256Digest() {
	input := btcspv.DecodeIfHex("0x1406e05881e299367766d313e26c05564ec91bf721d31726bd6e46e60689539a")
	output := Hash256Digest{0x14, 0x06, 0xe0, 0x58, 0x81, 0xe2, 0x99, 0x36, 0x77, 0x66, 0xd3, 0x13, 0xe2, 0x6c, 0x05, 0x56, 0x4e, 0xc9, 0x1b, 0xf7, 0x21, 0xd3, 0x17, 0x26, 0xbd, 0x6e, 0x46, 0xe6, 0x06, 0x89, 0x53, 0x9a}

	digest, err := btcspv.NewHash256Digest(input)
	suite.Nil(err)
	suite.Equal(digest, output)

	input = btcspv.DecodeIfHex("0x4f8b42c22dd3729b519ba6f68d2da7cc5b2d606d05daed5ad5128cc03e6c6358")
	output = Hash256Digest{0x4f, 0x8b, 0x42, 0xc2, 0x2d, 0xd3, 0x72, 0x9b, 0x51, 0x9b, 0xa6, 0xf6, 0x8d, 0x2d, 0xa7, 0xcc, 0x5b, 0x2d, 0x60, 0x6d, 0x05, 0xda, 0xed, 0x5a, 0xd5, 0x12, 0x8c, 0xc0, 0x3e, 0x6c, 0x63, 0x58}

	digest, err = btcspv.NewHash256Digest(input)
	suite.Nil(err)
	suite.Equal(digest, output)

	badLengthInput := input[0:30:30]
	_, err = btcspv.NewHash256Digest(badLengthInput)
	suite.EqualError(err, "Expected 32 bytes in a Hash256Digest, got 30")
}

func (suite *TypesSuite) TestNewRawHeader() {
	input := btcspv.DecodeIfHex("0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab3750000000000ffffffffaa15ec17524f1f7bd47ab7caa4c6652cb95eec4c58902984f9b4bcfee444567d0000000000ffff")
	output := RawHeader{0x7b, 0xb2, 0xb8, 0xf3, 0x2b, 0x9e, 0xbf, 0x13, 0xaf, 0x2b, 0x0a, 0x2f, 0x9d, 0xc0, 0x37, 0x97, 0xc7, 0xb7, 0x7c, 0xcd, 0xdc, 0xac, 0x75, 0xd1, 0x21, 0x63, 0x89, 0xab, 0xfa, 0x7a, 0xb3, 0x75, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0xaa, 0x15, 0xec, 0x17, 0x52, 0x4f, 0x1f, 0x7b, 0xd4, 0x7a, 0xb7, 0xca, 0xa4, 0xc6, 0x65, 0x2c, 0xb9, 0x5e, 0xec, 0x4c, 0x58, 0x90, 0x29, 0x84, 0xf9, 0xb4, 0xbc, 0xfe, 0xe4, 0x44, 0x56, 0x7d, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff}

	header, err := btcspv.NewRawHeader(input)
	suite.Nil(err)
	suite.Equal(header, output)

	badLengthInput := input[0:70:70]
	_, err = btcspv.NewRawHeader(badLengthInput)
	suite.EqualError(err, "Expected 80 bytes in a RawHeader got 70")
}

func (suite *TypesSuite) TestHeaderFromRaw() {
	validHeaders := suite.ValidHeaders
	for i := range validHeaders {
		header := validHeaders[i]

		rawHeader := btcspv.HeaderFromRaw(header.Raw, header.Height)
		suite.Equal(rawHeader, header)
	}
}

func (suite *TypesSuite) TestHeaderFromHex() {
	validHeaders := suite.ValidHeaders
	for i := range validHeaders {
		header := validHeaders[i]
		rawHex := hex.EncodeToString(header.Raw[:])
		rawHeader, err := btcspv.HeaderFromHex(rawHex, header.Height)

		suite.Nil(err)
		suite.Equal(header, rawHeader)
	}

	testHeader := hex.EncodeToString(suite.ValidHeaders[0].Raw[:])
	testHeight := suite.ValidHeaders[0].Height
	badLengthInput := testHeader[0:140]
	_, err := btcspv.HeaderFromHex(badLengthInput, testHeight)
	suite.EqualError(err, "Expected 80 bytes in a Hash256 digest, got 70")

	nonHex := "zzzz"
	_, err = btcspv.HeaderFromHex(nonHex, testHeight)
	suite.EqualError(err, "encoding/hex: invalid byte: U+007A 'z'")
}
