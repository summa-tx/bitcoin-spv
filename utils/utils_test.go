package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestReverseEndianness(t *testing.T) {
	testbytes := []byte{1, 2, 3}
	reversed := ReverseEndianness(testbytes)
	assert.Equal(t, reversed, []byte{3, 2, 1})
	assert.NotEqual(t, reversed, []byte{1, 2, 3})
	assert.Equal(t, len(reversed), len(testbytes))
}

func TestExtractPrefix(t *testing.T) {
	testbytes := []byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	prefix := ExtractPrefix(testbytes)
	assert.Equal(t, len(prefix), 6)
	assert.Equal(t, prefix, []byte{1, 2, 3, 4, 5, 6})
}

func TestBytesToUint(t *testing.T) {
	testbytes := []byte{255, 255, 255, 255}
	num := BytesToUint(testbytes)
	assert.Equal(t, num, uint32(4294967295))
}
