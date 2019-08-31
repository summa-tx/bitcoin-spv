package btcspv

import (
	"bytes"
	"errors"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// InputType an enum of types of bitcoin inputs
type InputType int

// possible input types
const (
	INPUT_NONE    InputType = 0
	LEGACY        InputType = 1
	COMPATIBILITY InputType = 2
	WITNESS       InputType = 3
)

// OutputType an enum of types of bitcoin outputs
type OutputType int

// possible output types
const (
	OUTPUT_NONE OutputType = 0
	WPKH        OutputType = 1
	WSH         OutputType = 2
	OP_RETURN   OutputType = 3
	PKH         OutputType = 4
	SH          OutputType = 5
	NONSTANDARD OutputType = 6
)

// Prove checks the validity of a merkle proof
func Prove(txid []byte, merkleRoot []byte, intermediateNodes []byte, index uint) bool {
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

// CalculateTxID hashes transaction to get txid
func CalculateTxID(version, vin, vout, locktime []byte) []byte {
	txid := []byte{}
	txid = append(txid, version...)
	txid = append(txid, vin...)
	txid = append(txid, vout...)
	txid = append(txid, locktime...)
	return Hash256(txid)
}

// ParseInput returns human-readable information about an input
func ParseInput(input []byte) (uint, []byte, uint, InputType) {
	// NB: If the scriptsig is exactly 00, we are WITNESS.
	// Otherwise we are Compatibility or LEGACY
	var sequence uint
	var witnessTag []byte
	var inputType InputType

	if input[36] != 0 {
		sequence = ExtractSequenceLegacy(input)
		witnessTag = input[36:39]

		if bytes.Equal(witnessTag, []byte{34, 0, 32}) || bytes.Equal(witnessTag, []byte{22, 0, 20}) {
			inputType = COMPATIBILITY
		} else {
			inputType = LEGACY
		}
	} else {
		sequence = ExtractSequenceWitness(input)
		inputType = WITNESS
	}

	inputID := ExtractInputTxID(input)
	inputIndex := ExtractTxIndex(input)

	return sequence, inputID, inputIndex, inputType
}

// ParseOutput extracts human-readable information from an output
func ParseOutput(output []byte) (uint, OutputType, []byte) {
	value := ExtractValue(output)
	var outputType OutputType
	var payload []byte

	if output[9] == 0x6a {
		outputType = OP_RETURN
		payload, _ = ExtractOpReturnData(output)
	} else {
		prefixHash := output[8:10]
		if bytes.Equal(prefixHash, []byte{34, 0}) {
			outputType = WSH
			payload = output[11:43]
		} else if bytes.Equal(prefixHash, []byte{22, 0}) {
			outputType = WPKH
			payload = output[11:31]
		} else if bytes.Equal(prefixHash, []byte{25, 118}) {
			outputType = PKH
			payload = output[12:32]
		} else if bytes.Equal(prefixHash, []byte{23, 169}) {
			outputType = SH
			payload = output[11:31]
		} else {
			outputType = NONSTANDARD
			payload = []byte{}
		}
	}

	return value, outputType, payload
}

// ParseHeader parses a block header struct from a bytestring
func ParseHeader(header []byte) ([]byte, uint, []byte, []byte, uint, sdk.Uint, uint, error) {
	if len(header) != 80 {
		return nil, 0, nil, nil, 0, sdk.NewUint(0), 0, errors.New("Malformatted header. Must be exactly 80 bytes")
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

// ValidateHeaderWork checks validity of header work
func ValidateHeaderWork(digest []byte, target sdk.Uint) bool {
	if bytes.Equal(digest, bytes.Repeat([]byte{0}, 32)) {
		return false
	}
	return BytesToBigUint(digest).LT(target)
}

// ValidateHeaderPrevHash checks validity of header chain
func ValidateHeaderPrevHash(header, prevHeaderDigest []byte) bool {
	// Extract prevHash of current header
	prevHash := ExtractPrevBlockHashLE(header)

	// Compare prevHash of current header to previous header's digest
	if !bytes.Equal(prevHash, prevHeaderDigest) {
		return false
	}

	return true
}

// ValidateHeaderChain checks validity of header chain
func ValidateHeaderChain(headers []byte) (sdk.Uint, error) {
	// Check header chain length
	if len(headers)%80 != 0 {
		return sdk.ZeroUint(), errors.New("Header bytes not multiple of 80")
	}

	var digest []byte
	totalDifficulty := sdk.ZeroUint()

	for i := 0; i < len(headers)/80; i++ {
		start := i * 80
		header := headers[start : start+80]

		// After the first header, check that headers are in a chain
		if i != 0 {
			if !ValidateHeaderPrevHash(header, digest) {
				return sdk.ZeroUint(), errors.New("Header bytes not a valid chain")
			}
		}

		// ith header target
		target := ExtractTarget(header)

		// Require that the header has sufficient work
		digest = Hash256(header)
		if !ValidateHeaderWork(ReverseEndianness(digest), target) {
			return sdk.ZeroUint(), errors.New("Header does not meet its own difficulty target")
		}

		totalDifficulty = totalDifficulty.Add(CalculateDifficulty(target))
	}
	return totalDifficulty, nil
}
