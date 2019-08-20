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

func prove(txid []byte, merkleRoot []byte, intermediateNodes []byte, index uint) bool {
	// Shortcut the empty-block case
	if txid == merkleRoot && index == 0 && intermediateNodes.length == 0 {
		return true
	}

	proof := append(txid, intermediateNodes, merkleRoot)

	return VerifyHash256Merkle(proof, index)
}

// func calculateTxId() {

// }

// func parseInput() {

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