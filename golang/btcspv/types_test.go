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
	invalidProofs := suite.Fixtures.InvalidProofs

	suite.Nil(err)
	suite.Equal(validProof, true)

	for i := 0; i < len(invalidProofs); i++ {
		proofCase := invalidProofs[i]

		valid, err := proofCase.Proof.Validate()

		suite.Equal(false, valid)
		suite.EqualError(err, proofCase.Error)
	}
}
