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

type Err struct {
	Error string `json:"Error"`
}

type TestProofCases struct {
	Valid             []string `json:"valid"`
	BadHeaders        []string `json:"badHeaders"`
	BadHeaderErrors   []string `json:"badHeaderErrors"`
	BadSPVProofs      []string `json:"badSPVProofs"`
	BadSPVProofErrors []string `json:"badSPVProofErrors"`
	BadHexBytes       string   `json:"errBadHexBytes"`
	BadHexHash256     string   `json:"errBadHexHash256"`
	BadLenHash256     string   `json:"errBadLenHash256"`
	BadHexRawHeader   string   `json:"errBadHexRawHeader"`
	BadLenRawHeader   string   `json:"errBadLenRawHeader"`
}

type TypesSuite struct {
	suite.Suite
	Fixtures          TestProofCases
	Proof             SPVProof
	BadHeaders        []BitcoinHeader
	BadHeaderErrors   []Err
	BadSPVProofs      []SPVProof
	BadSPVProofErrors []Err
}

func TestTypes(t *testing.T) {
	jsonFile, err := os.Open("../../testProofs.json")
	defer jsonFile.Close()
	logIfErr(err)

	byteValue, err := ioutil.ReadAll(jsonFile)
	logIfErr(err)

	var fixtures TestProofCases
	json.Unmarshal([]byte(byteValue), &fixtures)

	typesSuite := new(TypesSuite)
	typesSuite.Fixtures = fixtures

	spvProof := new(SPVProof)
	err = json.Unmarshal([]byte(typesSuite.Fixtures.Valid[0]), &spvProof)
	logIfErr(err)
	typesSuite.Proof = *spvProof

	for i := 0; i < len(typesSuite.Fixtures.BadHeaders); i++ {
		bitcoinHeader := new(BitcoinHeader)
		err = json.Unmarshal([]byte(typesSuite.Fixtures.BadHeaders[i]), &bitcoinHeader)
		logIfErr(err)
		appended := append(typesSuite.BadHeaders, *bitcoinHeader)
		typesSuite.BadHeaders = appended
	}

	for i := 0; i < len(typesSuite.Fixtures.BadHeaderErrors); i++ {
		headerErr := new(Err)
		err = json.Unmarshal([]byte(typesSuite.Fixtures.BadHeaderErrors[i]), &headerErr)
		logIfErr(err)
		appended := append(typesSuite.BadHeaderErrors, *headerErr)
		typesSuite.BadHeaderErrors = appended
	}

	for i := 0; i < len(typesSuite.Fixtures.BadSPVProofs); i++ {
		spvProof := new(SPVProof)
		err = json.Unmarshal([]byte(typesSuite.Fixtures.BadSPVProofs[i]), &spvProof)
		logIfErr(err)
		appended := append(typesSuite.BadSPVProofs, *spvProof)
		typesSuite.BadSPVProofs = appended
	}

	for i := 0; i < len(typesSuite.Fixtures.BadSPVProofErrors); i++ {
		spvProofErr := new(Err)
		err = json.Unmarshal([]byte(typesSuite.Fixtures.BadSPVProofErrors[i]), &spvProofErr)
		logIfErr(err)
		appended := append(typesSuite.BadSPVProofErrors, *spvProofErr)
		typesSuite.BadSPVProofErrors = appended
	}

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
	bitcoinHeader := suite.Proof.ConfirmingHeader
	BadHeaders := suite.BadHeaders
	BadHeaderErrors := suite.BadHeaderErrors

	validHeader, err := bitcoinHeader.Validate()
	suite.Nil(err)
	suite.Equal(validHeader, true)

	for i := 0; i < len(BadHeaders); i++ {
		header := BadHeaders[i]

		valid, err := header.Validate()
		expected := strings.Replace(BadHeaderErrors[i].Error, "\u00a0", " ", -1)

		suite.Equal(false, valid)
		suite.EqualError(err, expected)
	}
}

func (suite *TypesSuite) TestValidateSPVProof() {
	validProof, err := suite.Proof.Validate()
	BadSPVProofs := suite.BadSPVProofs
	BadSPVProofErrors := suite.BadSPVProofErrors

	suite.Nil(err)
	suite.Equal(validProof, true)

	for i := 0; i < len(BadSPVProofs); i++ {
		spvProof := BadSPVProofs[i]

		valid, validateErr := spvProof.Validate()
		expected := strings.Replace(BadSPVProofErrors[i].Error, "\u00a0", " ", -1)

		suite.Equal(false, valid)
		suite.EqualError(validateErr, expected)
	}
}
