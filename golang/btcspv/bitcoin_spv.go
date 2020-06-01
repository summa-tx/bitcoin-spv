package btcspv

import (
	"bytes"
	"crypto/sha256"
	"encoding/binary"
	"errors"
	"math/big"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"golang.org/x/crypto/ripemd160"
)

// BytesToUint converts 1, 2, 3, or 4-byte numbers to uints
func BytesToUint(b []byte) uint {
	total := uint(0)
	length := uint(len(b))

	for i := uint(0); i < length; i++ {
		total += uint(b[i]) << ((length - i - 1) * 8)
	}

	return total
}

// BytesToBigUint converts a bytestring of up to 32 bytes to a cosmos sdk uint
func BytesToBigUint(b []byte) sdk.Uint {
	myInt := new(big.Int).SetBytes(b)
	return sdk.NewUintFromBigInt(myInt)
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

// ParseVarInt parses the length and value of a VarInt payload
func ParseVarInt(b []byte) (uint64, uint64, error) {
	dataLength := uint64(DetermineVarIntDataLength(b[0]))
	if dataLength == 0 {
		return 0, uint64(b[0]), nil
	}
	if uint64(len(b)) < 1+dataLength {
		return 0, 0, errors.New("Read overrun during VarInt parsing")
	}

	number := BytesToUint(ReverseEndianness(b[1 : 1+dataLength : 1+dataLength]))

	return dataLength, uint64(number), nil
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

// ReverseHash256Endianness returns a new digest with opposite byteorder
func ReverseHash256Endianness(h Hash256Digest) Hash256Digest {
	reversed, _ := NewHash256Digest(ReverseEndianness(h[:]))
	return reversed
}

// LastBytes returns the last num in from a byte array
func LastBytes(in []byte, num int) []byte {
	out := make([]byte, num)
	copy(out, in[len(in)-num:])
	return out
}

// Hash160 takes a byte slice and returns a hashed byte slice.
func Hash160(in []byte) Hash160Digest {
	sha := sha256.New()
	sha.Write(in)
	sum := sha.Sum(nil)

	r := ripemd160.New()
	r.Write(sum)

	digest, _ := NewHash160Digest(r.Sum(nil))
	return digest
}

// Hash256 implements bitcoin's hash256 (double sha2)
func Hash256(in []byte) Hash256Digest {
	first := sha256.Sum256(in)
	second := sha256.Sum256(first[:])
	return Hash256Digest(second)
}

//
// Witness Input
//

// ExtractInputAtIndex parses the input vector and returns the vin at a specified index
func ExtractInputAtIndex(vin []byte, index uint) ([]byte, error) {
	dataLength, nIns, err := ParseVarInt(vin)
	if err != nil {
		return []byte{}, err
	}
	if uint64(index) >= nIns {
		return []byte{}, errors.New("Vin read overrun")
	}

	var length uint
	var offset = 1 + uint(dataLength)
	var remaining []byte

	for i := uint(0); i < index; i++ {
		remaining = vin[offset:]

		l, err := DetermineInputLength(remaining)
		if err != nil {
			return []byte{}, errors.New("Bad VarInt in scriptSig")
		}

		length = uint(l)
		if i != index {
			offset += length
		}
	}

	remaining = vin[offset:]
	l, err := DetermineInputLength(remaining)
	if err != nil {
		return []byte{}, errors.New("Bad VarInt in scriptSig")
	}
	if offset+uint(l) > uint(len(vin)) {
		return []byte{}, errors.New("Read overrun when parsing vin")
	}

	end := offset + uint(l)
	output := vin[offset:end:end]
	return output, nil
}

// IsLegacyInput determines whether an input is legacy
func IsLegacyInput(input []byte) bool {
	return input[36] != 0
}

// ExtractScriptSigLen determines the length of a scriptSig in an input
func ExtractScriptSigLen(input []byte) (uint64, uint64, error) {
	if len(input) < 37 {
		return 0, 0, errors.New("Read overrun")
	}

	return ParseVarInt(input[36:])
}

// DetermineInputLength gets the length of an input by parsing the scriptSigLength
func DetermineInputLength(input []byte) (uint64, error) {
	dataLength, scriptSigLength, err := ExtractScriptSigLen(input)
	if err != nil {
		return 0, err
	}

	return 41 + dataLength + scriptSigLength, nil
}

// ExtractSequenceLELegacy returns the LE sequence in from a tx input
// The sequence is a 4 byte little-endian number.
func ExtractSequenceLELegacy(input []byte) ([]byte, error) {
	dataLength, scriptSigLength, err := ExtractScriptSigLen(input)
	if err != nil {
		return []byte{}, err
	}

	offset := 36 + 1 + dataLength + scriptSigLength
	end := offset + 4
	return input[offset:end:end], nil
}

// ExtractSequenceLegacy returns the integer sequence in from a tx input
func ExtractSequenceLegacy(input []byte) (uint32, error) {
	seqBytes, err := ExtractSequenceLELegacy(input)
	if err != nil {
		return 0, err
	}
	return binary.LittleEndian.Uint32(seqBytes), nil
}

// ExtractScriptSig extracts the VarInt-prepended scriptSig from the input in a tx
func ExtractScriptSig(input []byte) ([]byte, error) {
	dataLength, scriptSigLength, err := ExtractScriptSigLen(input)
	if err != nil {
		return []byte{}, err
	}
	length := 1 + dataLength + scriptSigLength
	end := 36 + length
	return input[36:end:end], nil
}

// ExtractSequenceLEWitness extracts the LE sequence bytes from a witness input
func ExtractSequenceLEWitness(input []byte) []byte {
	return input[37:41:41]
}

// ExtractSequenceWitness extracts the sequence integer from a witness input
func ExtractSequenceWitness(input []byte) uint32 {
	return uint32(BytesToUint(ExtractSequenceLEWitness(input)))
}

// ExtractOutpoint returns the outpoint from the in input in a tx
// The outpoint is a 32 bit tx id with 4 byte index
func ExtractOutpoint(input []byte) []byte {
	return input[0:36:36]
}

// ExtractInputTxIDLE returns the LE tx input index from the input in a tx
func ExtractInputTxIDLE(input []byte) Hash256Digest {
	res, _ := NewHash256Digest(input[0:32:32])
	return res
}

// ExtractTxIndexLE extracts the LE tx input index from the input in a tx
// Returns the tx index as a little endian []byte
func ExtractTxIndexLE(input []byte) []byte {
	return input[32:36:36]
}

// ExtractTxIndex extracts the tx input index from the input in a tx
func ExtractTxIndex(input []byte) uint {
	return BytesToUint(ReverseEndianness(ExtractTxIndexLE(input)))
}

//
// Output
//

// DetermineOutputLength returns the length of an output
func DetermineOutputLength(output []byte) (uint64, error) {
	if len(output) < 9 {
		return 0, errors.New("Read overrun")
	}

	dataLength, scriptPubkeyLength, err := ParseVarInt(output[8:])
	if err != nil {
		return 0, err
	}

	return (8 + 1 + dataLength + scriptPubkeyLength), nil
}

// ExtractOutputAtIndex returns the output at a given index in the TxIns vector
func ExtractOutputAtIndex(vout []byte, index uint) ([]byte, error) {
	dataLength, nOuts, err := ParseVarInt(vout)
	if err != nil {
		return []byte{}, err
	}
	if uint64(index) >= nOuts {
		return []byte{}, errors.New("Vout read overrun")
	}

	var length uint
	var offset = 1 + uint(dataLength)
	var remaining []byte

	for i := uint(0); i < index; i++ {
		remaining = vout[offset:]
		l, err := DetermineOutputLength(remaining)
		if err != nil {
			return []byte{}, errors.New("Bad VarInt in scriptPubkey")
		}

		length = uint(l)
		if i != index {
			offset += length
		}
	}

	remaining = vout[offset:]
	l, err := DetermineOutputLength(remaining)
	if err != nil {
		return []byte{}, errors.New("Bad VarInt in scriptPubkey")
	}
	if offset+uint(l) > uint(len(vout)) {
		return []byte{}, errors.New("Read overrun when parsing vout")
	}

	end := offset + uint(l)
	output := vout[offset:end:end]
	return output, nil
}

// ExtractValueLE extracts the value in from the output in a tx
// Returns a little endian []byte of the output value
func ExtractValueLE(output []byte) []byte {
	return output[:8:8]
}

// ExtractValue extracts the value from the output in a tx
func ExtractValue(output []byte) uint {
	return BytesToUint(ReverseEndianness(ExtractValueLE(output)))
}

// ExtractOpReturnData returns the value from the output in a tx
// Value is an 8byte little endian number
func ExtractOpReturnData(output []byte) ([]byte, error) {
	if output[9] != 0x6a {
		return nil, errors.New("Not an op return")
	}

	dataLength := int(output[10])
	if dataLength+8+3 > len(output) {
		return nil, errors.New("Malformatted data. Read overrun")
	}

	end := 11 + dataLength
	return output[11:end:end], nil
}

// ExtractHash extracts the hash from the output script
// Returns the hash committed to by the pk_script
func ExtractHash(output []byte) ([]byte, error) {
	if uint(output[8] + 9) != uint(len(output)) {
		return nil, errors.New("Reported length mismatch")
	}

	tag := output[8:11:11]

	/* Witness Case */
	if output[9] == 0 {
		length := uint(output[8]) - 2
		if uint(output[10]) != length || (output[10] != 0x14 && output[10] != 0x20) {
			return nil, errors.New("Maliciously formatted witness output")
		}

		end := 11 + length
		return output[11:end:end], nil
	}

	/* P2PKH */
	if bytes.Equal(tag, []byte{0x19, 0x76, 0xa9}) {
		lastTwo := output[len(output)-2:]
		if output[11] != 0x14 || !bytes.Equal(lastTwo, []byte{0x88, 0xac}) {
			return nil, errors.New("Maliciously formatted p2pkh output")
		}
		return output[12:32:32], nil
	}

	/* P2SH */
	if bytes.Equal(tag, []byte{0x17, 0xa9, 0x14}) {
		if output[len(output)-1] != 0x87 {
			return nil, errors.New("Maliciously formatted p2sh output")
		}
		return output[11:31:31], nil
	}

	return nil, errors.New("Nonstandard, OP_RETURN, or malformatted output")
}

//
// Transaction
//

// ValidateVin checks that the vin passed up is properly formatted
func ValidateVin(vin []byte) bool {
	vinLength := uint64(len(vin))

	dataLength, nIns, err := ParseVarInt(vin)
	if nIns == 0 || err != nil {
		return false
	}

	offset := 1 + dataLength

	for i := uint64(0); i < nIns; i++ {
		if offset >= vinLength {
			return false
		}

		length, err := DetermineInputLength(vin[offset:])
		if err != nil {
			return false
		}
		offset += length
	}

	return offset == vinLength
}

// ValidateVout checks that the vin passed up is properly formatted
func ValidateVout(vout []byte) bool {
	voutLength := uint64(len(vout))

	dataLength, nOuts, err := ParseVarInt(vout)
	if nOuts > 0xfc || err != nil {
		return false
	}

	offset := 1 + dataLength

	for i := uint64(0); i < nOuts; i++ {
		length, err := DetermineOutputLength(vout[offset:])
		if err != nil {
			return false
		}
		offset += length
		if offset > voutLength {
			return false
		}
	}

	return offset == voutLength
}

//
// Block Header
//

// ExtractMerkleRootLE returns the transaction merkle root from a given block header
// The returned merkle root is little-endian
func ExtractMerkleRootLE(header RawHeader) Hash256Digest {
	res, _ := NewHash256Digest(header[36:68:68])
	return res
}

// ExtractTarget returns the target from a given block hedaer
func ExtractTarget(header RawHeader) sdk.Uint {
	// nBits encoding. 3 byte mantissa, 1 byte exponent
	m := header[72:75:75]
	e := sdk.NewInt(int64(header[75]))

	// hacks
	mantissa := BytesToBigUint(ReverseEndianness(m))
	exponent := e.SubRaw(3)

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
func ExtractPrevBlockHashLE(header RawHeader) Hash256Digest {
	res, _ := NewHash256Digest(header[4:36:36])
	return res
}

// ExtractTimestampLE returns the timestamp from a block header
// It returns the timestamp as a little endian []byte
// Time is not 100% reliable
func ExtractTimestampLE(header RawHeader) []byte {
	return header[68:72:72]
}

// ExtractTimestamp returns the timestamp from a block header as a uint
// Time is not 100% reliable
func ExtractTimestamp(header RawHeader) uint {
	return BytesToUint(ReverseEndianness(ExtractTimestampLE(header)))
}

// ExtractDifficulty calculates the difficulty of a header
func ExtractDifficulty(header RawHeader) sdk.Uint {
	return CalculateDifficulty(ExtractTarget(header))
}

// Hash256MerkleStep concatenates and hashes two inputs for merkle proving
func Hash256MerkleStep(a []byte, b []byte) Hash256Digest {
	c := []byte{}
	c = append(c, a...)
	c = append(c, b...)
	return Hash256(c)
}

// VerifyHash256Merkle checks a merkle inclusion proof's validity.
// Note that `index` is not a reliable indicator of location within a block.
func VerifyHash256Merkle(proof []byte, index uint) bool {
	var current Hash256Digest
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

	cur := proof[:32:32]
	copy(current[:], cur)

	numSteps := (proofLength / 32) - 1

	for i := 1; i < numSteps; i++ {
		start := i * 32
		end := i*32 + 32
		next := proof[start:end:end]
		if idx%2 == 1 {
			current = Hash256MerkleStep(next, current[:])
		} else {
			current = Hash256MerkleStep(current[:], next)
		}
		idx >>= 1
	}

	return bytes.Equal(current[:], root)
}

// RetargetAlgorithm performs Bitcoin consensus retargets
func RetargetAlgorithm(
	previousTarget sdk.Uint,
	firstTimestamp uint,
	secondTimestamp uint) sdk.Uint {

	retargetPeriod := sdk.NewUint(1209600)
	lowerBound := retargetPeriod.QuoUint64(4)
	upperBound := retargetPeriod.MulUint64(4)

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
