package btcspv

import (
	"encoding/hex"
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
	// fmt.Println(spvProof.ConfirmingHeader)
	suite.Equal(384, len(spvProof.IntermediateNodes))

	_, err := json.Marshal(spvProof)
	suite.Nil(err)
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
	suite.EqualError(err, "encoding/hex: invalid byte: U+0051 'Q'")
}

func (suite *TypesSuite) TestUnmarshalBadLenHash256() {
	badLenHash256 := suite.Fixtures.BadLenHash256
	s := new(SPVProof)
	err := json.Unmarshal([]byte(badLenHash256), &s)
	suite.EqualError(err, "Expected 32 bytes, got 31 bytes")
}
