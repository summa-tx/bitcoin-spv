package btcspv_test

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"math/big"
	"os"
	"testing"

	"github.com/stretchr/testify/suite"
	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
	tutils "github.com/summa-tx/bitcoin-spv/golang/btcspv/test_utils"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Hash256Digest 32-byte double-sha2 digest
type Hash256Digest = btcspv.Hash256Digest

// Hash160Digest is a 20-byte ripemd160+sha2 hash
type Hash160Digest = btcspv.Hash160Digest

// RawHeader is an 80-byte raw header
type RawHeader = btcspv.RawHeader

// HexBytes is a type alias to make JSON hex ser/deser easier
type HexBytes = btcspv.HexBytes

// BitcoinHeader is a parsed Bitcoin header
type BitcoinHeader = btcspv.BitcoinHeader

// SPVProof is the base struct for an SPV proof
type SPVProof = btcspv.SPVProof

type TestCases struct {
	ExtractSequenceWitness       []tutils.ExtractSequenceWitnessTC     `json:"extractSequenceWitness"`
	ExtractSequenceLEWitness     []tutils.ExtractSequenceLEWitnessTC   `json:"extractSequenceLEWitness"`
	ExtractSequenceLegacy        []tutils.ExtractSequenceLegacyTC      `json:"extractSequenceLegacy"`
	ExtractSequenceLegacyError   []tutils.ExtractSequenceLegacyError   `json:"extractSequenceLegacyError"`
	ExtractSequenceLELegacy      []tutils.ExtractSequenceLELegacyTC    `json:"extractSequenceLELegacy"`
	ExtractSequenceLELegacyError []tutils.ExtractSequenceLELegacyError `json:"extractSequenceLELegacyError"`
	Hash160                      []tutils.Hash160TC                    `json:"hash160"`
	Hash256                      []tutils.Hash256TC                    `json:"hash256"`
	BytesToBigUint               []tutils.BytesToBigUintTC             `json:"bytesToBigUint"`
	ExtractOutpoint              []tutils.ExtractOutpointTC            `json:"extractOutpoint"`
	ExtractHash                  []tutils.ExtractHashTC                `json:"extractHash"`
	ExtractHashError             []tutils.ExtractHashError             `json:"extractHashError"`
	ExtractValue                 []tutils.ExtractValueTC               `json:"extractValue"`
	ExtractValueLE               []tutils.ExtractValueLETC             `json:"extractValueLE"`
	ExtractOpReturnData          []tutils.ExtractOpReturnDataTC        `json:"extractOpReturnData"`
	ExtractOpReturnDataError     []tutils.ExtractOpReturnDataError     `json:"extractOpReturnDataError"`
	ExtractInputAtIndex          []tutils.ExtractInputAtIndexTC        `json:"extractInputAtIndex"`
	ExtractInputAtIndexError     []tutils.ExtractInputAtIndexError     `json:"extractInputAtIndexError"`
	IsLegacyInput                []tutils.IsLegacyInputTC              `json:"isLegacyInput"`
	DetermineInputLength         []tutils.DetermineInputLengthTC       `json:"determineInputLength"`
	ExtractScriptSig             []tutils.ExtractScriptSigTC           `json:"extractScriptSig"`
	ExtractScriptSigError        []tutils.ExtractScriptSigError        `json:"extractScriptSigError"`
	ExtractScriptSigLen          []tutils.ExtractScriptSigLenTC        `json:"extractScriptSigLen"`
	ValidateVin                  []tutils.ValidateVinTC                `json:"validateVin"`
	ValidateVout                 []tutils.ValidateVoutTC               `json:"validateVout"`
	ExtractInputTxIDLE           []tutils.ExtractInputTxIDLETC         `json:"extractInputTxIdLE"`
	ExtractTxIndexLE             []tutils.ExtractTxIndexLETC           `json:"extractTxIndexLE"`
	ExtractTxIndex               []tutils.ExtractTxIndexTC             `json:"extractTxIndex"`
	DetermineOutputLength        []tutils.DetermineOutputLengthTC      `json:"determineOutputLength"`
	DetermineOutputLengthError   []tutils.DetermineOutputLengthError   `json:"determineOutputLengthError"`
	ExtractOutputAtIndex         []tutils.ExtractOutputAtIndexTC       `json:"extractOutputAtIndex"`
	ExtractOutputAtIndexError    []tutils.ExtractOutputAtIndexError    `json:"extractOutputAtIndexError"`
	ExtractTarget                []tutils.ExtractTargetTC              `json:"extractTarget"`
	ExtractTimestamp             []tutils.ExtractTimestampTC           `json:"extractTimestamp"`
	Hash256MerkleStep            []tutils.Hash256MerkleStepTC          `json:"hash256MerkleStep"`
	VerifyHash256Merkle          []tutils.VerifyHash256MerkleTC        `json:"verifyHash256Merkle"`
	RetargetAlgorithm            []tutils.RetargetAlgorithmTC          `json:"retargetAlgorithm"`
	CalculateDifficulty          []tutils.CalculateDifficultyTC        `json:"calculateDifficulty"`
	Prove                        []tutils.ProveTC                      `json:"prove"`
	CalculateTxID                []tutils.CalculateTxIDTC              `json:"calculateTxId"`
	ValidateHeaderWork           []tutils.ValidateHeaderWorkTC         `json:"validateHeaderWork"`
	ValidateHeaderPrevHash       []tutils.ValidateHeaderPrevHashTC     `json:"validateHeaderPrevHash"`
	ValidateHeaderChain          []tutils.ValidateHeaderChainTC        `json:"validateHeaderChain"`
	ValidateHeaderChainError     []tutils.ValidateHeaderChainError     `json:"validateHeaderChainError"`
	EncodeP2SH                   []tutils.EncodeP2SHTC                 `json:"encodeP2SH"`
	EncodeP2PKH                  []tutils.EncodeP2PKHTC                `json:"encodeP2PKH"`
	EncodeP2WSH                  []tutils.EncodeP2WSHTC                `json:"encodeP2WSH"`
	EncodeP2WPKH                 []tutils.EncodeP2WPKHTC               `json:"encodeP2WPKH"`
}

type UtilsSuite struct {
	suite.Suite
	Fixtures TestCases
}

func logIfErr(err error) {
	if err != nil {
		log.Fatal(err)
	}
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
		expected := testCase.Output
		actual := btcspv.Hash160(testCase.Input)
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
