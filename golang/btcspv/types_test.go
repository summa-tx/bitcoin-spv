package btcspv

import (
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/suite"
)

type SerializationCases struct {
	Valid           []string              `json:"valid"`
	BadHeaders      []InvalidHeadersCases `json:"badHeaders"`
	BadSPVProofs    []InvalidProofsCases  `json:"badSPVProofs"`
	BadHexBytes     string                `json:"errBadHexBytes"`
	BadHexHash256   string                `json:"errBadHexHash256"`
	BadLenHash256   string                `json:"errBadLenHash256"`
	BadHexRawHeader string                `json:"errBadHexRawHeader"`
	BadLenRawHeader string                `json:"errBadLenRawHeader"`
}

type InvalidHeadersCases struct {
	Error  string        `json:"error"`
	Header BitcoinHeader `json:"header"`
}

type InvalidProofsCases struct {
	Error string   `json:"error"`
	Proof SPVProof `json:"proof"`
}

type TypesSuite struct {
	suite.Suite
	Fixtures       SerializationCases
	ValidProof     SPVProof
	InvalidHeaders []InvalidHeadersCases
	InvalidProofs  []InvalidProofsCases
}

func TestTypes(t *testing.T) {
	jsonFile, err := os.Open("../../testProofs.json")
	defer jsonFile.Close()
	logIfErr(err)

	byteValue, err := ioutil.ReadAll(jsonFile)
	logIfErr(err)

	var fixtures SerializationCases
	json.Unmarshal([]byte(byteValue), &fixtures)

	typesSuite := new(TypesSuite)
	typesSuite.Fixtures = fixtures

	spvProof := new(SPVProof)
	err = json.Unmarshal([]byte(typesSuite.Fixtures.Valid[0]), &spvProof)
	logIfErr(err)
	typesSuite.ValidProof = *spvProof

	suite.Run(t, typesSuite)
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
	invalidHeaders := suite.InvalidHeaders

	suite.Nil(err)
	suite.Equal(validHeader, true)

	for i := 0; i < len(invalidHeaders); i++ {
		headerCase := invalidHeaders[i]

		valid, err := headerCase.Header.Validate()
		expected := strings.Replace(invalidHeaders[i].Error, "\u00a0", " ", -1)

		suite.Equal(false, valid)
		suite.EqualError(err, expected)
	}
}

func (suite *TypesSuite) TestValidateSPVProof() {
	validProof, err := suite.ValidProof.Validate()
	invalidProofs := suite.InvalidProofs

	suite.Nil(err)
	suite.Equal(validProof, true)

	for i := 0; i < len(invalidProofs); i++ {
		proofCase := invalidProofs[i]

		valid, validateErr := proofCase.Proof.Validate()
		expected := strings.Replace(invalidProofs[i].Error, "\u00a0", " ", -1)

		suite.Equal(false, valid)
		suite.EqualError(validateErr, expected)
	}
}
