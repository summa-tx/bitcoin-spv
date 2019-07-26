package btcutils

import (
	"errors"

	"github.com/piotrnar/gocoin/lib/btc"
)

// ExtractPrefix returns the extracted prefix as a byte array
// from the given byte array.
func ExtractPrefix(memory []byte) ([]byte, error) {
	return nil, errors.New("not impl")
}

// ReverseEndianness takes in a byte slice and returns a
// reversed endian byte slice.
func ReverseEndianness(memory []byte) ([]byte, error) {
	return nil, errors.New("not impl")
}

// BytesToUint takes a byte slice and then returns a Uint256
func BytesToUint(memory []byte) *btc.Uint256 {
	return btc.NewUint256(memory)
}
