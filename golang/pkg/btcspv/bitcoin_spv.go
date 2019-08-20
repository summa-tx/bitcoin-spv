package btcspv

import (
	"bytes"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"math/big"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"golang.org/x/crypto/ripemd160"
)

// bytesToUint converts 1, 2, 3, or 4-byte numbers to uints
func BytesToUint(b []byte) uint {
	total := uint(0)
	length := uint(len(b))

	for i := uint(0); i < length; i++ {
		total += uint(b[i]) << ((length - i - 1) * 8)
	}

	return total
}

// BytesToBigInt converts a bytestring to a cosmos-sdk Int
func BytesToBigInt(b []byte) sdk.Uint {
	ret := sdk.NewUintFromString("0x" + hex.EncodeToString(b))
	return ret
}

// DetermineVarIntDataLength extracts the payload length of a Bitcoin VarInt
func DetermineVarIntDataLength(flag uint8) uint8 {
	switch flag {
	case 0xfd:
		return 2
	case 0xfe:
		return 4
	case 0xff:
		return 8
	default:
		return 0
	}
}

// ReverseEndianness takes in a byte slice and returns a
// reversed endian byte slice.
func ReverseEndianness(b []byte) []byte {
	out := make([]byte, len(b), len(b))
	copy(out, b)

	for i := len(out)/2 - 1; i >= 0; i-- {
		opp := len(out) - 1 - i
		out[i], out[opp] = out[opp], out[i]
	}

	return out
}

// LastBytes returns the last num in from a byte array
func LastBytes(in []byte, num int) []byte {
	out := make([]byte, num)
	copy(out, in[len(in)-num:])
	return out
}

// Hash160 takes a byte slice and returns a hashed byte slice.
func Hash160(in []byte) []byte {
	sha := sha256.New()
	sha.Write(in)
	sum := sha.Sum(nil)

	r := ripemd160.New()
	r.Write(sum)
	return r.Sum(nil)
}

// Hash256 implements bitcoin's hash256 (double sha2)
func Hash256(in []byte) []byte {
	first := sha256.Sum256(in)
	second := sha256.Sum256(first[:])
	return second[:]
}

//
// Witness Input
//

// ExtractInputAtIndex parses the input vector and returns the vin at a specified index
func ExtractInputAtIndex(vin []byte, index uint8) []byte {
	var len uint
	offset := uint(1)

	for i := uint8(0); i <= index; i++ {
		remaining := vin[offset:]
		len = DetermineInputLength(remaining)
		if i != index {
			offset += len
		}
	}

	return vin[offset : offset+len]
}

// IsLegacyInput determines whether an input is legacy
func IsLegacyInput(input []byte) bool {
	return input[36] != 0
}

// DetermineInputLength gets the length of an input by parsing the scriptSigLen
func DetermineInputLength(input []byte) uint {
	dataLen, scriptSigLen := ExtractScriptSigLen(input)
	return 41 + dataLen + scriptSigLen
}

// ExtractSequenceLELegacy returns the LE sequence in from a tx input
// The sequence is a 4 byte little-endian number.
func ExtractSequenceLELegacy(input []byte) []byte {
	dataLen, scriptSigLen := ExtractScriptSigLen(input)
	length := 36 + 1 + dataLen + scriptSigLen
	return input[length : length+4]
}

// ExtractSequenceLegacy returns the integer sequence in from a tx input
func ExtractSequenceLegacy(input []byte) uint {
	return uint(binary.LittleEndian.Uint32(ExtractSequenceLELegacy(input)))
}

// ExtractScriptSig extracts the VarInt-prepended scriptSig from the input in a tx
func ExtractScriptSig(input []byte) []byte {
	dataLen, scriptSigLen := ExtractScriptSigLen(input)
	length := 1 + dataLen + scriptSigLen
	return input[36 : 36+length]
}

// ExtractScriptSigLen determines the length of a scriptSig in an input
func ExtractScriptSigLen(input []byte) (uint, uint) {
	varIntTag := input[36]
	varIntDataLen := DetermineVarIntDataLength(varIntTag)

	length := uint(varIntTag)
	if varIntDataLen != 0 {
		length = BytesToUint(ReverseEndianness(input[37 : 37+varIntDataLen]))
	}

	return uint(varIntDataLen), length
}

// ExtractSequenceLEWitness extracts the LE sequence bytes from a witness input
func ExtractSequenceLEWitness(input []byte) []byte {
	return input[37:41]
}

