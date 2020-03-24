package btcspv

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"math/big"
	"os"
	"testing"

	"github.com/stretchr/testify/suite"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

type TestCases struct {
	ExtractSequenceWitness       []ExtractSequenceWitnessTC     `json:"extractSequenceWitness"`
	ExtractSequenceLEWitness     []ExtractSequenceLEWitnessTC   `json:"extractSequenceLEWitness"`
	ExtractSequenceLegacy        []ExtractSequenceLegacyTC      `json:"extractSequenceLegacy"`
	ExtractSequenceLegacyError   []ExtractSequenceLegacyError   `json:"extractSequenceLegacyError"`
	ExtractSequenceLELegacy      []ExtractSequenceLELegacyTC    `json:"extractSequenceLELegacy"`
	ExtractSequenceLELegacyError []ExtractSequenceLELegacyError `json:"extractSequenceLELegacyError"`
	Hash160                      []Hash160TC                    `json:"hash160"`
	Hash256                      []Hash256TC                    `json:"hash256"`
	BytesToBigUint               []BytesToBigUintTC             `json:"bytesToBigUint"`
	ExtractOutpoint              []ExtractOutpointTC            `json:"extractOutpoint"`
	ExtractOutputScriptLen       []ExtractOutputScriptLenTC     `json:"extractOutputScriptLen"`
	ExtractHash                  []ExtractHashTC                `json:"extractHash"`
	ExtractHashError             []ExtractHashError             `json:"extractHashError"`
	ExtractValue                 []ExtractValueTC               `json:"extractValue"`
	ExtractValueLE               []ExtractValueLETC             `json:"extractValueLE"`
	ExtractOpReturnData          []ExtractOpReturnDataTC        `json:"extractOpReturnData"`
	ExtractOpReturnDataError     []ExtractOpReturnDataError     `json:"extractOpReturnDataError"`
	ExtractInputAtIndex          []ExtractInputAtIndexTC        `json:"extractInputAtIndex"`
	ExtractInputAtIndexError     []ExtractInputAtIndexError     `json:"extractInputAtIndexError"`
	IsLegacyInput                []IsLegacyInputTC              `json:"isLegacyInput"`
	DetermineInputLength         []DetermineInputLengthTC       `json:"determineInputLength"`
	ExtractScriptSig             []ExtractScriptSigTC           `json:"extractScriptSig"`
	ExtractScriptSigError        []ExtractScriptSigError        `json:"extractScriptSigError"`
	ExtractScriptSigLen          []ExtractScriptSigLenTC        `json:"extractScriptSigLen"`
	ValidateVin                  []ValidateVinTC                `json:"validateVin"`
	ValidateVout                 []ValidateVoutTC               `json:"validateVout"`
	ExtractInputTxIDLE           []ExtractInputTxIDLETC         `json:"extractInputTxIdLE"`
	ExtractTxIndexLE             []ExtractTxIndexLETC           `json:"extractTxIndexLE"`
	ExtractTxIndex               []ExtractTxIndexTC             `json:"extractTxIndex"`
	DetermineOutputLength        []DetermineOutputLengthTC      `json:"determineOutputLength"`
	DetermineOutputLengthError   []DetermineOutputLengthError   `json:"determineOutputLengthError"`
	ExtractOutputAtIndex         []ExtractOutputAtIndexTC       `json:"extractOutputAtIndex"`
	ExtractOutputAtIndexError    []ExtractOutputAtIndexError    `json:"extractOutputAtIndexError"`
	ExtractTarget                []ExtractTargetTC              `json:"extractTarget"`
	ExtractTimestamp             []ExtractTimestampTC           `json:"extractTimestamp"`
	Hash256MerkleStep            []Hash256MerkleStepTC          `json:"hash256MerkleStep"`
	VerifyHash256Merkle          []VerifyHash256MerkleTC        `json:"verifyHash256Merkle"`
	RetargetAlgorithm            []RetargetAlgorithmTC          `json:"retargetAlgorithm"`
	CalculateDifficulty          []CalculateDifficultyTC        `json:"calculateDifficulty"`
}

