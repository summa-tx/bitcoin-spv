package utils

import (
	"crypto/sha256"
	"encoding/binary"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"golang.org/x/crypto/ripemd160"
)

// DetermineVarIntDataLength extracts the payload length of a Bitcoin VarInt
func DetermineVarIntDataLength(flag []byte) []byte {
	return nil
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

// ExtractInputAtIndex parses the input vector and returns the vin at a specified index
func ExtractInputAtIndex(vin []byte, index uint8) []byte {
	return nil
}

// IsLegacyInput determines whether an input is legacy
func IsLegacyInput(input []byte) bool {
	return nil
}

// DetermineInputLength gets the length of an input by parsing the scriptSigLen
 func DetermineInputLength(input []byte) sdk.Int {
	return sdk.NewInt(0)
 }

// ExtractSequenceLELegacy returns the LE sequence in from a tx input
// The sequence is a 4 byte little-endian number.
func ExtractSequenceLELegacy(input []byte) []byte {
	return nil
}

// ExtractSequenceLegacy returns the integer sequence in from a tx input
func ExtractSequenceLegacy(input []byte) uint32 {
	return 0
}

// ExtractScriptSig extracts the VarInt-prepended scriptSig from the input in a tx
func ExtractScriptSig(input []byte) ([]byte) {
	return nil
}

// ExtractScriptSigLen determines the length of a scriptSig in an input
func ExtractScriptSigLen(input []byte) (uint8, sdk.Int) {
	return 0, sdk.NewInt(0)
}

// ExtractSequenceLEWitness extracts the LE sequence bytes from a witness input
func ExtractSequenceLEWitness(input []byte) []byte {
	return nil
}

// ExtractSequenceWitness extracts the sequence integer from a witness input
func ExtractSequenceWitness(input []byte) uint32 {
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
func ExtractTxIndex(in []byte) uint32 {
	return 0
}

//
// Output
//

// DetermineOutputLength returns the length of an output
func DetermineOutputLength(in []byte) uint32 {
	return 0
}

// ExtractOutputAtIndex returns the output at a given index in the TxIns vector
func ExtractOutputAtIndex(in []byte, index uint8) []byte {
	return nil
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

//
// Transaction
//

// ValidateVin checks that the vin passed up is properly formatted
func ValidateVin(vin []byte) bool {
	return nil
}

// ValidateVout checks that the vin passed up is properly formatted
func ValidateVout(vout []byte) bool {
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
func CalculateDifficulty(target sdk.Int) sdk.Int {
	return 0
}

// ExtractPrevBlockHashLE returns the previous block's hash from a block header
// Returns the hash as a little endian []byte
func ExtractPrevBlockHashLE(header []byte) []byte {
	return nil
}

// ExtractPrevBlockHashBE returns the previous block's hash from a block header
// Returns the hash as a big endian []byte
func ExtractPrevBlockHashBE(header []byte) []byte {
	return ReverseEndianness(ExtractPrevBlockHashLE(header))
}

// ExtractTimestampLE returns the timestamp from a block header
// It returns the timestamp as a little endian []byte
// Time is not 100% reliable
func ExtractTimestampLE(header []byte) []byte {
	return nil
}

// ExtractTimestamp returns the timestamp from a block header as a uint32
// Time is not 100% reliable
func ExtractTimestamp(header []byte) uint32 {
	return uint32(BytesToUint(ReverseEndianness(ExtractTimestampLE(in))))
}

// ExtractDifficulty calculates the difficulty of a header
func ExtractDifficulty(header []byte) sdk.Int {
	return sdk.Int(0)
}

func hash256MerkleStep(a []byte, b []byte) []byte {
	return nil
}

// VerifyHash256Merkle checks a merkle inclusion proof's validity
func VerifyHash256Merkle(proof []byte, index uint32) bool {
	return false
}

func retargetAlgorithm(
		previousTarget sdk.Int,
		firstTimestamp uint32,
		secondTimestamp uint32) sdk.Int {
	return sdk.Int(0)
}