// ExtractSequenceWitness extracts the sequence integer from a witness input
func ExtractSequenceWitness(input []byte) uint {
	return BytesToUint(ExtractSequenceLEWitness(input))
}

// ExtractOutpoint returns the outpoint from the in input in a tx
// The outpoint is a 32 bit tx id with 4 byte index
func ExtractOutpoint(input []byte) []byte {
	return input[0:36]
}

// ExtractInputTxIDLE returns the LE tx input index from the input in a tx
func ExtractInputTxIdLE(input []byte) []byte {
	return input[0:32]
}

// ExtractTxID returns the input tx id from the input in a tx
// Returns the tx id as a big-endian []byte
func ExtractInputTxId(input []byte) []byte {
	return ReverseEndianness(input[0:32])
}

// ExtractTxIndexLE extracts the LE tx input index from the input in a tx
// Returns the tx index as a little endian []byte
func ExtractTxIndexLE(input []byte) []byte {
	return input[32:36]
}

// ExtractTxIndex extracts the tx input index from the input in a tx
func ExtractTxIndex(input []byte) uint {
	return BytesToUint(ReverseEndianness(ExtractTxIndexLE(input)))
}

//
// Output
//

// DetermineOutputLength returns the length of an output
func DetermineOutputLength(output []byte) (uint, error) {
	length := uint(output[8])
	if length > 0xfd {
		return 0, errors.New("Multi-byte VarInts not supported")
	}
	return length + uint(9), nil
}

// ExtractOutputAtIndex returns the output at a given index in the TxIns vector
func ExtractOutputAtIndex(vout []byte, index uint8) ([]byte, error) {
    var length uint
    var offset uint = 1

    for i := uint8(0); i <= index; i++ {
        remaining := vout[offset:]
        l, err := DetermineOutputLength(remaining)
        length = l
        if err != nil {
            return []byte{}, err
        }
        if i != index {
            offset += l
        }
    }
    output := vout[offset : offset+length]
    return output, nil
}

// ExtractOutputScriptLen extracts the output script length
func ExtractOutputScriptLen(output []byte) uint {
	return uint(output[8])
}

// ExtractValueLE extracts the value in from the output in a tx
// Returns a little endian []byte of the output value
func ExtractValueLE(output []byte) []byte {
	return output[:8]
}

// ExtractValue extracts the value from the output in a tx
func ExtractValue(output []byte) uint {
	return BytesToUint(ReverseEndianness(ExtractValueLE(output)))
}

// ExtractOpReturnData returns the value from the output in a tx
// Value is an 8byte little endian number
func ExtractOpReturnData(output []byte) ([]byte, error) {
	if output[9] != 0x6a {
		return nil, errors.New("Malformatted data. Must be an op return.")
	}

	dataLen := output[10]
	return output[11 : 11+dataLen], nil
}

// ExtractHash extracts the hash from the output script
// Returns the hash committed to by the pk_script
func ExtractHash(output []byte) ([]byte, error) {
	tag := output[8:11]

	/* Witness Case */
	if output[9] == 0 {
		length := ExtractOutputScriptLen(output) - 2
		if uint(output[10]) != length {
			return nil, errors.New("Maliciously formatted witness output")
		}
		return output[11 : 11+length], nil
	}

	/* P2PKH */
	if bytes.Equal(tag, []byte{0x19, 0x76, 0xa9}) {
		lastTwo := output[len(output)-2:]
		if output[11] != 0x14 || !bytes.Equal(lastTwo, []byte{0x88, 0xac}) {
			return nil, errors.New("Maliciously formatted p2pkh output")
		}
		return output[12:32], nil
	}

	/* P2SH */
	if bytes.Equal(tag, []byte{0x17, 0xa9, 0x14}) {
		if output[len(output)-1] != 0x87 {
			return nil, errors.New("Maliciously formatted p2sh output")
		}
		return output[11:31], nil
	}

	return nil, errors.New("Nonstandard, OP_RETURN, or malformatted output")
}

//
// Transaction
//

// ValidateVin checks that the vin passed up is properly formatted
func ValidateVin(vin []byte) bool {
	var offset uint = 1
	vLength := uint(len(vin))
	nIns := uint(vin[0])

	if nIns >= 0xfd || nIns == 0 {
		return false
	}

	for i := uint(0); i < nIns; i++ {
		offset += DetermineInputLength(vin[offset:])
		if offset > vLength {
			return false
		}
	}

	return offset == vLength
}

