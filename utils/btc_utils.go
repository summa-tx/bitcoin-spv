package utils

// ExtractPrefix returns the extracted prefix as a byte array
// from the given byte array.
func ExtractPrefix(memory []byte) []byte {
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
// Witness Input
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

// ExtractInputAtIndex returns the input at a given index in the TxIns vector
func ExtractInputAtIndex(bytes []byte, index uint8) []byte {
	return nil
}

// DetermineOutputLength returns the length of an output
func DetermineOutputLength(bytes []byte) uint64 {
	return 0
}

// ExtractOutputAtIndex returns the output at a given index in the TxIns vector
func ExtractOutputAtIndex(bytes []byte, index uint8) []byte {
	return nil
}

//
// Block Header
//

// ExtractMerkleRootLE returns the transaction merkle root from a given block header
// The returned merkle root is little-endian
func ExtractMerkleRootLE(bytes []byte) []byte {
	return nil
}

// ExtractMerkleRootBE returns the transaction merkle root from a given block header
// The returned merkle root is big-endian
func ExtractMerkleRootBE(bytes []byte) []byte {
	return ReverseEndianness(ExtractMerkleRootLE(bytes))
}

// ExtractTarget returns the target from a given block hedaer
func ExtractTarget(bytes []byte) []byte {
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
func ExtractPrevBlockHashLE(bytes []byte) []byte {
	return nil
}

// ExtractPrevBlockHashBE returns the previous block's hash from a block header
// Returns the hash as a big endian []byte
func ExtractPrevBlockHashBE(bytes []byte) []byte {
	return ReverseEndianness(ExtractPrevBlockHashLE(bytes))
}

// ExtractTimestampLE returns the timestamp from a block header
// It returns the timestamp as a little endian []byte
// Time is not 100% reliable
func ExtractTimestampLE(bytes []byte) []byte {
	return nil
}

// ExtractTimestamp returns the timestamp from a block header as a uint32
// Time is not 100% reliable
func ExtractTimestamp(bytes []byte) uint32 {
	return uint32(BytesToUint(ReverseEndianness(ExtractTimestampLE(bytes))))
}

func hash256MerkleStep(a []byte, b []byte) []byte {
	return nil
}

func verifyHash256Merkle(a []byte, b []byte) bool {
	return false
}
