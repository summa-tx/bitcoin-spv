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

func TestLastBytes(t *testing.T) {
	testbytes := []byte{1, 2, 3, 4}
	last := LastBytes(testbytes, 1)
	assert.Equal(t, last, []byte{4})
}

func TestHash160(t *testing.T) {
	t.Skip()
}

func TestHash256(t *testing.T) {
	t.Skip()
}