// ValidateVout checks that the vin passed up is properly formatted
func ValidateVout(vout []byte) bool {
	var offset uint = 1
	vLength := uint(len(vout))
	nOuts := uint(vout[0])

	if nOuts >= 0xfd || nOuts == 0 {
		return false
	}

	for i := uint(0); i < nOuts; i++ {
		output, _ := DetermineOutputLength(vout[offset:])
		offset += output
		if offset > vLength {
			return false
		}
	}

	return offset == vLength
}

//
// Block Header
//

// ExtractMerkleRootLE returns the transaction merkle root from a given block header
// The returned merkle root is little-endian
func ExtractMerkleRootLE(header []byte) []byte {
	return header[36:68]
}

// ExtractMerkleRootBE returns the transaction merkle root from a given block header
// The returned merkle root is big-endian
func ExtractMerkleRootBE(header []byte) []byte {
	return ReverseEndianness(ExtractMerkleRootLE(header))
}

// ExtractTarget returns the target from a given block hedaer
func ExtractTarget(header []byte) sdk.Uint {
	// nBits encoding. 3 byte mantissa, 1 byte exponent
	m := header[72:75]
	e := sdk.NewInt(int64(header[75]))

	mantissa := sdk.NewUintFromString("0x" + hex.EncodeToString(ReverseEndianness(m)))
	exponent := e.Sub(sdk.NewInt(3))

	// Have to convert to underlying big.Int as the sdk does not expose exponentiation
	base := big.NewInt(256)
	base.Exp(base, exponent.BigInt(), nil)

	exponentTerm := sdk.NewUintFromBigInt(base)

	return mantissa.Mul(exponentTerm)
}

// CalculateDifficulty calculates difficulty from the difficulty 1 target and current target
// Difficulty 1 is 0x1d00ffff on mainnet and testnet
// Difficulty 1 is a 256 bit number encoded as a 3-byte mantissa and 1 byte exponent
func CalculateDifficulty(target sdk.Uint) sdk.Uint {
	diffOneTarget := sdk.NewUintFromString("0xffff0000000000000000000000000000000000000000000000000000")
	return diffOneTarget.Quo(target)
}

// ExtractPrevBlockHashLE returns the previous block's hash from a block header
// Returns the hash as a little endian []byte
func ExtractPrevBlockHashLE(header []byte) []byte {
	return header[4:36]
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
	return header[68:72]
}

// ExtractTimestamp returns the timestamp from a block header as a uint
// Time is not 100% reliable
func ExtractTimestamp(header []byte) uint {
	return BytesToUint(ReverseEndianness(ExtractTimestampLE(header)))
}

// ExtractDifficulty calculates the difficulty of a header
func ExtractDifficulty(header []byte) sdk.Uint {
	return CalculateDifficulty(ExtractTarget(header))
}

func hash256MerkleStep(a []byte, b []byte) []byte {
	c := []byte{}
	c = append(c, a...)
	c = append(c, b...)
	return Hash256(c)
}

// VerifyHash256Merkle checks a merkle inclusion proof's validity
func VerifyHash256Merkle(proof []byte, index uint) bool {
	idx := index
	proofLength := len(proof)

	if proofLength%32 != 0 {
		return false
	}

	if proofLength == 32 {
		return true
	}

	if proofLength == 64 {
		return false
	}

	root := proof[proofLength-32:]
	current := proof[:32]
	numSteps := (proofLength / 32) - 1

	for i := 1; i < numSteps; i++ {
		next := proof[i*32 : i*32+32]
		if idx%2 == 1 {
			current = hash256MerkleStep(next, current)
		} else {
			current = hash256MerkleStep(current, next)
		}
		idx >>= 1
	}

	return bytes.Equal(current, root)
}

// RetargetAlgorithm performs Bitcoin consensus retargets
func RetargetAlgorithm(
	previousTarget sdk.Uint,
	firstTimestamp uint,
	secondTimestamp uint) sdk.Uint {

	retargetPeriod := sdk.NewUint(1209600)
	lowerBound := retargetPeriod.Quo(sdk.NewUint(4))
	upperBound := retargetPeriod.Mul(sdk.NewUint(4))

	first := sdk.NewUint(uint64(firstTimestamp))
	second := sdk.NewUint(uint64(secondTimestamp))

	elapsedTime := second.Sub(first)

	if elapsedTime.GT(upperBound) {
		elapsedTime = upperBound
	}
	if elapsedTime.LT(lowerBound) {
		elapsedTime = lowerBound
	}

	return previousTarget.Mul(elapsedTime).Quo(retargetPeriod)
}
