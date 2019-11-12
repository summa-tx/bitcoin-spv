package btcspv

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"math/big"
	"os"
	"testing"

	"github.com/stretchr/testify/suite"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

type TestCase struct {
	Input        interface{} `json:"input"`
	Output       interface{} `json:"output"`
	ErrorMessage interface{} `json:"errorMessage"`
}

func (t *TestCase) UnmarshalJSON(b []byte) error {
	var data map[string]interface{}
	err := json.Unmarshal(b, &data)
	if err != nil {
		return err
	}

	t.Input = data["input"]
	t.Output = data["output"]

	switch data["input"].(type) {
	case string:
		if len(data["input"].(string)) >= 2 && data["input"].(string)[0:2] == "0x" {
			buf := DecodeIfHex(data["input"].(string))
			if len(buf) == 32 {
				t.Input, _ = NewHash256Digest(buf)
			} else if len(buf) == 80 {
				t.Input, _ = NewRawHeader(buf)
			} else {
				t.Input = buf
			}
		} else {
			t.Input = data["input"].(string)
		}
	case float64:
		t.Input = int(data["input"].(float64))
	default:
		preprocessTestCase(t.Input)
	}

	switch data["output"].(type) {
	case string:
		if len(data["output"].(string)) >= 2 && data["output"].(string)[0:2] == "0x" {
			buf := DecodeIfHex(data["output"].(string))
			if len(buf) == 32 {
				t.Output, _ = NewHash256Digest(buf)
			} else if len(buf) == 80 {
				t.Output, _ = NewRawHeader(buf)
			} else {
				t.Output = buf
			}
		} else {
			t.Output = data["output"].(string)
		}
	case float64:
		t.Output = int(data["output"].(float64))
	default:
		preprocessTestCase(t.Output)
	}

	switch data["errorMessage"].(type) {
	case string:
		t.ErrorMessage = data["errorMessage"].(string)
	case float64:
		t.ErrorMessage = int(data["errorMessage"].(float64))
	default:
		preprocessTestCase(t.ErrorMessage)
	}

	return nil
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
			if len(buf) == 32 {
				l[i], _ = NewHash256Digest(buf)
			} else if len(buf) == 80 {
				l[i], _ = NewRawHeader(buf)
			} else {
				l[i] = buf
			}
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
			if len(buf) == 32 {
				m[k], _ = NewHash256Digest(buf)
			} else if len(buf) == 80 {
				m[k], _ = NewRawHeader(buf)
			} else {
				m[k] = buf
			}
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
	Fixtures map[string][]TestCase
}

// Runs the whole test suite
func TestBTCUtils(t *testing.T) {
	jsonFile, err := os.Open("../../testVectors.json")
	defer jsonFile.Close()
	logIfErr(err)

	byteValue, err := ioutil.ReadAll(jsonFile)
	logIfErr(err)

	var fixtures map[string][]TestCase
	json.Unmarshal([]byte(byteValue), &fixtures)

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
	suite.Equal(testbytes, []byte{1, 2, 3})
	suite.Equal(len(reversed), len(testbytes))
}

func (suite *UtilsSuite) TestLastBytes() {
	testbytes := []byte{1, 2, 3, 4}
	last := LastBytes(testbytes, 1)
	suite.Equal(last, []byte{4})
}

func (suite *UtilsSuite) TestHash160() {
	fixtures := suite.Fixtures["hash160"]

	for i := range fixtures {
		testCase := fixtures[i]
		expected := testCase.Output.([]byte)
		actual := Hash160(testCase.Input.([]byte))
		suite.Equal(expected, actual[:])
	}
}

