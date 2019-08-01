package utils

import (
	"crypto/sha256"
	"encoding/binary"

	"golang.org/x/crypto/ripemd160"
)

// ExtractPrefix returns the extracted prefix as a byte array
// from the given byte array.
func ExtractPrefix(in []byte) []byte {
	if len(in) < 6 {
		return nil
	}

	return in[0:6]
}

// ReverseEndianness takes in a byte slice and returns a
// reversed endian byte slice.
func ReverseEndianness(in []byte) []byte {
	out := make([]byte, len(in), len(in))
	copy(out, in)

	for i := len(out)/2 - 1; i >= 0; i-- {
		opp := len(out) - 1 - i
		out[i], out[opp] = out[opp], out[i]
	}

	return out
}

// BytesToUint takes a byte slice and then returns a Uint256
func BytesToUint(in []byte) uint32 {
	return binary.LittleEndian.Uint32(in)
}

// LastBytes returns the last num in from a byte array
func LastBytes(in []byte, num int) []byte {
	out := make([]byte, num)
	copy(out, in[len(in)-num:])
	return out
}

// Hash160 takes a byte slice and returns a hashed byte slice.
func Hash160(in []byte) []byte {
	r := ripemd160.New()
	r.Write(in)
	sum := r.Sum(nil)

	sha := sha256.New()
	sha.Write(sum)
	return sha.Sum(nil)
}

// Hash256 implements bitcoin's hash256 (double sha2)
func Hash256(in []byte) []byte {
	first := sha256.New()
	first.Write(in)

	second := sha256.New()
	second.Write(first.Sum(nil))

	return second.Sum(nil)
}

//
// Witness Input
//

// ExtractSequenceLE returns the LE sequence in from an inpute
// byte slice.
func ExtractSequenceLE(in []byte) []byte {
	return nil
}

// ExtractSequence returns the sequence from the input in a given tx.
// The sequence is a 4 byte little-endian number.
func ExtractSequence(in []byte) uint64 {
	return 0
}

// ExtractOutpoint returns the outpoint from the in input in a tx
// The outpoint is a 32 bit tx id with 4 byte index
func ExtractOutpoint(in []byte) []byte {
	return nil
}

// ExtractInputTxIDLE returns the LE tx input index from the input in a tx
func ExtractInputTxIDLE(in []byte) []byte {
	return nil
}

// ExtractTxID returns the input tx id from the input in a tx
// Returns the tx id as a big-endian []byte
func ExtractTxID(in []byte) []byte {
	return nil
}

// ExtractTxIndexLE extracts the LE tx input index from the input in a tx
// Returns the tx index as a little endian []byte
func ExtractTxIndexLE(in []byte) []byte {
	return nil
}

// ExtractTxIndex extracts the tx input index from the input in a tx
func ExtractTxIndex(in []byte) uint64 {
	return 0
}

// ExtractOutputScriptLen extracts the output script length
func ExtractOutputScriptLen() []byte {
	return nil
}

// ExtractValueLE extracts the value in from the output in a tx
// Returns a little endian []byte of the output value
func ExtractValueLE(in []byte) []byte {
	return nil
}

// ExtractValue extracts the value from the output in a tx
func ExtractValue() uint64 {
	return 0
}

// ExtractOpReturnData returns the value from the output in a tx
// Value is an 8byte little endian number
func ExtractOpReturnData(in []byte) []byte {
	return nil
}

// ExtractHash extracts the hash from the output script
// Returns the hash committed to by the pk_script
func ExtractHash(in []byte) []byte {
	return nil
}

// ExtractLockTimeLE returns the locktime in from a transaction
// as a little endian []byte
func ExtractLockTimeLE(in []byte) []byte {
	return LastBytes(in, 4)
}

// ExtractLocktime returns the uint64 value of the locktime in
func ExtractLocktime(in []byte) uint64 {
	return 0
}

// ExtractNumInputsBytes returns the number of inputs as in
func ExtractNumInputsBytes(in []byte) []byte {
	return nil
}

// ExtractNumInputs returns the number of inputs as integer
func ExtractNumInputs(in []byte) uint8 {
	return 0
}

// FindNumOutputs finds the location of the number of outputs
// and returns it as a uint64
func FindNumOutputs(in []byte) uint64 {
	return 0
}

// ExtractNumOutputsBytes extracts number of outputs as a []byte
func ExtractNumOutputsBytes(in []byte) []byte {
	return nil
}

// ExtractNumOutputs extracts the number of outputs as an integer
func ExtractNumOutputs(in []byte) uint8 {
	return 0
}

// ExtractInputAtIndex returns the input at a given index in the TxIns vector
func ExtractInputAtIndex(in []byte, index uint8) []byte {
	return nil
}

// DetermineOutputLength returns the length of an output
func DetermineOutputLength(in []byte) uint64 {
	return 0
}

// ExtractOutputAtIndex returns the output at a given index in the TxIns vector
func ExtractOutputAtIndex(in []byte, index uint8) []byte {
	return nil
}

//
// Block Header
//

// ExtractMerkleRootLE returns the transaction merkle root from a given block header
// The returned merkle root is little-endian
func ExtractMerkleRootLE(in []byte) []byte {
	return nil
}

// ExtractMerkleRootBE returns the transaction merkle root from a given block header
// The returned merkle root is big-endian
func ExtractMerkleRootBE(in []byte) []byte {
	return ReverseEndianness(ExtractMerkleRootLE(in))
}

// ExtractTarget returns the target from a given block hedaer
func ExtractTarget(in []byte) []byte {
	return nil
}

// CalculateDifficulty calculates difficulty from the difficulty 1 target and current target
// Difficulty 1 is 0x1d00ffff on mainnet and testnet
// Difficulty 1 is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
func CalculateDifficulty(target uint64) uint64 {
	return 0
}

// ExtractPrevBlockHashLE returns the previous block's hash from a block header
// Returns the hash as a little endian []byte
func ExtractPrevBlockHashLE(in []byte) []byte {
	return nil
}

// ExtractPrevBlockHashBE returns the previous block's hash from a block header
// Returns the hash as a big endian []byte
func ExtractPrevBlockHashBE(in []byte) []byte {
	return ReverseEndianness(ExtractPrevBlockHashLE(in))
}

// ExtractTimestampLE returns the timestamp from a block header
// It returns the timestamp as a little endian []byte
// Time is not 100% reliable
func ExtractTimestampLE(in []byte) []byte {
	return nil
}

// ExtractTimestamp returns the timestamp from a block header as a uint32
// Time is not 100% reliable
func ExtractTimestamp(in []byte) uint32 {
	return uint32(BytesToUint(ReverseEndianness(ExtractTimestampLE(in))))
}

func hash256MerkleStep(a []byte, b []byte) []byte {
	return nil
}

func verifyHash256Merkle(a []byte, b []byte) bool {
	return false
}
