package btcspv

<<<<<<< HEAD
import (
	"bytes"

	// "fmt"

	// "github.com/stretchr/testify/suite"
	// "crypto/sha256"
	// "encoding/binary"
	// "encoding/hex"
	// "errors"
	// "math/big"
	// sdk "github.com/cosmos/cosmos-sdk/types"
	// "golang.org/x/crypto/ripemd160"
=======
import "bytes"

// import (
// 	"bytes"
// 	// "crypto/sha256"
// 	// "encoding/binary"
// 	// "encoding/hex"
// 	// "errors"
// 	// "math/big"
// 	// sdk "github.com/cosmos/cosmos-sdk/types"
// 	// "golang.org/x/crypto/ripemd160"
// )

type INPUT_TYPE int

const (
	NONE          INPUT_TYPE = 0
	LEGACY        INPUT_TYPE = 1
	COMPATIBILITY INPUT_TYPE = 2
	WITNESS       INPUT_TYPE = 3
>>>>>>> cb3f293c723d81924d6dc3153dd8686cc64c8dee
)

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

// func ParseOutput(output []byte) (uint, uint, []byte) {
// 	value := ExtractValue(output)
// 	var outputType int
// 	var payload []byte

// 	// if (output[9] === 0x6a) {
// 	//   // OP_RETURN
// 	//   outputType = utils.OUTPUT_TYPES.OP_RETURN;
// 	//   payload = BTCUtils.extractOpReturnData(output);
// 	// } else {
// 	//   const prefixHash = utils.safeSlice(output, 8, 10);
// 	//   if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([0x22, 0x00]))) {
// 	//     // P2WSH
// 	//     outputType = utils.OUTPUT_TYPES.WSH;
// 	//     payload = utils.safeSlice(output, 11, 43);
// 	//   } else if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([0x16, 0x00]))) {
// 	//     // P2WPKH
// 	//     outputType = utils.OUTPUT_TYPES.WPKH;
// 	//     payload = utils.safeSlice(output, 11, 31);
// 	//   } else if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([0x19, 0x76]))) {
// 	//     // PKH
// 	//     outputType = utils.OUTPUT_TYPES.PKH;
// 	//     payload = utils.safeSlice(output, 12, 32);
// 	//   } else if (utils.typedArraysAreEqual(prefixHash, new Uint8Array([0x17, 0xa9]))) {
// 	//     // SH
// 	//     outputType = utils.OUTPUT_TYPES.SH;
// 	//     payload = utils.safeSlice(output, 11, 31);
// 	//   } else {
// 	//     outputType = utils.OUTPUT_TYPES.NONSTANDARD;
// 	//     payload = new Uint8Array([]);
// 	//   }
// 	// }

// 	// return { value, outputType, payload };
// }

// func ParseHeader() {

// }

// func ValidateHeaderWork() {

// }

// func ValidateHeaderPrevHash() {

// }

// func ValidateHeaderChain() {

// }
