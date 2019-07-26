package btcutils

import (
	"errors"
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
func BytesToUint(memory []byte) int64 {
	return 0
}

// LastBytes returns the last num bytes from a byte array
func LastBytes(bytes []byte, num uint64) ([]byte, error) {
	return nil, errors.New("not impl")
}

// Hash160 takes a byte slice and returns a hashed byte slice.
func Hash160(bytes []byte) []byte {
	return nil
}

// Hash256 implements bitcoin's hash256 (double sha2)
func Hash256(bytes []byte) []byte {
	return nil
}

//
/* Witness Input */
//

// ExtractSequenceLE returns the LE sequence bytes from an inpute
// byte slice.
func ExtractSequenceLE(bytes []byte) []byte {
	return nil
}

// ExtractSequence returns the sequence from the input in a given tx.
// The sequence is a 4 byte little-endian number.
func ExtractSequence(bytes []byte) uint64 {
	return 0
}

// ExtractOutpoint returns the outpoint from the bytes input in a tx
// The outpoint is a 32 bit tx id with 4 byte index
func ExtractOutpoint(bytes []byte) []byte {
	return nil
}
