package main

import (
	"encoding/hex"
	"fmt"
	"strconv"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"
	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

func prettifyHeaderData(num uint, digest []byte, version uint, prevHash []byte, merkleRoot []byte, timestamp uint, target sdk.Uint, nonce uint) string {
	// Convert byte arrays to readable hex strings
	digestStr := hex.EncodeToString(digest)
	prevHashStr := hex.EncodeToString(prevHash)
	merkleRootStr := hex.EncodeToString(merkleRoot)

	// Convert timestamp to readable time
	unixIntValue, err := strconv.ParseInt(string(timestamp), 10, 64)
	if err != nil {
		fmt.Println(err)
	}
	timeStr := time.Unix(unixIntValue, 0)

	// Return data in a formatted string
	dataStr := fmt.Sprintf("\nHeader #%d:\n  Digest: %s,\n  Version: %d,\n  Prev Hash: %s,\n  Merkle Root: %s,\n  Time Stamp: %s,\n  Target: %d,\n  Nonce: %d\n", num, digestStr, version, prevHashStr, merkleRootStr, timeStr, target, nonce)
	return dataStr
}

func ParseHeader(header []byte) string {
	// Get information about the header using ParseHeader
	digest, version, prevHash, merkleRoot, timestamp, target, nonce, err := btcspv.ParseHeader(header)
	// Check for errors
	if err != nil {
		return "Error parsing header"
	}

	// Format data using prettifyHeaderData
	headerData := prettifyHeaderData(0, digest, version, prevHash, merkleRoot, timestamp, target, nonce)
	return headerData
}

func ValidateHeaderChain(headers []byte) string {
	// Get the total difficulty using ValidateHeaderChain
	totalDifficulty, err := btcspv.ValidateHeaderChain(headers)
	// Check for errors
	if err != nil {
		return fmt.Sprintf("%s", err)
	}

	// Return the total difficulty
	return fmt.Sprintf("\nTotal Difficulty: %d\n", totalDifficulty)
}
