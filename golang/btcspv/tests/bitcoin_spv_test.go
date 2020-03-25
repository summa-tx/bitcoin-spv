package tests

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"math/big"
	"os"
	"testing"

	"github.com/stretchr/testify/suite"
	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"

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
	Prove                        []ProveTC                      `json:"prove"`
	CalculateTxId                []CalculateTxIDTC              `json:"calculateTxId"`
	ValidateHeaderWork           []ValidateHeaderWorkTC         `json:"validateHeaderWork"`
	ValidateHeaderPrevHash       []ValidateHeaderPrevHashTC     `json:"validateHeaderPrevHash"`
	ValidateHeaderChain          []ValidateHeaderChainTC        `json:"validateHeaderChain"`
	ValidateHeaderChainError     []ValidateHeaderChainError     `json:"validateHeaderChainError"`
	EncodeP2SH                   []EncodeP2SHTC                 `json:"encodeP2SH"`
	EncodeP2PKH                  []EncodeP2PKHTC                `json:"encodeP2PKH"`
	EncodeP2WSH                  []EncodeP2WSHTC                `json:"encodeP2WSH"`
	EncodeP2WPKH                 []EncodeP2WPKHTC               `json:"encodeP2WPKH"`
}

type UtilsSuite struct {
	suite.Suite
	Fixtures TestCases
}

// Runs the whole test suite
func TestBTCUtils(t *testing.T) {
	jsonFile, err := os.Open("../../../testVectors.json")
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
	reversed := btcspv.ReverseEndianness(testbytes)
	suite.Equal(reversed, []byte{3, 2, 1})
	suite.Equal(len(reversed), len(testbytes))
}

func (suite *UtilsSuite) TestReverseHash256Endianness() {
	input := Hash256Digest{1, 2, 3}
	output := Hash256Digest{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 1}
	reversed := btcspv.ReverseHash256Endianness(input)
	suite.Equal(reversed, output)
	suite.Equal(len(reversed), len(input))
}

func (suite *UtilsSuite) TestLastBytes() {
	testbytes := []byte{1, 2, 3, 4}
	last := btcspv.LastBytes(testbytes, 1)
	suite.Equal(last, []byte{4})
}

