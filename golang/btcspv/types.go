package btcspv

import (
	"encoding/hex"
	"fmt"
)

// Hash256Digest is a 32-byte double-sha2 hash
type Hash256Digest [32]byte

// HexBytes is a type alias to make JSON hex ser/deser easier
type HexBytes []byte

// BitcoinHeader is a parsed Bitcoin header
type BitcoinHeader struct {
	Hex          string        `json:"hex"`
	Hash         Hash256Digest `json:"hash"`
	HashLE       Hash256Digest `json:"hash_le"`
	Height       uint32        `json:"height"`
	PrevHash     Hash256Digest `json:"prevhash"`
	MerkleRoot   Hash256Digest `json:"merkle_root"`
	MerkleRootLE Hash256Digest `json:"merkle_root_le"`
}

// SPVProof is the base struct for an SPV proof
type SPVProof struct {
	Version           HexBytes      `json:"version"`
	Vin               HexBytes      `json:"vin"`
	Vout              HexBytes      `json:"vout"`
	Locktime          HexBytes      `json:"locktime"`
	TxID              []byte        `json:"tx_id"`
	TxIDLE            Hash256Digest `json:"tx_id_le"`
	Index             uint32        `json:"index"`
	ConfirmingHeader  []byte        `json:"confirming_header"`
	IntermediateNodes HexBytes      `json:"intermediate_nodes"`
	// Was having problems with these types
	// TxID              Hash256Digest `json:"tx_id"`
	// ConfirmingHeader  BitcoinHeader `json:"confirming_header"`
}

// UnmarshalJSON unmarshalls 32 byte digests
func (h *HexBytes) UnmarshalJSON(b []byte) error {
	// Have to trim quotation marks off byte array
	buf, err := hex.DecodeString(strip0xPrefix(string(b[1 : len(b)-1])))
	if err != nil {
		return err
	}

	*h = append(*h, buf...)
	return nil
}

// MarshalJSON marashalls bytestrings as 0x-prepended hex
func (h HexBytes) MarshalJSON() ([]byte, error) {
	encoded := "\"0x" + hex.EncodeToString(h[:]) + "\""
	return []byte(encoded), nil
}

// UnmarshalJSON unmarshalls 32 byte digests
func (h *Hash256Digest) UnmarshalJSON(b []byte) error {
	// Have to trim quotation marks off byte array
	buf, err := hex.DecodeString(strip0xPrefix(string(b[1 : len(b)-1])))
	if err != nil {
		return err
	}
	if len(buf) != 32 {
		return fmt.Errorf("Expected 32 bytes, got %d bytes", len(buf))
	}

	copy(h[:], buf)

	return nil
}

// MarshalJSON marashalls 32 byte digests as 0x-prepended hex
func (h Hash256Digest) MarshalJSON() ([]byte, error) {
	encoded := "\"0x" + hex.EncodeToString(h[:]) + "\""
	return []byte(encoded), nil
}
