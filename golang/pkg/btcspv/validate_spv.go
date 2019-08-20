package btcspv

import (
	"bytes"
	"errors"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

type INPUT_TYPE int

const (
	INPUT_NONE    INPUT_TYPE = 0
	LEGACY        INPUT_TYPE = 1
	COMPATIBILITY INPUT_TYPE = 2
	WITNESS       INPUT_TYPE = 3
)

type OUTPUT_TYPE int

const (
	OUTPUT_NONE OUTPUT_TYPE = 0
	WPKH        OUTPUT_TYPE = 1
	WSH         OUTPUT_TYPE = 2
	OP_RETURN   OUTPUT_TYPE = 3
	PKH         OUTPUT_TYPE = 4
	SH          OUTPUT_TYPE = 5
	NONSTANDARD OUTPUT_TYPE = 6
)

// Validates a tx inclusion in the block
func prove(txid []byte, merkleRoot []byte, intermediateNodes []byte, index uint) bool {
	// Shortcut the empty-block case
	if bytes.Equal(txid, merkleRoot) && index == 0 && len(intermediateNodes) == 0 {
		return true
	}

	proof := []byte{}
	proof = append(proof, txid...)
	proof = append(proof, intermediateNodes...)
	proof = append(proof, merkleRoot...)

	return VerifyHash256Merkle(proof, index)
}

// Hashes transaction to get txid
func CalculateTxId(version, vin, vout, locktime []byte) []byte {
	txid := []byte{}
	txid = append(txid, version...)
	txid = append(txid, vin...)
	txid = append(txid, vout...)
	txid = append(txid, locktime...)
	return Hash256(txid)
}

// Parses a tx input from raw input bytes
func ParseInput(input []byte) (uint, []byte, uint, uint) {
	// NB: If the scriptsig is exactly 00, we are WITNESS.
	// Otherwise we are Compatibility or LEGACY
	var sequence uint
	var witnessTag []byte
	var inputType uint

	if input[36] != 0 {
		sequence = ExtractSequenceLegacy(input)
		witnessTag = input[36:39]

		if bytes.Equal(witnessTag, []byte{34, 0, 32}) || bytes.Equal(witnessTag, []byte{32, 0, 20}) {
			inputType = uint(COMPATIBILITY)
		} else {
			inputType = uint(LEGACY)
		}
	} else {
		sequence = ExtractSequenceWitness(input)
		inputType = uint(WITNESS)
	}

	inputId := ExtractInputTxId(input)
	inputIndex := ExtractTxIndex(input)

	return sequence, inputId, inputIndex, inputType
}

// Parses a tx output from raw output bytes
func ParseOutput(output []byte) (uint, uint, []byte) {
	value := ExtractValue(output)
	var outputType uint
	var payload []byte

	if output[9] == 0x6a {
		outputType = uint(OP_RETURN)
		payload, _ = ExtractOpReturnData(output)
	} else {
		prefixHash := output[8:10]
		if bytes.Equal(prefixHash, []byte{34, 0}) {
			outputType = uint(WSH)
			payload = output[11:43]
		} else if bytes.Equal(prefixHash, []byte{22, 0}) {
			outputType = uint(WPKH)
			payload = output[11:31]
		} else if bytes.Equal(prefixHash, []byte{25, 118}) {
			outputType = uint(PKH)
			payload = output[12:32]
		} else if bytes.Equal(prefixHash, []byte{23, 169}) {
			outputType = uint(SH)
			payload = output[11:31]
		} else {
			outputType = uint(NONSTANDARD)
			payload = []byte{}
		}
	}

	return value, outputType, payload
}

// Parses a block header struct from a bytestring
func ParseHeader(header []byte) ([]byte, uint, []byte, []byte, uint, sdk.Uint, uint, error) {
	if len(header) != 80 {
		return nil, 0, nil, nil, 0, sdk.NewUint(0), 0, errors.New("Malformatted header. Must be exactly 80 bytes.")
	}

	digest := ReverseEndianness(Hash256(header))
	version := BytesToUint(ReverseEndianness(header[0:4]))
	prevHash := ExtractPrevBlockHashLE(header)
	merkleRoot := ExtractMerkleRootLE(header)
	timestamp := ExtractTimestamp(header)
	target := ExtractTarget(header)
	nonce := BytesToUint(ReverseEndianness(header[76:80]))

	return digest, version, prevHash, merkleRoot, timestamp, target, nonce, nil
}

// Checks validity of header work
func ValidateHeaderWork(digest []byte, target sdk.Uint) bool {
	if bytes.Equal(digest, bytes.Repeat([]byte("0x00"), 32)) {
		return false
	}
	return BytesToBigInt(digest).LT(target)
}

// Checks validity of header chain
func ValidateHeaderPrevHash(header, prevHeaderDigest []byte) bool {
	// Extract prevHash of current header
	prevHash := ExtractPrevBlockHashLE(header)

	// Compare prevHash of current header to previous header's digest
	if !bytes.Equal(prevHash, prevHeaderDigest) {
		return false
	}

	return true
}

// Checks validity of header chain
func ValidateHeaderChain(headers []byte) (sdk.Uint, error) {
	// // Check header chain length

	if len(headers)%80 != 0 {
		return sdk.NewUint(0), errors.New("Header bytes not multiple of 80.")
	}

	var digest []byte
	totalDifficulty := sdk.NewUint(0)

	for i := 0; i < len(headers); i++ {
		start := i * 80
		header := headers[start : start+80]

		// After the first header, check that headers are in a chain
		if i != 0 {
			if !ValidateHeaderPrevHash(header, digest) {
				return sdk.NewUint(0), errors.New("Header bytes not a valid chain.")
			}
		}

		// ith header target
		target := ExtractTarget(header)

		// Require that the header has sufficient work
		digest = Hash256(header)
		if !ValidateHeaderWork(ReverseEndianness(digest), target) {
			return sdk.NewUint(0), errors.New("Header does not meet its own difficulty target.")
		}

		totalDifficulty = totalDifficulty.Add(CalculateDifficulty(target))
	}
	return totalDifficulty, nil
}