/// hacky function to sort bytes by types. can generate false positives
func decodeTestBuffer(buf []byte) interface{} {
	var ret interface{}
	if len(buf) == 32 {
		ret, _ = NewHash256Digest(buf)
	} else if len(buf) == 80 {
		ret, _ = NewRawHeader(buf)
	} else {
		ret = buf
	}
	return ret
}

// We want to crawl the test cases and attempt to hexDecode any strings
func preprocessTestCase(f interface{}) {
	switch f.(type) {
	case []interface{}:
		preprocessList(f.([]interface{}))
	case map[string]interface{}:
		preprocessObject(f.(map[string]interface{}))
	}
}

func preprocessList(l []interface{}) {
	for i := 0; i < len(l); i++ {
		switch l[i].(type) {
		case []interface{}:
			preprocessList(l[i].([]interface{}))
		case string:
			buf := DecodeIfHex(l[i].(string))
			l[i] = decodeTestBuffer(buf)
		case float64:
			l[i] = int(l[i].(float64))
		case map[string]interface{}:
			preprocessObject(l[i].(map[string]interface{}))
		}
	}
}

func preprocessObject(m map[string]interface{}) {
	for k, v := range m {
		switch v.(type) {
		case []interface{}:
			l := v.([]interface{})
			preprocessList(l)
		case string:
			buf := DecodeIfHex(v.(string))
			m[k] = decodeTestBuffer(buf)
		case float64:
			m[k] = int(v.(float64))
		case map[string]interface{}:
			// call recursively to preprocess json objects
			preprocessObject(v.(map[string]interface{}))
		}
	}
}

type UtilsSuite struct {
	suite.Suite
	Fixtures TestCases
}

// Runs the whole test suite
func TestBTCUtils(t *testing.T) {
	jsonFile, err := os.Open("../../testVectors.json")
	logIfErr(err)
	defer jsonFile.Close()

	byteValue, err := ioutil.ReadAll(jsonFile)
	logIfErr(err)

	var fixtures TestCases
	err = json.Unmarshal([]byte(byteValue), &fixtures)
	logIfErr(err)

	utilsSuite := new(UtilsSuite)
	utilsSuite.Fixtures = fixtures

	suite.Run(t, utilsSuite)
}

