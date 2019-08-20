package btcspv

import (
// 	"bytes"
// 	"crypto/sha256"
// 	"encoding/binary"
// 	"encoding/hex"
// 	"errors"
// 	"math/big"
	"fmt"

// 	sdk "github.com/cosmos/cosmos-sdk/types"
// 	"golang.org/x/crypto/ripemd160"
)

func Prove(txid []byte, merkleRoot []byte, intermediateNodes []byte, index uint) bool {
	// Shortcut the empty-block case
	fmt.Println(txid, merkleRoot)
	if txid == merkleRoot && index == 0 && len(intermediateNodes) == 0 {
		return true
	}

	proof := []byte{}
	proof = append(proof, txid...)
	proof = append(proof, intermediateNodes...)
	proof = append(proof, merkleRoot...)

	return VerifyHash256Merkle(proof, index)
}

func calculateTxId(version, vin, vout, locktime []byte) []byte {
	txid := []byte{}
	txid = append(txid, version...)
	txid = append(txid, vin...)
	txid = append(txid, vout...)
	txid = append(txid, locktime...)
	return Hash256(txid)
}

// func parseInput(input []byte) (uint, []byte, uint, uint) {
// 	// NB: If the scriptsig is exactly 00, we are WITNESS.
// 	// Otherwise we are Compatibility or LEGACY
// 	// let sequence;
// 	// let witnessTag;
// 	// let inputType;

// 	if input[36] != 0 {
// 		sequence := ExtractSequenceLegacy(input)
// 		witnessTag := input[36:39]
// 	}
	// if (input[36] !== 0) {
	//   sequence = BTCUtils.extractSequenceLegacy(input);
	//   witnessTag = utils.safeSlice(input, 36, 39);

	//   if (utils.typedArraysAreEqual(witnessTag, new Uint8Array([0x22, 0x00, 0x20]))
	//       || utils.typedArraysAreEqual(witnessTag, new Uint8Array([0x16, 0x00, 0x14]))) {
	//     inputType = utils.INPUT_TYPES.COMPATIBILITY;
	//   } else {
	//     inputType = utils.INPUT_TYPES.LEGACY;
	//   }
	// } else {
	//   sequence = BTCUtils.extractSequenceWitness(input);
	//   inputType = utils.INPUT_TYPES.WITNESS;
	// }

	// const inputId = BTCUtils.extractInputTxId(input);
	// const inputIndex = BTCUtils.extractTxIndex(input);

	// return {
	//   sequence, inputId, inputIndex, inputType
	// };
// }

// func parseOutput() {

// }

// func parseHeader() {

// }

// func validateHeaderWork() {

// }

// func validateHeaderPrevHash() {

// }

// func validateHeaderChain() {

// }
