package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"encoding/hex"

	"log"

	"fmt"
)

func TestReverseEndianness(t *testing.T) {
	testbytes := []byte{1, 2, 3}
	reversed := ReverseEndianness(testbytes)
	assert.Equal(t, reversed, []byte{3, 2, 1})
	assert.NotEqual(t, reversed, []byte{1, 2, 3})
	assert.Equal(t, len(reversed), len(testbytes))
}

func TestLastBytes(t *testing.T) {
	testbytes := []byte{1, 2, 3, 4}
	last := LastBytes(testbytes, 1)
	assert.Equal(t, last, []byte{4})
}

func TestHash160(t *testing.T) {
	// testbytes := []byte{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}
	// hash160 := Hash160(testbytes)
	// assert.Equal(t, hash160, []byte{27, 96, 195, 29, 186, 148, 3, 199, 77, 129, 175, 37, 95, 12, 48, 11, 254, 213, 250, 163})
	testString := "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
	compareString := "1b60c31dba9403c74d81af255f0c300bfed5faa3"

	decodedTest, errTest := hex.DecodeString(testString)
	if errTest != nil {
		log.Fatal(errTest)
	}

	decodedCompare, errCompare := hex.DecodeString(compareString)
	if errCompare != nil {
		log.Fatal(errCompare)
	}

	hashed := Hash160(decodedTest)

	if hashed == decodedCompare {
		fmt.Println("yaya")
	}

	assert.Equal(t, hashed, decodedCompare)
}

func TestHash256(t *testing.T) {
	t.Skip()
}