func logIfErr(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func (suite *UtilsSuite) TestReverseEndianness() {
	testbytes := []byte{1, 2, 3}
	reversed := ReverseEndianness(testbytes)
	suite.Equal(reversed, []byte{3, 2, 1})
	suite.Equal(len(reversed), len(testbytes))
}

func (suite *UtilsSuite) TestReverseHash256Endianness() {
	input := Hash256Digest{1, 2, 3}
	output := Hash256Digest{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 1}
	reversed := ReverseHash256Endianness(input)
	suite.Equal(reversed, output)
	suite.Equal(len(reversed), len(input))
}

func (suite *UtilsSuite) TestLastBytes() {
	testbytes := []byte{1, 2, 3, 4}
	last := LastBytes(testbytes, 1)
	suite.Equal(last, []byte{4})
}

func (suite *UtilsSuite) TestHash160() {
	fixtures := suite.Fixtures.Hash160

	for i := range fixtures {
		testCase := fixtures[i]
		expected, _ := NewHash160Digest(testCase.Output)
		actual := Hash160(testCase.Input[:])
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestHash256() {
	fixtures := suite.Fixtures.Hash256

	for i := range fixtures {
		testCase := fixtures[i]
		expected, _ := NewHash256Digest(testCase.Output)
		actual := Hash256(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestBytesToUint() {
	fixtures := suite.Fixtures.BytesToBigUint

	for i := range fixtures {
		testCase := fixtures[i]
		expected := testCase.Output
		actual := BytesToUint(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestBytesToBigUint() {
	hexString := "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
	decoded := DecodeIfHex(hexString)

	expected := sdk.NewUintFromString(hexString)
	actual := BytesToBigUint(decoded)

	suite.Equal(expected, actual)
}

func (suite *UtilsSuite) TestExtractSequenceWitness() {
	fixture := suite.Fixtures.ExtractSequenceWitness

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := ExtractSequenceWitness(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractSequenceLEWitness() {
	fixture := suite.Fixtures.ExtractSequenceLEWitness

	for i := range fixture {
		testCase := fixture[i]
		// TODO: why didn't slicing here work?
		expected := []byte(testCase.Output)
		actual := ExtractSequenceLEWitness(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractSequenceLegacy() {
	fixture := suite.Fixtures.ExtractSequenceLegacy

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual, err := ExtractSequenceLegacy(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractSequenceLegacyError

	for i := range fixtureError {
		testCase := fixtureError[i]

		actual, err := ExtractSequenceLegacy(testCase.Input)
		suite.Equal(uint32(0), actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractSequenceLELegacy() {
	fixture := suite.Fixtures.ExtractSequenceLELegacy

	for i := range fixture {
		testCase := fixture[i]
		// TODO: Why didn't just slicing work?
		expected := []byte(testCase.Output)
		actual, err := ExtractSequenceLELegacy(testCase.Input)

		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractSequenceLELegacyError

	for i := range fixtureError {
		testCase := fixtureError[i]

		actual, err := ExtractSequenceLELegacy(testCase.Input)
		suite.Equal([]byte{}, actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractOutpoint() {
	fixture := suite.Fixtures.ExtractOutpoint

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual := ExtractOutpoint(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractOuputScriptLen() {
	fixture := suite.Fixtures.ExtractOutputScriptLen

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := ExtractOutputScriptLen(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractHash() {
	fixture := suite.Fixtures.ExtractHash

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual, err := ExtractHash(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractHashError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := ExtractHash(testCase.Input)
		suite.Nil(actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractValue() {
	fixture := suite.Fixtures.ExtractValue

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := ExtractValue(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractValueLE() {
	fixture := suite.Fixtures.ExtractValueLE

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual := ExtractValueLE(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractOpReturnData() {
	fixture := suite.Fixtures.ExtractOpReturnData

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual, err := ExtractOpReturnData(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractOpReturnDataError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := ExtractOpReturnData(testCase.Input)
		suite.Nil(actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractInputAtIndex() {
	fixture := suite.Fixtures.ExtractInputAtIndex

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual, err := ExtractInputAtIndex(testCase.Input.Vin, testCase.Input.Index)

		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractInputAtIndexError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := ExtractInputAtIndex(testCase.Input.Vin, testCase.Input.Index)

		suite.Equal([]byte{}, actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestIsLegacyInput() {
	fixture := suite.Fixtures.IsLegacyInput

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := IsLegacyInput(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestDetermineInputLength() {
	fixture := suite.Fixtures.DetermineInputLength

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual, err := DetermineInputLength(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractScriptSig() {
	fixture := suite.Fixtures.ExtractScriptSig

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual, err := ExtractScriptSig(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractScriptSigError

	for i := range fixtureError {
		testCase := fixtureError[i]

		actual, err := ExtractScriptSig(testCase.Input)
		suite.Equal([]byte{}, actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractScriptSigLen() {
	fixture := suite.Fixtures.ExtractScriptSigLen

	for i := range fixture {
		testCase := fixture[i]

		expected := testCase.Output
		actualDataLen, actualScriptSigLen, err := ExtractScriptSigLen(testCase.Input)

		suite.Nil(err)
		suite.Equal(expected[0], actualDataLen)
		suite.Equal(expected[1], actualScriptSigLen)
	}
}

func (suite *UtilsSuite) TestValidateVin() {
	fixture := suite.Fixtures.ValidateVin

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := ValidateVin(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestValidateVout() {
	fixture := suite.Fixtures.ValidateVout

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := ValidateVout(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractInputTxIDLE() {
	fixture := suite.Fixtures.ExtractInputTxIDLE

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := ExtractInputTxIDLE(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractTxIndexLE() {
	fixture := suite.Fixtures.ExtractTxIndexLE

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual := ExtractTxIndexLE(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractTxIndex() {
	fixture := suite.Fixtures.ExtractTxIndex

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := ExtractTxIndex(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestDetermineOutputLength() {
	fixture := suite.Fixtures.DetermineOutputLength

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual, err := DetermineOutputLength(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.DetermineOutputLengthError

	for i := range fixtureError {
		testCase := fixtureError[i]

		actual, err := DetermineOutputLength(testCase.Input)
		suite.Equal(actual, uint64(0))
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractOutputAtIndex() {
	fixture := suite.Fixtures.ExtractOutputAtIndex

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)

		actual, err := ExtractOutputAtIndex(testCase.Input.Vout, testCase.Input.Index)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractOutputAtIndexError

	for i := range fixtureError {
		testCase := fixtureError[i]

		actual, err := ExtractOutputAtIndex(testCase.Input.Vout, testCase.Input.Index)
		suite.Equal([]byte{}, actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractTarget() {
	fixture := suite.Fixtures.ExtractTarget

	for i := range fixture {
		testCase := fixture[i]

		expected := BytesToBigUint(testCase.Output)
		actual := ExtractTarget(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractTimestamp() {
	fixture := suite.Fixtures.ExtractTimestamp

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := ExtractTimestamp(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestHash256MerkleStep() {
	fixtures := suite.Fixtures.Hash256MerkleStep

	for i := range fixtures {
		testCase := fixtures[i]
		expected := testCase.Output
		actual := hash256MerkleStep(testCase.Input[0], testCase.Input[1])
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestDetermineVarIntDataLength() {
	res1 := DetermineVarIntDataLength(0x01)
	suite.Equal(uint8(0), res1)
	res2 := DetermineVarIntDataLength(0xfd)
	suite.Equal(uint8(2), res2)
	res3 := DetermineVarIntDataLength(0xfe)
	suite.Equal(uint8(4), res3)
	res4 := DetermineVarIntDataLength(0xff)
	suite.Equal(uint8(8), res4)
}

func (suite *UtilsSuite) TestVerifyHash256Merkle() {
	fixtures := suite.Fixtures.VerifyHash256Merkle

	for i := range fixtures {
		testCase := fixtures[i]
		expected := testCase.Output
		actual := VerifyHash256Merkle(testCase.Input.Proof, testCase.Input.Index)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestRetargetAlgorithm() {
	// FIXME:
	fixtures := suite.Fixtures.RetargetAlgorithm

	for i := range fixtures {
		testCase := fixtures[i].Input
		testCaseFirst := testCase[0]
		testCaseSecond := testCase[1]
		testCaseExpected := testCase[2]

		firstTimestamp := testCaseFirst.Timestamp
		secondTimestamp := testCaseSecond.Timestamp
		previousTarget := ExtractTarget(testCaseSecond.Hex)
		expectedNewTarget := ExtractTarget(testCaseExpected.Hex)

		actual := RetargetAlgorithm((previousTarget), firstTimestamp, secondTimestamp)

		// dirty hacks. sdk.Uint doesn't give us easy access to the underlying
		a, _ := actual.MarshalAmino()
		e, _ := expectedNewTarget.MarshalAmino()
		actualBI := new(big.Int)
		actualBI.SetString(a, 0)
		expectedBI := new(big.Int)
		expectedBI.SetString(e, 0)

		res := new(big.Int)
		res.And(actualBI, expectedBI)

		suite.Equal(expectedBI, res)

		// long
		fakeSecond := firstTimestamp + 5*2016*10*60
		longRes := RetargetAlgorithm(previousTarget, firstTimestamp, fakeSecond)
		suite.Equal(previousTarget.MulUint64(4), longRes)

		// short
		fakeSecond = firstTimestamp + 2016*10*14
		shortRes := RetargetAlgorithm(previousTarget, firstTimestamp, fakeSecond)
		suite.Equal(previousTarget.QuoUint64(4), shortRes)
	}
}

func (suite *UtilsSuite) TestExtractDifficulty() {
	fixture := suite.Fixtures.RetargetAlgorithm

	for i := range fixture {
		testCase := fixture[i]
		input := testCase.Input
		for j := range input {
			h := input[j]
			actual := ExtractDifficulty(h.Hex)
			expected := sdk.NewUint(h.Difficulty)
			suite.Equal(expected, actual)
		}
	}
}

func (suite *UtilsSuite) TestCalculateDifficulty() {
	fixture := suite.Fixtures.CalculateDifficulty

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := CalculateDifficulty(testCase.Input)
		suite.Equal(expected, actual)
	}
}
