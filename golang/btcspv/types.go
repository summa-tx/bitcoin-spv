package btcspv

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

// Hash160Digest is a 20-byte ripemd160+sha2 hash
type Hash160Digest [20]byte

// Hash256Digest is a 32-byte double-sha2 hash
type Hash256Digest [32]byte

// RawHeader is an 80-byte raw header
type RawHeader [80]byte

// HexBytes is a type alias to make JSON hex ser/deser easier
type HexBytes []byte

// BitcoinHeader is a parsed Bitcoin header
type BitcoinHeader struct {
	Raw          RawHeader     `json:"raw"`
	Hash         Hash256Digest `json:"hash"`
	HashLE       Hash256Digest `json:"hash_le"`
	Height       uint32        `json:"height"`
	PrevHash     Hash256Digest `json:"prevhash"`
	PrevHashLE   Hash256Digest `json:"prevhash_le"`
	MerkleRoot   Hash256Digest `json:"merkle_root"`
	MerkleRootLE Hash256Digest `json:"merkle_root_le"`
}

// SPVProof is the base struct for an SPV proof
type SPVProof struct {
	Version           HexBytes      `json:"version"`
	Vin               HexBytes      `json:"vin"`
	Vout              HexBytes      `json:"vout"`
	Locktime          HexBytes      `json:"locktime"`
	TxID              Hash256Digest `json:"tx_id"`
	TxIDLE            Hash256Digest `json:"tx_id_le"`
	Index             uint32        `json:"index"`
	ConfirmingHeader  BitcoinHeader `json:"confirming_header"`
	IntermediateNodes HexBytes      `json:"intermediate_nodes"`
}

// InputType an enum of types of bitcoin inputs
type InputType int

// possible input types
const (
	InputNone     InputType = 0
	Legacy        InputType = 1
	Compatibility InputType = 2
	Witness       InputType = 3
)

// OutputType an enum of types of bitcoin outputs
type OutputType int

// possible output types
const (
	OutputNone  OutputType = 0
	WPKH        OutputType = 1
	WSH         OutputType = 2
	OpReturn    OutputType = 3
	PKH         OutputType = 4
	SH          OutputType = 5
	Nonstandard OutputType = 6
)

type BtcspvError int

const (
	HeaderChainInvalid   BtcspvError = 1
	HeaderChainBadLength BtcspvError = 2
	HeaderChainLowWork   BtcspvError = 3
	HeaderBadLength      BtcspvError = 4
	HeaderHashLE         BtcspvError = 5
	HeaderHashBE         BtcspvError = 6
	HeaderMerkleRootLE   BtcspvError = 7
	HeaderMerkleRootBE   BtcspvError = 8
	HeaderPrevHashLE     BtcspvError = 9
	HeaderPrevHash       BtcspvError = 10
	ProofVin             BtcspvError = 11
	ProofVout            BtcspvError = 12
	ProofTxID            BtcspvError = 13
	ProofMerkleProof     BtcspvError = 14
	OutputBadLength      BtcspvError = 15
	OutputOpReturnFormat BtcspvError = 16
	OutputWitnessFormat  BtcspvError = 17
	OutputP2PKHFormat    BtcspvError = 18
	OutputP2SHFormat     BtcspvError = 19
	OutputAbnormal       BtcspvError = 20
)

type BtcspvErrors struct {
	Errors Errors `json:"errors"`
}

type Errors struct {
	HeaderChainInvalid   string `json:"HEADER_CHAIN_INVALID"`
	HeaderChainBadLength string `json:"HEADER_CHAIN_BAD_LENGTH"`
	HeaderChainLowWork   string `json:"HEADER_CHAIN_LOW_WORK"`
	HeaderBadLength      string `json:"HEADER_BAD_LENGTH"`
	HeaderHashLE         string `json:"HEADER_HASH_LE"`
	HeaderHashBE         string `json:"HEADER_HASH_BE"`
	HeaderMerkleRootLE   string `json:"HEADER_MERKLE_ROOT_LE"`
	HeaderMerkleRootBE   string `json:"HEADER_MERKLE_ROOT_BE"`
	HeaderPrevHashLE     string `json:"HEADER_PREV_HASH_LE"`
	HeaderPrevHash       string `json:"HEADER_PREV_HASH"`
	ProofVin             string `json:"PROOF_VIN"`
	ProofVout            string `json:"PROOF_VOUT"`
	ProofTxID            string `json:"PROOF_TXID"`
	ProofMerkleProof     string `json:"PROOF_MERKLE_PROOF"`
	OutputBadLength      string `json:"OUTPUT_BAD_LENGTH"`
	OutputOpReturnFormat string `json:"OUTPUT_OP_RETURN_FORMAT"`
	OutputWitnessFormat  string `json:"OUTPUT_WITNESS_FORMAT"`
	OutputP2PKHFormat    string `json:"OUTPUT_P2PKH_FORMAT"`
	OutputP2SHFormat     string `json:"OUTPUT_P2SH_FORMAT"`
	OutputAbnormal       string `json:"OUTPUT_ABNORMAL_OUTPUT"`
}

func (e *BtcspvErrors) UnmarshalJSONErrors() {
	jsonFile, err := os.Open("../../testVectors.json")
	if err != nil {
		fmt.Println(err)
	}
	defer jsonFile.Close()

	byteValue, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		fmt.Println(err)
	}

	var btcspvErrors BtcspvErrors
	json.Unmarshal(byteValue, &btcspvErrors)
	fmt.Println(btcspvErrors.Errors.HeaderChainInvalid)
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
	digestLE := Hash256(raw[:])
	digestBE := ReverseHash256Endianness(digestLE)
	prevhashLE := ExtractPrevBlockHashLE(raw)
	prevhash := ReverseHash256Endianness(prevhashLE)
	return BitcoinHeader{
		raw,
		digestBE,
		digestLE,
		height,
		prevhash,
		prevhashLE,
		ExtractMerkleRootBE(raw),
		ExtractMerkleRootLE(raw),
	}
}

// HeaderFromHex buidls a BitcoinHeader from a hex string and height
func HeaderFromHex(s string, height uint32) (BitcoinHeader, error) {
	var raw RawHeader

	buf, err := hex.DecodeString(strip0xPrefix(s))
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

// UnmarshalJSON unmarshalls 32 byte digests
func (h *RawHeader) UnmarshalJSON(b []byte) error {
	// Have to trim quotation marks off byte array
	buf, err := hex.DecodeString(strip0xPrefix(string(b[1 : len(b)-1])))
	if err != nil {
		return err
	}
	if len(buf) != 80 {
		return fmt.Errorf("Expected 80 bytes, got %d bytes", len(buf))
	}

	copy(h[:], buf)

	return nil
}

// MarshalJSON marashalls 32 byte digests as 0x-prepended hex
func (h RawHeader) MarshalJSON() ([]byte, error) {
	encoded := "\"0x" + hex.EncodeToString(h[:]) + "\""
	return []byte(encoded), nil
}
