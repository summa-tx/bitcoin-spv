package btcspv

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"testing"

	"github.com/stretchr/testify/suite"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

type TestCase struct {
	Input  interface{} `json:"input"`
	Output interface{} `json:"output"`
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
		t.Input = int(data["input"].(float64))
	default:
		preprocessTestCase(t.Input)
	}

	switch data["output"].(type) {
	case string:
		t.Output = decodeIfHex(data["output"].(string))
	case float64:
		t.Output = int(data["output"].(float64))
	default:
		preprocessTestCase(t.Output)
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
			// overwrite the string with a []byte
			m[k] = decodeIfHex(v.(string))
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
	fixtures := suite.Fixtures["bytesToUint"]

	for i := range fixtures {
		testCase := fixtures[i]
		expected := uint(testCase.Output.(int))
		actual := bytesToUint(testCase.Input.([]byte))
		suite.Equal(expected, actual)
	}
}

func (suite *UtilsSuite) TestBytesToBigInt() {
	hexString := "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
	decoded := decodeIfHex(hexString)

	buf := bytes.Buffer{}
	buf.WriteString("0x")
	buf.WriteString(hexString)

	expected, ok := sdk.NewIntFromString(buf.String())
	if !ok {
		log.Fatal("New int not ok")
	}

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
		suite.Equal(expected, err)
	}
}

func (suite *UtilsSuite) TestExtractValue() {
	suite.T().Skip()
}

func (suite *UtilsSuite) TestExtractValueLE() {
	suite.T().Skip()
}

func (suite *UtilsSuite) TestExtractOpReturnData() {
	suite.T().Skip()
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
	// TODO: first test
	decode := decodeIfHex("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000001eeffffffff")

	res := IsLegacyInput(decode)
	suite.Equal(res, true)
}

func (suite *UtilsSuite) TestDetermineInputLength() {
	decode := decodeIfHex("7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab3750000000000ffffffffaa15ec17524f1f7bd47ab7caa4c6652cb95eec4c58902984f9b4bcfee444567d0000000000ffffff")
	res := DetermineInputLength(decode)
	suite.Equal(res, uint(41))

	decode = decodeIfHex("dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd040000000000000000")
	res = DetermineInputLength(decode)
	suite.Equal(res, uint(41))

	decode = decodeIfHex("dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd0400000002000000000000")
	res = DetermineInputLength(decode)
	suite.Equal(res, uint(43))

	decode = decodeIfHex("dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd040000000900000000000000000000000000")
	res = DetermineInputLength(decode)
	suite.Equal(res, uint(50))

	decode = decodeIfHex("dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd04000000fdff0000000000")
	res = DetermineInputLength(decode)
	suite.Equal(res, uint(298))

}

func (suite *UtilsSuite) TestExtractScriptSig() {
	// TODO: first test
	decodeTest := decodeIfHex("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000001eeffffffff")
	decodeAnswer := decodeIfHex("01ee")
	res := ExtractScriptSig(decodeTest)
	suite.Equal(res, decodeAnswer)

	decodeTest = decodeIfHex("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000fd0100eeffffffff")
	decodeAnswer = decodeIfHex("fd0100ee")
	res = ExtractScriptSig(decodeTest)
	suite.Equal(res, decodeAnswer)

	decodeTest = decodeIfHex("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000fe01000000eeffffffff")
	decodeAnswer = decodeIfHex("fe01000000ee")
	res = ExtractScriptSig(decodeTest)
	suite.Equal(res, decodeAnswer)
}

func (suite *UtilsSuite) TestExtractScriptSigLen() {
	// TODO: write first test
	decode := decodeIfHex("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000001eeffffffff")
	dataLen, scriptSigLen := ExtractScriptSigLen(decode)
	suite.Equal(dataLen, uint(0))
	suite.Equal(scriptSigLen, uint(1))

	decode = decodeIfHex("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000FF0000000000000000ffffffff")
	dataLen, scriptSigLen = ExtractScriptSigLen(decode)
	suite.Equal(dataLen, uint(8))
	suite.Equal(scriptSigLen, uint(0))

}

