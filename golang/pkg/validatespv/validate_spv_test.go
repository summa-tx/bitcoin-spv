package validatespv

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"testing"

	"github.com/stretchr/testify/suite"

	// sdk "github.com/cosmos/cosmos-sdk/types"
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