package btcspv

import (
	"encoding/hex"
	"fmt"
)

// Hash160Digest is a 20-byte ripemd160+sha2 hash
type Hash160Digest [20]byte

// Hash256Digest is a 32-byte double-sha2 hash
type Hash256Digest [32]byte

// RawHeader is an 80-byte raw header
type RawHeader [80]byte

// HexBytes is a type alias to make JSON hex ser/deser easier
type HexBytes []byte

// BitcoinHeader is a parsed Bitcoin header, values are LE
type BitcoinHeader struct {
	Raw        RawHeader     `json:"raw"`
	Hash       Hash256Digest `json:"hash"`
	Height     uint32        `json:"height"`
	PrevHash   Hash256Digest `json:"prevhash"`
	MerkleRoot Hash256Digest `json:"merkle_root"`
}

// SPVProof is the base struct for an SPV proof
type SPVProof struct {
	Version           HexBytes      `json:"version"`
	Vin               HexBytes      `json:"vin"`
	Vout              HexBytes      `json:"vout"`
	Locktime          HexBytes      `json:"locktime"`
	TxID              Hash256Digest `json:"tx_id"`
	Index             uint32        `json:"index"`
	ConfirmingHeader  BitcoinHeader `json:"confirming_header"`
	IntermediateNodes HexBytes      `json:"intermediate_nodes"`
}

// NewHash160Digest instantiates a Hash160Digest from a byte slice
func NewHash160Digest(b []byte) (Hash160Digest, error) {
	var h Hash160Digest
	copied := copy(h[:], b)
	if copied != 20 {
		return Hash160Digest{}, fmt.Errorf("Expected 20 bytes in a Hash160Digest, got %d", copied)
	}
	return h, nil
}

// NewHash256Digest instantiates a Hash256Digest from a byte slice
func NewHash256Digest(b []byte) (Hash256Digest, error) {
	var h Hash256Digest
	copied := copy(h[:], b)
	if copied != 32 {
		return Hash256Digest{}, fmt.Errorf("Expected 32 bytes in a Hash256Digest, got %d", copied)
	}
	return h, nil
}

// NewRawHeader instantiates a RawHeader from a byte slice
func NewRawHeader(b []byte) (RawHeader, error) {
	var h RawHeader
	copied := copy(h[:], b)
	if copied != 80 {
		return RawHeader{}, fmt.Errorf("Expected 80 bytes in a RawHeader got %d", copied)
	}
	return h, nil
}

// HeaderFromRaw builds a BitcoinHeader from a raw bytestring and height
func HeaderFromRaw(raw RawHeader, height uint32) BitcoinHeader {
	digest := Hash256(raw[:])
	prevhash := ExtractPrevBlockHashLE(raw)
	merkleRoot := ExtractMerkleRootLE(raw)

	return BitcoinHeader{
		raw,
		digest,
		height,
		prevhash,
		merkleRoot,
	}
}

// HeaderFromHex buidls a BitcoinHeader from a hex string and height
func HeaderFromHex(s string, height uint32) (BitcoinHeader, error) {
	var raw RawHeader

	buf, err := hex.DecodeString(Strip0xPrefix(s))
	if err != nil {
		return BitcoinHeader{}, err
	}

	copied := copy(raw[:], buf)
	if copied != 80 {
		return BitcoinHeader{}, fmt.Errorf("Expected 80 bytes in a Hash256 digest, got %d", copied)
	}

	return HeaderFromRaw(raw, height), nil
}

// UnmarshalJSON unmarshalls 32 byte digests
func (h *HexBytes) UnmarshalJSON(b []byte) error {
	// Have to trim quotation marks off byte array
	end := len(b) - 1
	buf, err := hex.DecodeString(Strip0xPrefix(string(b[1:end:end])))
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
	end := len(b) - 1
	buf, err := hex.DecodeString(Strip0xPrefix(string(b[1:end:end])))
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

// UnmarshalJSON unmarshalls 32 byte digests
func (h *RawHeader) UnmarshalJSON(b []byte) error {
	// Have to trim quotation marks off byte array
	end := len(b) - 1
	buf, err := hex.DecodeString(Strip0xPrefix(string(b[1:end:end])))
	if err != nil {
		return err
	}
	if len(buf) != 80 {
		return fmt.Errorf("Expected 80 bytes, got %d bytes", len(buf))
	}

	copy(h[:], buf)

	return nil
}

// UnmarshalJSON unmarshalls 32 byte digests
func (h *Hash160Digest) UnmarshalJSON(b []byte) error {
	// Have to trim quotation marks off byte array
	end := len(b) - 1
	buf, err := hex.DecodeString(Strip0xPrefix(string(b[1:end:end])))
	if err != nil {
		return err
	}
	if len(buf) != 20 {
		return fmt.Errorf("Expected 20 bytes, got %d bytes", len(buf))
	}

	copy(h[:], buf)

	return nil
}

// MarshalJSON marashalls 32 byte digests as 0x-prepended hex
func (h Hash160Digest) MarshalJSON() ([]byte, error) {
	encoded := "\"0x" + hex.EncodeToString(h[:]) + "\""
	return []byte(encoded), nil
}

// MarshalJSON marashalls 32 byte digests as 0x-prepended hex
func (h RawHeader) MarshalJSON() ([]byte, error) {
	encoded := "\"0x" + hex.EncodeToString(h[:]) + "\""
	return []byte(encoded), nil
}
