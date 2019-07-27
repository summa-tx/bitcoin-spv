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