func (suite *UtilsSuite) TestValidateVin() {
	// TODO: write first test
	decode, _ := hex.DecodeString("FF1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff")
	res := ValidateVin(decode)
	suite.Equal(res, false)

	decode, _ = hex.DecodeString("001746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff")
	res = ValidateVin(decode)
	suite.Equal(res, false)

	decode, _ = hex.DecodeString("011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffff")
	res = ValidateVin(decode)
	suite.Equal(res, false)

	decode, _ = hex.DecodeString("011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffffEEEEE")
	res = ValidateVin(decode)
	suite.Equal(res, false)

}

func (suite *UtilsSuite) TestValidateVout() {
	// TODO: write first test
	decode, _ := hex.DecodeString("FF4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211")
	res := ValidateVin(decode)
	suite.Equal(res, false)

	decode, _ = hex.DecodeString("004897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211")
	res = ValidateVin(decode)
	suite.Equal(res, false)

	decode, _ = hex.DecodeString("024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b078952")
	res = ValidateVin(decode)
	suite.Equal(res, false)

	decode, _ = hex.DecodeString("024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b078952111111111111111")
	res = ValidateVin(decode)
	suite.Equal(res, false)

}

func (suite *UtilsSuite) TestExtractInputTxIdLE() {
	suite.T().Skip()
}

func (suite *UtilsSuite) TestextractInputTxId() {
	suite.T().Skip()
}

func (suite *UtilsSuite) TestExtractIndexLE() {
	suite.T().Skip()
}

func (suite *UtilsSuite) TestextractTxIndex() {
	suite.T().Skip()
}

func (suite *UtilsSuite) TestDetermineOutputLength() {
	decode, _ := hex.DecodeString("00000000000000002200")
	res := DetermineOutputLength(decode)
	suite.Equal(res, uint(43))

	decode, _ = hex.DecodeString("00000000000000001600")
	res = DetermineOutputLength(decode)
	suite.Equal(res, uint(31))

	decode, _ = hex.DecodeString("0000000000000000206a")
	res = DetermineOutputLength(decode)
	suite.Equal(res, uint(41))

	decode, _ = hex.DecodeString("000000000000000002")
	res = DetermineOutputLength(decode)
	suite.Equal(res, uint(11))

	decode, _ = hex.DecodeString("000000000000000000")
	res = DetermineOutputLength(decode)
	suite.Equal(res, uint(9))

	decode, _ = hex.DecodeString("000000000000000088")
	res = DetermineOutputLength(decode)
	suite.Equal(res, uint(145))

	// TODO: write test for error handling
}

func (suite *UtilsSuite) TestExtractOutputAtIndex() {
	suite.T().Skip()
}

func (suite *UtilsSuite) TestExtractMerkleRootBE() {
	suite.T().Skip()
}

func (suite *UtilsSuite) TestExtractTarget() {
	suite.T().Skip()
}

func (suite *UtilsSuite) TestExtractPrevBlockHashBE() {
	suite.T().Skip()
}

func (suite *UtilsSuite) TestExtractTimestamp() {
	suite.T().Skip()
	decoded, _ := hex.DecodeString("0100000055bd840a78798ad0da853f68974f3d183e2bd1db6a842c1feecf222a00000000ff104ccb05421ab93e63f8c3ce5c2c2e9dbb37de2764b3a3175c8166562cac7d51b96a49ffff001d283e9e70")
	res := ExtractTimestamp(decoded)
	suite.Equal(res, sdk.NewInt(int64(1231731025)))
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
}

func (suite *UtilsSuite) TestCalculateDifficulty() {
	diffOneTarget, _ := sdk.NewIntFromString("0xffff0000000000000000000000000000000000000000000000000000")
	diff := CalculateDifficulty(diffOneTarget)
	suite.True(diff.Equal(sdk.NewInt(1)))

	diff256, _ := sdk.NewIntFromString("0xffff00000000000000000000000000000000000000000000000000")
	diff = CalculateDifficulty(diff256)
	suite.True(diff.Equal(sdk.NewInt(256)))

	diff65536, _ := sdk.NewIntFromString("0xffff000000000000000000000000000000000000000000000000")
	diff = CalculateDifficulty(diff65536)
	suite.True(diff.Equal(sdk.NewInt(65536)))
}
