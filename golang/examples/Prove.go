package main

import (
	"errors"

	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

func Prove(version []byte, vin []byte, vout []byte, locktime []byte, merkleRoot []byte, intermediateNodes []byte, index uint) (string, error) {
	// Calculate the tx id
	txid := btcspv.CalculateTxID(version, vin, vout, locktime)

	// Check if the merkle proof is valid using Prove
	valid := btcspv.Prove(txid, merkleRoot, intermediateNodes, index)

	// If it is valid, return true.  If not, return false and throw an error
	if valid {
		return "true", nil
	} else {
		return "false", errors.New("Not a valid merkle proof")
	}
}