func (suite *UtilsSuite) TestHash256() {
	fixtures := suite.Fixtures["hash256"]

	for i := range fixtures {
		testCase := fixtures[i]
		expected := testCase.Output.(Hash256Digest)
		actual := Hash256(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestBytesToUint() {
	fixtures := suite.Fixtures["BytesToUint"]

	for i := range fixtures {
		testCase := fixtures[i]
		expected := uint(testCase.Output.(int))
		actual := BytesToUint(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestBytesToBigInt() {
	hexString := "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
	decoded := DecodeIfHex(hexString)

	buf := bytes.Buffer{}
	buf.WriteString("0x")
	buf.WriteString(hexString)

	expected := sdk.NewUintFromString(buf.String())

	result := BytesToBigInt(decoded)

	suite.True(expected.Equal(result))
}

func (suite *UtilsSuite) TestExtractSequenceWitness() {
	fixture := suite.Fixtures["extractSequenceWitness"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(int))
		actual := ExtractSequenceWitness(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractSequenceLEWitness() {
	fixture := suite.Fixtures["extractSequenceLEWitness"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual := ExtractSequenceLEWitness(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractSequenceLegacy() {
	fixture := suite.Fixtures["extractSequenceLegacy"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(int))
		actual := ExtractSequenceLegacy(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractSequenceLELegacy() {
	fixture := suite.Fixtures["extractSequenceLELegacy"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual := ExtractSequenceLELegacy(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractOutpoint() {
	fixture := suite.Fixtures["extractOutpoint"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual := ExtractOutpoint(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractOuputScriptLen() {
	fixture := suite.Fixtures["extractOutputScriptLen"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(int))
		actual := ExtractOutputScriptLen(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractHash() {
	fixture := suite.Fixtures["extractHash"]

	for i := range fixture {
		testCase := fixture[i]
		expected := normalizeToByteSlice(testCase.Output)
		actual, err := ExtractHash(normalizeToByteSlice(testCase.Input))
		suite.Nil(err)
		suite.Equal(expected[:], actual)
	}

	fixtureError := suite.Fixtures["extractHashError"]

	for i := range fixtureError {
		testCase := fixtureError[i]
		expected := testCase.ErrorMessage.(string)
		actual, err := ExtractHash(normalizeToByteSlice(testCase.Input))
		suite.Nil(actual)
		suite.EqualError(err, expected)
	}
}

func (suite *UtilsSuite) TestExtractValue() {
	fixture := suite.Fixtures["extractValue"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(int))
		actual := ExtractValue(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractValueLE() {
	fixture := suite.Fixtures["extractValueLE"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual := ExtractValueLE(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractOpReturnData() {
	fixture := suite.Fixtures["extractOpReturnData"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual, err := ExtractOpReturnData(testCase.Input.([]byte))
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures["extractOpReturnDataError"]

	for i := range fixtureError {
		testCase := fixtureError[i]
		expected := testCase.ErrorMessage.(string)
		actual, err := ExtractOpReturnData(testCase.Input.([]byte))
		suite.Nil(actual)
		suite.EqualError(err, expected)
	}
}

func (suite *UtilsSuite) TestExtractInputAtIndex() {
	fixture := suite.Fixtures["extractInputAtIndex"]

	for i := range fixture {
		testCase := fixture[i]
		input := testCase.Input.(map[string]interface{})
		expected := testCase.Output.([]byte)
		actual := ExtractInputAtIndex(input["vin"].([]byte), uint8(input["index"].(int)))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestIsLegacyInput() {
	fixture := suite.Fixtures["isLegacyInput"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(bool)
		actual := IsLegacyInput(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestDetermineInputLength() {
	fixture := suite.Fixtures["determineInputLength"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(int))
		actual := DetermineInputLength(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractScriptSig() {
	fixture := suite.Fixtures["extractScriptSig"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual := ExtractScriptSig(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractScriptSigLen() {
	fixture := suite.Fixtures["extractScriptSigLen"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]interface{})
		actualDataLen, actualScriptSigLen := ExtractScriptSigLen(testCase.Input.([]byte))
		suite.Equal(uint(expected[0].(int)), uint(actualDataLen))
		suite.Equal(uint(expected[1].(int)), uint(actualScriptSigLen))
	}
}

func (suite *UtilsSuite) TestValidateVin() {
	fixture := suite.Fixtures["validateVin"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(bool)
		actual := ValidateVin(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestValidateVout() {
	fixture := suite.Fixtures["validateVout"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(bool)
		actual := ValidateVout(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractInputTxIDLE() {
	fixture := suite.Fixtures["extractInputTxIdLE"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(Hash256Digest)
		actual := ExtractInputTxIDLE(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractInputTxID() {
	fixture := suite.Fixtures["extractInputTxId"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(Hash256Digest)
		actual := ExtractInputTxID(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractTxIndexLE() {
	fixture := suite.Fixtures["extractTxIndexLE"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual := ExtractTxIndexLE(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractTxIndex() {
	fixture := suite.Fixtures["extractTxIndex"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(int))
		actual := ExtractTxIndex(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestDetermineOutputLength() {
	fixture := suite.Fixtures["determineOutputLength"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(int))
		actual, err := DetermineOutputLength(testCase.Input.([]byte))
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures["determineOutputLengthError"]

	for i := range fixtureError {
		testCase := fixtureError[i]
		expected := testCase.ErrorMessage.(string)
		actual, err := DetermineOutputLength(testCase.Input.([]byte))
		suite.Equal(actual, uint(0))
		suite.EqualError(err, expected)
	}
}

func (suite *UtilsSuite) TestExtractOutputAtIndex() {
	fixture := suite.Fixtures["extractOutputAtIndex"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		inputs := testCase.Input.(map[string]interface{})
		vout := inputs["vout"].([]byte)
		index := inputs["index"].(int)
		actual, err := ExtractOutputAtIndex(vout, uint8(index))
		if err != nil {
			log.Fatal(err)
		}
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	// Error case. Use the 10 bytes to simulate a vout with a very long output
	actual, err := ExtractOutputAtIndex([]byte{0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0xff}, 1)
	expected := "Multi-byte VarInts not supported"
	suite.Equal([]byte{}, actual)
	suite.EqualError(err, expected)
}

func (suite *UtilsSuite) TestExtractMerkleRootBE() {
	fixture := suite.Fixtures["extractMerkleRootBE"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(Hash256Digest)
		actual := ExtractMerkleRootBE(testCase.Input.(RawHeader))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractTarget() {
	fixture := suite.Fixtures["extractTarget"]

	for i := range fixture {
		testCase := fixture[i]
		expected := BytesToBigInt(testCase.Output.([]byte))
		actual := ExtractTarget(testCase.Input.(RawHeader))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractPrevBlockHashBE() {
	fixture := suite.Fixtures["retargetAlgorithm"]

	for i := range fixture {
		testCase := fixture[i]
		input := testCase.Input.([]interface{})
		for j := range input {
			h := input[j].(map[string]interface{})
			actual := ExtractPrevBlockHashBE(h["hex"].(RawHeader))
			expected := h["prev_block"].(Hash256Digest)
			suite.Equal(expected, actual)
		}
	}
}

func (suite *UtilsSuite) TestExtractTimestamp() {
	fixture := suite.Fixtures["extractTimestamp"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(int))
		actual := ExtractTimestamp(testCase.Input.(RawHeader))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestHash256MerkleStep() {
	fixtures := suite.Fixtures["hash256MerkleStep"]

	for i := range fixtures {
		testCase := fixtures[i]
		ins := testCase.Input.([]interface{})
		actual := hash256MerkleStep(ins[0].([]byte), ins[1].([]byte))
		expected := testCase.Output.(Hash256Digest)
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
	// res
}

func (suite *UtilsSuite) TestVerifyHash256Merkle() {
	fixtures := suite.Fixtures["verifyHash256Merkle"]

	for i := range fixtures {
		testCase := fixtures[i]
		ins := testCase.Input.(map[string]interface{})
		proof := normalizeToByteSlice(ins["proof"])
		index := uint(ins["index"].(int))
		expected := testCase.Output.(bool)
		actual := VerifyHash256Merkle(proof, index)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestRetargetAlgorithm() {
	// FIXME:
	fixtures := suite.Fixtures["retargetAlgorithm"]

	for i := range fixtures {
		testCase := fixtures[i].Input.([]interface{})
		testCaseFirst := testCase[0].(map[string]interface{})
		testCaseSecond := testCase[1].(map[string]interface{})
		testCaseExpected := testCase[2].(map[string]interface{})

		firstTimestamp := uint(testCaseFirst["timestamp"].(int))
		secondTimestamp := uint(testCaseSecond["timestamp"].(int))
		previousTarget := ExtractTarget(testCaseSecond["hex"].(RawHeader))
		expectedNewTarget := ExtractTarget(testCaseExpected["hex"].(RawHeader))

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
	fixture := suite.Fixtures["retargetAlgorithm"]

	for i := range fixture {
		testCase := fixture[i]
		input := testCase.Input.([]interface{})
		for j := range input {
			h := input[j].(map[string]interface{})
			actual := ExtractDifficulty(h["hex"].(RawHeader))
			expected := sdk.NewUint(uint64(h["difficulty"].(int)))
			suite.Equal(expected, actual)
		}
	}
}

func (suite *UtilsSuite) TestCalculateDifficulty() {
	fixture := suite.Fixtures["calculateDifficulty"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(sdk.Int)
		actual := CalculateDifficulty(testCase.Input.(sdk.Uint))
		suite.Equal(expected, actual)
	}
}
