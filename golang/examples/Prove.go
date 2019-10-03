package main

import (
	"fmt"

	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

// Prove checks the validity of a merkle proof
func Prove(version []byte, vin []byte, vout []byte, locktime []byte, merkleRoot []byte, intermediateNodes []byte, index uint) string {
	// Calculate the tx id
	txid := btcspv.CalculateTxID(version, vin, vout, locktime)

	// Check if the merkle proof is valid using Prove
	valid := btcspv.Prove(txid, merkleRoot, intermediateNodes, index)

	// Returns string stating if proof is valid or not
	return fmt.Sprintf("\nValid proof: %t\n", valid)
}
