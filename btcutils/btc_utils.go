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
func LastBytes(bytes []byte, num uint64) []byte {
	return nil
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

// ExtractInputTxIDLE returns the LE tx input index from the input in a tx
func ExtractInputTxIDLE(bytes []byte) []byte {
	return nil
}

// ExtractTxID returns the input tx id from the input in a tx
// Returns the tx id as a big-endian []byte
func ExtractTxID(bytes []byte) []byte {
	return nil
}

// ExtractTxIndexLE extracts the LE tx input index from the input in a tx
// Returns the tx index as a little endian []byte
func ExtractTxIndexLE(bytes []byte) []byte {
	return nil
}

// ExtractTxIndex extracts the tx input index from the input in a tx
func ExtractTxIndex(bytes []byte) uint64 {
	return 0
}

// ExtractOutputScriptLen extracts the output script length
func ExtractOutputScriptLen() []byte {
	return nil
}

// ExtractValueLE extracts the value bytes from the output in a tx
// Returns a little endian []byte of the output value
func ExtractValueLE(bytes []byte) []byte {
	return nil
}

// ExtractValue extracts the value from the output in a tx
func ExtractValue() uint64 {
	return 0
}

// ExtractOpReturnData returns the value from the output in a tx
// Value is an 8byte little endian number
func ExtractOpReturnData(bytes []byte) []byte {
	return nil
}

// ExtractHash extracts the hash from the output script
// Returns the hash committed to by the pk_script
func ExtractHash(bytes []byte) []byte {
	return nil
}

// ExtractLockTimeLE returns the locktime bytes from a transaction
// as a little endian []byte
func ExtractLockTimeLE(bytes []byte) []byte {
	return LastBytes(bytes, 4)
}

// ExtractLocktime returns the uint64 value of the locktime bytes
func ExtractLocktime(bytes []byte) uint64 {
	return 0
}

// ExtractNumInputsBytes returns the number of inputs as bytes
func ExtractNumInputsBytes(bytes []byte) []byte {
	return nil
}

// ExtractNumInputs returns the number of inputs as integer
func ExtractNumInputs(bytes []byte) uint8 {
	return 0
}

// FindNumOutputs finds the location of the number of outputs
// and returns it as a uint64
func FindNumOutputs(bytes []byte) uint64 {
	return 0
}

// ExtractNumOutputsBytes extracts number of outputs as a []byte
func ExtractNumOutputsBytes(bytes []byte) []byte {
	return nil
}

// ExtractNumOutputs extracts the number of outputs as an integer
func ExtractNumOutputs(bytes []byte) uint8 {
	return 0
}
