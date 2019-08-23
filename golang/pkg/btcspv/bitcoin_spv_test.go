package btcspv

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"testing"

	// "fmt"

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
		t.Input = decodeIfHex(data["input"].(string))
	case float64:
		t.Input = uint(data["input"].(float64))
	default:
		preprocessTestCase(t.Input)
	}

	switch data["output"].(type) {
	case string:
		t.Output = decodeIfHex(data["output"].(string))
	case float64:
		t.Output = uint(data["output"].(float64))
	default:
		preprocessTestCase(t.Output)
	}

	switch data["errorMessage"].(type) {
	case string:
		t.ErrorMessage = data["errorMessage"].(string)
	case float64:
		t.ErrorMessage = uint(data["errorMessage"].(float64))
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
			l[i] = decodeIfHex(l[i].(string))
		case float64:
			l[i] = uint(l[i].(float64))
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
			// overwrite the string with a []byte
			m[k] = decodeIfHex(v.(string))
		case float64:
			m[k] = uint(v.(float64))
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
	jsonFile, err := os.Open("../../../testVectors.json")
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

func decodeIfHex(s string) []byte {
	res, err := hex.DecodeString(strip0xPrefix(s))
	if err != nil {
		return []byte(s)
	}
	return res
}

func strip0xPrefix(s string) string {
	if len(s) < 2 {
		return s
	}
	if s[0:2] == "0x" {
		return s[2:]
	}
	return s
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
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestHash256() {
	fixtures := suite.Fixtures["hash256"]

	for i := range fixtures {
		testCase := fixtures[i]
		expected := testCase.Output.([]byte)
		actual := Hash256(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestBytesToUint() {
	fixtures := suite.Fixtures["BytesToUint"]

	for i := range fixtures {
		testCase := fixtures[i]
		expected := uint(testCase.Output.(uint))
		actual := BytesToUint(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestBytesToBigUint() {
	hexString := "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
	decoded := decodeIfHex(hexString)

	buf := bytes.Buffer{}
	buf.WriteString("0x")
	buf.WriteString(hexString)

	expected := sdk.NewUintFromString(buf.String())
	// if !ok {
	// 	log.Fatal("New int not ok")
	// }

	result := BytesToBigUint(decoded)

	suite.True(expected.Equal(result))
}

func (suite *UtilsSuite) TestExtractSequenceWitness() {
	fixture := suite.Fixtures["extractSequenceWitness"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(uint))
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
		expected := uint(testCase.Output.(uint))
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
		expected := uint(testCase.Output.(uint))
		actual := ExtractOutputScriptLen(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractHash() {
	fixture := suite.Fixtures["extractHash"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual, err := ExtractHash(testCase.Input.([]byte))
		suite.Nil(err)
		suite.Equal(expected, actual)
	}

	fixtureError := suite.Fixtures["extractHashError"]

	for i := range fixtureError {
		testCase := fixtureError[i]
		expected := testCase.ErrorMessage.(string)
		actual, err := ExtractHash(testCase.Input.([]byte))
		suite.Nil(actual)
		suite.EqualError(err, expected)
	}
}

func (suite *UtilsSuite) TestExtractValue() {
	fixture := suite.Fixtures["extractValue"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(uint))
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
		actual := ExtractInputAtIndex(input["vin"].([]byte), uint8(input["index"].(uint)))
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
		expected := uint(testCase.Output.(uint))
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
		suite.Equal(uint(expected[0].(uint)), uint(actualDataLen))
		suite.Equal(uint(expected[1].(uint)), uint(actualScriptSigLen))
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

func (suite *UtilsSuite) TestExtractInputTxIdLE() {
	fixture := suite.Fixtures["extractInputTxIdLE"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual := ExtractInputTxIdLE(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractInputTxId() {
	fixture := suite.Fixtures["extractInputTxId"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual := ExtractInputTxId(testCase.Input.([]byte))
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
		expected := uint(testCase.Output.(uint))
		actual := ExtractTxIndex(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestDetermineOutputLength() {
	fixture := suite.Fixtures["determineOutputLength"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(uint))
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
		index := inputs["index"].(uint)
		actual, err := ExtractOutputAtIndex(vout, uint8(index))
		if err != nil {
			log.Fatal(err)
		}
		suite.Nil(err)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractMerkleRootBE() {
	fixture := suite.Fixtures["extractMerkleRootBE"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual := ExtractMerkleRootBE(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractTarget() {
	fixture := suite.Fixtures["extractTarget"]

	for i := range fixture {
		testCase := fixture[i]
		expected := BytesToBigUint(testCase.Output.([]byte))
		actual := ExtractTarget(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractPrevBlockHashBE() {
	fixture := suite.Fixtures["extractPrevBlockHashBE"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.([]byte)
		actual := ExtractPrevBlockHashBE(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestExtractTimestamp() {
	fixture := suite.Fixtures["extractTimestamp"]

	for i := range fixture {
		testCase := fixture[i]
		expected := uint(testCase.Output.(uint))
		actual := ExtractTimestamp(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestHash256MerkleStep() {
	fixtures := suite.Fixtures["hash256MerkleStep"]

	for i := range fixtures {
		testCase := fixtures[i]
		ins := testCase.Input.([]interface{})
		actual := hash256MerkleStep(ins[0].([]byte), ins[1].([]byte))
		expected := testCase.Output.([]byte)
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestDetermineVarIntDataLength() {
	res1 := DetermineVarIntDataLength(uint8(0x01))
	suite.Equal(res1, uint8(0))
	res2 := DetermineVarIntDataLength(uint8(0xfd))
	suite.Equal(res2, uint8(2))
	res3 := DetermineVarIntDataLength(uint8(0xfe))
	suite.Equal(res3, uint8(4))
	res4 := DetermineVarIntDataLength(uint8(0xff))
	suite.Equal(res4, uint8(8))
}

//   it('calculates consensus-correct retargets', () => {
//     let firstTimestamp;
//     let secondTimestamp;
//     let previousTarget;
//     let expectedNewTarget;
//     let res;
//     for (let i = 0; i < constants.RETARGET_TUPLES.length; i += 1) {
//       firstTimestamp = constants.RETARGET_TUPLES[i][0].timestamp;
//       secondTimestamp = constants.RETARGET_TUPLES[i][1].timestamp;
//       previousTarget = BTCUtils.extractTarget(
//         utils.deserializeHex(constants.RETARGET_TUPLES[i][1].hex)
//       );
//       expectedNewTarget = BTCUtils.extractTarget(
//         utils.deserializeHex(constants.RETARGET_TUPLES[i][2].hex)
//       );
//       res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
//       // (response & expected) == expected
//       // this converts our full-length target into truncated block target
//       assert.equal(res & expectedNewTarget, expectedNewTarget);

//       secondTimestamp = firstTimestamp + 5 * 2016 * 10 * 60; // longer than 4x
//       res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
//       assert.equal(res / BigInt(4) & previousTarget, previousTarget);

//       secondTimestamp = firstTimestamp + 2016 * 10 * 14; // shorter than 1/4x
//       res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
//       assert.equal(res * BigInt(4) & previousTarget, previousTarget);
//     }
//   });
func (suite *UtilsSuite) TestRetargetAlgorithm() {
	suite.T().Skip()
	// FIXME:
	// fixtures := suite.Fixtures["retargetAlgorithm"]

	// for i := range fixtures {
	// 	testCase := fixtures [i]

	// testCaseFirst := testCase[0]
	// testCaseSecond := testCase[1]
	// testCaseExpected := testCase[2]
	// firstTimestamp := testCaseFirst["timestamp"]
	// secondTimestamp := testCaseSecond["timestamp"]
	// previousTarget := ExtractTarget(testCaseSecond["hex"])
	// expectedNewTarget := ExtractTarget(testCaseExpected["hex"])

	// data := testCase.()
	// firstTimestamp := data[0]["timestamp"]
	// secondTimestamp := data[1]["timestamp"]
	// previousTarget := ExtractTarget(data[1].hex)
	// expectedNewTarget := ExtractTarget(data[2].hex)

	// expected := RetargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp)
	// suite.Equal(expected & expectedNewTarget, expectedNewTarget)

	// secondTimestamp = firstTimestamp + (5 * 2016 * 10 * 60)
	// expected = RetargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp)
	// suite.Equal(expected / sdk.NewInt(4) & previousTarget, previousTarget)

	// secondTimestamp = firstTimestamp + (2016 * 10 * 14)
	// expected = RetargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp)
	// suite.Equal(expected * sdk.NewInt(4) & previousTarget, previousTarget)
	// }
}

//   it('extracts difficulty from a header', () => {
//     let actual;
//     let expected;
//     for (let i = 0; i < constants.RETARGET_TUPLES.length; i += 1) {
//       actual = BTCUtils.extractDifficulty(
//         utils.deserializeHex(constants.RETARGET_TUPLES[i][0].hex)
//       );
//       expected = constants.RETARGET_TUPLES[i][0].difficulty;
//       assert.equal(actual, expected);

//       actual = BTCUtils.extractDifficulty(
//         utils.deserializeHex(constants.RETARGET_TUPLES[i][1].hex)
//       );
//       expected = constants.RETARGET_TUPLES[i][1].difficulty;
//       assert.equal(actual, expected);

//       actual = BTCUtils.extractDifficulty(
//         utils.deserializeHex(constants.RETARGET_TUPLES[i][2].hex)
//       );
//       expected = constants.RETARGET_TUPLES[i][2].difficulty;
//       assert.equal(actual, expected);
//     }
//   });
// });
func (suite *UtilsSuite) TestExtractDifficulty() {
	// var actual sdk.Int
	// var expected sdk.Int
	suite.T().Skip()
	// need to figure out how to work with data in "retargetAlgorithm" in testVectors.json
}

func (suite *UtilsSuite) TestCalculateDifficulty() {
	// diffOneTarget, _ := sdk.NewIntFromString("0xffff0000000000000000000000000000000000000000000000000000")
	// diff := CalculateDifficulty(diffOneTarget)
	// suite.True(diff.Equal(sdk.NewInt(1)))

	// diff256, _ := sdk.NewIntFromString("0xffff00000000000000000000000000000000000000000000000000")
	// diff = CalculateDifficulty(diff256)
	// suite.True(diff.Equal(sdk.NewInt(256)))

	// diff65536, _ := sdk.NewIntFromString("0xffff000000000000000000000000000000000000000000000000")
	// diff = CalculateDifficulty(diff65536)
	// suite.True(diff.Equal(sdk.NewInt(65536)))

	fixture := suite.Fixtures["calculateDifficulty"]

	for i := range fixture {
		testCase := fixture[i]
		expected := testCase.Output.(sdk.Uint)
		actual := CalculateDifficulty(testCase.Input.(sdk.Uint))
		suite.Equal(expected, actual)
	}
}
