package main

import (
	"encoding/hex"
	"fmt"
	"strconv"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"
	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

func prettifyHeaderData(
	num uint,
	digest btcspv.Hash256Digest,
	version uint,
	prevHash btcspv.Hash256Digest,
	merkleRoot btcspv.Hash256Digest,
	timestamp uint,
	target sdk.Uint,
	nonce uint) string {

	// Convert byte arrays to readable hex strings
	digestStr := hex.EncodeToString(digest[:])
	prevHashStr := hex.EncodeToString(prevHash[:])
	merkleRootStr := hex.EncodeToString(merkleRoot[:])

	// Convert timestamp to readable time
	timestampStr := strconv.Itoa(int(timestamp))
	unixIntValue, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		return fmt.Sprintf("%s\n", err)
	}
	timeStr := time.Unix(unixIntValue, 0)

	// Return data in a formatted string
	dataStr := fmt.Sprintf(
		"\nHeader #%d:\n  Digest: %s,\n  Version: %d,\n  Prev Hash: %s,\n  Merkle Root: %s,\n  Time Stamp: %s,\n  Target: %d,\n  Nonce: %d\n",
		num, digestStr, version, prevHashStr, merkleRootStr, timeStr, target, nonce)

	return dataStr
}

// ParseHeader takes in a header and returns information about that header: digest, version, previous header hash, merkle root, timestamp, target and nonce
func ParseHeader(header btcspv.RawHeader) string {
	// Get information about the header using ParseHeader
	digest, version, prevHash, merkleRoot, timestamp, target, nonce, err := parseHeader(header)
	// Check for errors
	if err != nil {
		return fmt.Sprintf("%s\n", err)
	}

	// Format data using prettifyHeaderData
	headerData := prettifyHeaderData(
		0, digest, version, prevHash, merkleRoot, timestamp, target, nonce)
	return headerData
}

// ValidateHeaderChain takes in a chain of headers as a byte array, validates the chain, and returns the total difficulty
func ValidateHeaderChain(headers []byte) string {
	// Get the total difficulty using ValidateHeaderChain
	totalDifficulty, err := btcspv.ValidateHeaderChain(headers)
	// Check for errors
	if err != nil {
		return fmt.Sprintf("%s\n", err)
	}

	// Return the total difficulty
	return fmt.Sprintf("\nTotal Difficulty: %d\n", totalDifficulty)
}

// ExtractMerkleRootBE returns the transaction merkle root from a given block header
// The returned merkle root is big-endian
func ExtractMerkleRootBE(header btcspv.RawHeader) btcspv.Hash256Digest {
	return btcspv.ReverseHash256Endianness(btcspv.ExtractMerkleRootLE(header))
}

// ExtractPrevBlockHashBE returns the previous block's hash from a block header
// Returns the hash as a big endian []byte
func ExtractPrevBlockHashBE(header btcspv.RawHeader) btcspv.Hash256Digest {
	return btcspv.ReverseHash256Endianness(btcspv.ExtractPrevBlockHashLE(header))
}

// ParseHeader parses a block header struct from a bytestring
func parseHeader(header btcspv.RawHeader) (btcspv.Hash256Digest, uint, btcspv.Hash256Digest, btcspv.Hash256Digest, uint, sdk.Uint, uint, error) {
	digestLE := btcspv.Hash256(header[:])

	digest := btcspv.ReverseHash256Endianness(digestLE)
	version := btcspv.BytesToUint(btcspv.ReverseEndianness(header[0:4:4]))
	prevHash := btcspv.ExtractPrevBlockHashLE(header)
	merkleRoot := btcspv.ExtractMerkleRootLE(header)
	timestamp := btcspv.ExtractTimestamp(header)
	target := btcspv.ExtractTarget(header)
	nonce := btcspv.BytesToUint(btcspv.ReverseEndianness(header[76:80:80]))

	return digest, version, prevHash, merkleRoot, timestamp, target, nonce, nil
}
