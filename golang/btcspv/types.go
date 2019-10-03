package btcspv

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
)

// Hash256Digest is a 32-byte double-sha2 hash
type Hash256Digest [32]byte

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

// Proof is the base struct for an SPV proof
type Proof struct {
	TxID             Hash256Digest `json:"tx_id"`
	TxIDLE           Hash256Digest `json:"tx_id_le"`
	Index            uint32        `json:"index"`
	ConfirmingHeader BitcoinHeader `json:"confirming_header"`
}

// JSONProof is a convenience struct to make deserialization easier
type JSONProof struct {
	Proof
	IntermediateNodes string `json:"intermediate_nodes"`
}

// SPVProof is an SPV proof
type SPVProof struct {
	Proof
	IntermediateNodes []byte
}

// class SPVProof(TypedDict):
//     tx: tx.Tx    # some language-native TX object
//     tx_id: str
//     tx_id_le: str
//     index: int
//     intermediate_nodes: str
//     confirming_header: RelayHeader

// UnmarshalJSON unmarshalls SPVProofs
func (s *SPVProof) UnmarshalJSON(b []byte) error {
	j := new(JSONProof)
	json.Unmarshal(b, &j)

	buf, err := hex.DecodeString(strip0xPrefix(j.IntermediateNodes))
	if err != nil {
		return err
	}

	s.TxID = j.TxID
	s.TxIDLE = j.TxIDLE
	s.Index = j.Index
	s.ConfirmingHeader = j.ConfirmingHeader
	s.IntermediateNodes = buf

	return nil
}

// MarshallJSON marashalls SPVProofs
func (s *SPVProof) MarshallJSON() ([]byte, error) {
	j := new(JSONProof)

	buf := "0x" + hex.EncodeToString(s.IntermediateNodes)

	j.TxID = s.TxID
	j.TxIDLE = s.TxIDLE
	j.Index = s.Index
	j.ConfirmingHeader = s.ConfirmingHeader
	j.IntermediateNodes = buf

	return json.Marshal(j)
}

// UnmarshalJSON unmarshalls 32 byte digests
func (h Hash256Digest) UnmarshalJSON(b []byte) error {
	buf, err := hex.D ecodeString(strip0xPrefix(string(b)))
	if err != nil {
		return err
	}
	if len(buf) != 32 {
		return fmt.Errorf("Expected 32 bytes, got %d bytes", len(buf))
	}

	copy(h[:], buf)

	return nil
}

// MarshallJSON marashalls 32 byte digests
func (h *Hash256Digest) MarshallJSON() ([]byte, error) {
	encoded := hex.EncodeToString(h[:])
	return []byte("0x" + encoded), nil
}
