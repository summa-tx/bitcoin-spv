package btcspv

import (
	"encoding/hex"

	"github.com/btcsuite/btcutil/base58"
	"github.com/btcsuite/btcutil/bech32"
)

func strip0xPrefix(s string) string {
	if len(s) < 2 {
		return s
	}
	if s[0:2] == "0x" {
		return s[2:]
	}
	return s
}

// Decodes a hex string into a byte array
func DecodeIfHex(s string) []byte {
	res, err := hex.DecodeString(strip0xPrefix(s))
	if err != nil {
		return []byte(s)
	}
	return res
}

func GetOutputType(num uint) string {
	var typeString string
	switch num {
	case 0:
		typeString = "Output None"
	case 1:
		typeString = "WPKH"
	case 2:
		typeString = "WSH"
	case 3:
		typeString = "Op Return"
	case 4:
		typeString = "PKH"
	case 5:
		typeString = "SH"
	case 6:
		typeString = "Nonstandard"
	}
	return typeString
}

func GetInputType(num uint) string {
	var typeString string
	switch num {
	case 0:
		typeString = "Input None"
	case 1:
		typeString = "Legacy"
	case 2:
		typeString = "Compatibility"
	case 3:
		typeString = "Witness"
	}
	return typeString
}

// EncodeP2SH turns a scripthash into an address
func EncodeP2SH(sh []byte) string {
	return base58.CheckEncode(sh, 5)
}

// EncodeP2PKH turns a pubkey hash into an address
func EncodeP2PKH(pkh []byte) string {
	return base58.CheckEncode(pkh, 0)
}

func encodeSegWit(payload []byte, version int) string {
	adj, err := bech32.ConvertBits(payload, 8, 5, true)
	if err != nil {
		return ""
	}
	combined := []byte{0x00}
	combined = append(combined, adj...)
	res, _ := bech32.Encode("bc", combined)
	return res
}

// EncodeP2WSH turns a scripthash into an address
func EncodeP2WSH(sh []byte) string {
	return encodeSegWit(sh, 0)
}

// EncodeP2WPKH turns a pubkey hash into an address
func EncodeP2WPKH(pkh []byte) string {
	return encodeSegWit(pkh, 0)
}
