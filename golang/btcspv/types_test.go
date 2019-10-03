package btcspv

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"testing"

	"github.com/stretchr/testify/suite"
)

type TestProofCases struct {
	Valid         []string `json:"valid"`
	BadHexBytes   string   `json:"errBadHexBytes"`
	BadHexHash256 string   `json:"errBadHexHash256"`
	BadLenHash256 string   `json:"errBadLenHash256"`
}

type TypesSuite struct {
	suite.Suite
	Fixtures TestProofCases
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

	suite.Run(t, typesSuite)
}

func (suite *TypesSuite) TestUnmarshallSPVProof() {
	valid := suite.Fixtures.Valid

	for i := range valid {
		s := new(SPVProof)
		testCase := valid[i]
		err := json.Unmarshal([]byte(testCase), &s)
		suite.Nil(err)
	}
}

func (suite *TypesSuite) TestUnmarshallBadHexBytes() {
	badHexBytes := suite.Fixtures.BadHexBytes
	s := new(SPVProof)
	err := json.Unmarshal([]byte(badHexBytes), &s)
	suite.EqualError(err, "encoding/hex: invalid byte: U+0051 'Q'")
}

func (suite *TypesSuite) TestUnmarshallBadHexHash256() {
	badHexHash256 := suite.Fixtures.BadHexHash256
	s := new(SPVProof)
	err := json.Unmarshal([]byte(badHexHash256), &s)
	suite.EqualError(err, "encoding/hex: invalid byte: U+0051 'Q'")
}

func (suite *TypesSuite) TestUnmarshallBadLenHash256() {
	badLenHash256 := suite.Fixtures.BadLenHash256
	s := new(SPVProof)
	err := json.Unmarshal([]byte(badLenHash256), &s)
	suite.EqualError(err, "Expected 32 bytes, got 31 bytes")
}
