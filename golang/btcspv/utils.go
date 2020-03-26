package btcspv

import (
	"bytes"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/btcsuite/btcutil/base58"
	"github.com/btcsuite/btcutil/bech32"
)

// ZeroBytesError is the error returned when attempting to encode
// an empty bytestring
const ZeroBytesError = "Attempting to encode empty bytestring. " +
	"Hint: your payload may not be properly initialized"

// Strip0xPrefix removes the 0x prefix from a hex string
func Strip0xPrefix(s string) string {
	if len(s) < 2 {
		return s
	}
	if s[0:2] == "0x" {
		return s[2:]
	}
	return s
}

// DecodeIfHex decodes a hex string into a byte array
func DecodeIfHex(s string) []byte {
	res, err := hex.DecodeString(Strip0xPrefix(s))
	if err != nil {
		return []byte(s)
	}
	return res
}

// EncodeP2SH turns a scripthash into an address
func EncodeP2SH(sh []byte) (string, error) {
	if len(sh) != 20 {
		return "", fmt.Errorf("SH must be 20 bytes, got %d bytes", len(sh))
	}
	if bytes.Equal(sh, make([]byte, len(sh))) {
		return "", errors.New(ZeroBytesError)
	}
	return base58.CheckEncode(sh, 5), nil
}

// EncodeP2PKH turns a pubkey hash into an address
func EncodeP2PKH(pkh []byte) (string, error) {
	if len(pkh) != 20 {
		return "", fmt.Errorf("PKH must be 20 bytes, got %d bytes", len(pkh))
	}
	if bytes.Equal(pkh, make([]byte, len(pkh))) {
		return "", errors.New(ZeroBytesError)

	}
	return base58.CheckEncode(pkh, 0), nil
}

func encodeSegWit(payload []byte, version int) (string, error) {
	if bytes.Equal(payload, make([]byte, len(payload))) {
		return "", errors.New(ZeroBytesError)
	}
	adj, _ := bech32.ConvertBits(payload, 8, 5, true)
	combined := []byte{0x00}
	combined = append(combined, adj...)
	res, _ := bech32.Encode("bc", combined)
	return res, nil
}

// EncodeP2WSH turns a scripthash into an address
func EncodeP2WSH(sh Hash256Digest) (string, error) {
	addr, err := encodeSegWit(sh[:], 0)
	if err != nil {
		return "", err
	}
	return addr, nil
}

// EncodeP2WPKH turns a pubkey hash into an address
func EncodeP2WPKH(pkh []byte) (string, error) {
	if len(pkh) != 20 {
		return "", fmt.Errorf("WPKH must be 20 bytes, got %d bytes", len(pkh))
	}
	addr, err := encodeSegWit(pkh, 0)
	if err != nil {
		return "", err
	}
	return addr, nil
}
