package btcspv

import "bytes"

import (
	"bytes"

	"github.com/stretchr/testify/suite"
	// "crypto/sha256"
	// "encoding/binary"
	// "encoding/hex"
	// "errors"
	// "math/big"
	// sdk "github.com/cosmos/cosmos-sdk/types"
	// "golang.org/x/crypto/ripemd160"
)

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

func CalculateTxId(version, vin, vout, locktime []byte) []byte {
	txid := []byte{}
	txid = append(txid, version...)
	txid = append(txid, vin...)
	txid = append(txid, vout...)
	txid = append(txid, locktime...)
	return Hash256(txid)
}

func ParseInput(input []byte) (uint, []byte, uint, uint) {
	// NB: If the scriptsig is exactly 00, we are WITNESS.
	// Otherwise we are Compatibility or LEGACY
	var sequence uint
	var witnessTag []byte
	var inputType uint
	inputTypes := suite.Fixtures["INPUT_TYPES"]

	if input[36] != 0 {
		sequence = ExtractSequenceLegacy(input)
		witnessTag = input[36:39]

		if bytes.Equal(witnessTag, []byte{34, 0, 32}) || bytes.Equal(witnessTag, []byte{32, 0, 20}) {
			inputType = INPUT_TYPES.COMPATIBILITY
		} else {
			inputType = INPUT_TYPES.LEGACY
		}
	} else {
		sequence = ExtractSequenceWitness(input)
		inputType = INPUT_TYPES.WITNESS
	}

	inputId := ExtractInputTxId(input)
	inputIndex := ExtractTxIndex(input)

	return sequence, inputId, inputIndex, inputType
}

// func ParseOutput() {

// }

// func ParseHeader() {

// }

// func ValidateHeaderWork() {

// }

// func ValidateHeaderPrevHash() {

// }

// func ValidateHeaderChain() {

// }