func (suite *UtilsSuite) TestHash160() {
	fixtures := suite.Fixtures.Hash160

	for i := range fixtures {
		testCase := fixtures[i]
		expected, _ := btcspv.NewHash160Digest(testCase.Output)
		actual := btcspv.Hash160(testCase.Input[:])
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestHash256() {
	fixtures := suite.Fixtures.Hash256

	for i := range fixtures {
		testCase := fixtures[i]
		expected := testCase.Output
		actual := btcspv.Hash256(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestBytesToUint() {
	fixtures := suite.Fixtures.BytesToBigUint

	for i := range fixtures {
		testCase := fixtures[i]
		expected := testCase.Output
		actual := btcspv.BytesToUint(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestBytesToBigUint() {
	hexString := "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
	decoded := btcspv.DecodeIfHex(hexString)

	expected := sdk.NewUintFromString(hexString)
	actual := btcspv.BytesToBigUint(decoded)

	suite.Equal(expected, actual)
}

func (suite *UtilsSuite) TestExtractSequenceWitness() {
	fixture := suite.Fixtures.ExtractSequenceWitness

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := btcspv.ExtractSequenceWitness(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractSequenceLEWitness() {
	fixture := suite.Fixtures.ExtractSequenceLEWitness

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual := btcspv.ExtractSequenceLEWitness(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractSequenceLegacy() {
	fixture := suite.Fixtures.ExtractSequenceLegacy

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual, err := btcspv.ExtractSequenceLegacy(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractSequenceLegacyError

	for i := range fixtureError {
		testCase := fixtureError[i]

		actual, err := btcspv.ExtractSequenceLegacy(testCase.Input)
		suite.Equal(uint32(0), actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractSequenceLELegacy() {
	fixture := suite.Fixtures.ExtractSequenceLELegacy

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual, err := btcspv.ExtractSequenceLELegacy(testCase.Input)

		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractSequenceLELegacyError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := btcspv.ExtractSequenceLELegacy(testCase.Input)

		suite.Equal([]byte{}, actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractOutpoint() {
	fixture := suite.Fixtures.ExtractOutpoint

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual := btcspv.ExtractOutpoint(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractOuputScriptLen() {
	fixture := suite.Fixtures.ExtractOutputScriptLen

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := btcspv.ExtractOutputScriptLen(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractHash() {
	fixture := suite.Fixtures.ExtractHash

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual, err := btcspv.ExtractHash(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractHashError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := btcspv.ExtractHash(testCase.Input)
		suite.Nil(actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractValue() {
	fixture := suite.Fixtures.ExtractValue

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := btcspv.ExtractValue(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractValueLE() {
	fixture := suite.Fixtures.ExtractValueLE

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual := btcspv.ExtractValueLE(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractOpReturnData() {
	fixture := suite.Fixtures.ExtractOpReturnData

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual, err := btcspv.ExtractOpReturnData(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractOpReturnDataError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := btcspv.ExtractOpReturnData(testCase.Input)
		suite.Nil(actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractInputAtIndex() {
	fixture := suite.Fixtures.ExtractInputAtIndex

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual, err := btcspv.ExtractInputAtIndex(testCase.Input.Vin, testCase.Input.Index)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractInputAtIndexError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := btcspv.ExtractInputAtIndex(testCase.Input.Vin, testCase.Input.Index)
		suite.Equal([]byte{}, actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestIsLegacyInput() {
	fixture := suite.Fixtures.IsLegacyInput

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := btcspv.IsLegacyInput(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestDetermineInputLength() {
	fixture := suite.Fixtures.DetermineInputLength

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual, err := btcspv.DetermineInputLength(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractScriptSig() {
	fixture := suite.Fixtures.ExtractScriptSig

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual, err := btcspv.ExtractScriptSig(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractScriptSigError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := btcspv.ExtractScriptSig(testCase.Input)
		suite.Equal([]byte{}, actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractScriptSigLen() {
	fixture := suite.Fixtures.ExtractScriptSigLen

	for i := range fixture {
		testCase := fixture[i]

		expected := testCase.Output
		actualDataLen, actualScriptSigLen, err := btcspv.ExtractScriptSigLen(testCase.Input)

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
		actual := btcspv.ValidateVin(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestValidateVout() {
	fixture := suite.Fixtures.ValidateVout

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := btcspv.ValidateVout(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractInputTxIDLE() {
	fixture := suite.Fixtures.ExtractInputTxIDLE

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := btcspv.ExtractInputTxIDLE(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractTxIndexLE() {
	fixture := suite.Fixtures.ExtractTxIndexLE

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual := btcspv.ExtractTxIndexLE(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractTxIndex() {
	fixture := suite.Fixtures.ExtractTxIndex

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := btcspv.ExtractTxIndex(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestDetermineOutputLength() {
	fixture := suite.Fixtures.DetermineOutputLength

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual, err := btcspv.DetermineOutputLength(testCase.Input)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.DetermineOutputLengthError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := btcspv.DetermineOutputLength(testCase.Input)
		suite.Equal(actual, uint64(0))
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractOutputAtIndex() {
	fixture := suite.Fixtures.ExtractOutputAtIndex

	for i := range fixture {
		testCase := fixture[i]
		expected := []byte(testCase.Output)
		actual, err := btcspv.ExtractOutputAtIndex(testCase.Input.Vout, testCase.Input.Index)
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures.ExtractOutputAtIndexError

	for i := range fixtureError {
		testCase := fixtureError[i]
		actual, err := btcspv.ExtractOutputAtIndex(testCase.Input.Vout, testCase.Input.Index)
		suite.Equal([]byte{}, actual)
		suite.EqualError(err, testCase.ErrorMessage)
	}
}

func (suite *UtilsSuite) TestExtractTarget() {
	fixture := suite.Fixtures.ExtractTarget

	for i := range fixture {
		testCase := fixture[i]
		expected := btcspv.BytesToBigUint(testCase.Output)
		actual := btcspv.ExtractTarget(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractTimestamp() {
	fixture := suite.Fixtures.ExtractTimestamp

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output
		actual := btcspv.ExtractTimestamp(testCase.Input)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestHash256MerkleStep() {
	fixtures := suite.Fixtures.Hash256MerkleStep

	for i := range fixtures {
		testCase := fixtures[i]
		expected := testCase.Output
		actual := btcspv.Hash256MerkleStep(testCase.Input[0], testCase.Input[1])
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestDetermineVarIntDataLength() {
	res1 := btcspv.DetermineVarIntDataLength(0x01)
	suite.Equal(uint8(0), res1)
	res2 := btcspv.DetermineVarIntDataLength(0xfd)
	suite.Equal(uint8(2), res2)
	res3 := btcspv.DetermineVarIntDataLength(0xfe)
	suite.Equal(uint8(4), res3)
	res4 := btcspv.DetermineVarIntDataLength(0xff)
	suite.Equal(uint8(8), res4)
}

func (suite *UtilsSuite) TestVerifyHash256Merkle() {
	fixtures := suite.Fixtures.VerifyHash256Merkle

	for i := range fixtures {
		testCase := fixtures[i]
		expected := testCase.Output
		actual := btcspv.VerifyHash256Merkle(testCase.Input.Proof, testCase.Input.Index)
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
		previousTarget := btcspv.ExtractTarget(testCaseSecond.Hex)
		expectedNewTarget := btcspv.ExtractTarget(testCaseExpected.Hex)

		actual := btcspv.RetargetAlgorithm((previousTarget), firstTimestamp, secondTimestamp)

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
		longRes := btcspv.RetargetAlgorithm(previousTarget, firstTimestamp, fakeSecond)
		suite.Equal(previousTarget.MulUint64(4), longRes)

		// short
		fakeSecond = firstTimestamp + 2016*10*14
		shortRes := btcspv.RetargetAlgorithm(previousTarget, firstTimestamp, fakeSecond)
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
			actual := btcspv.ExtractDifficulty(h.Hex)
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
		actual := btcspv.CalculateDifficulty(testCase.Input)
		suite.Equal(expected, actual)
	}
}
