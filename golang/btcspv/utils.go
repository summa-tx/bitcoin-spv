package btcspv

import (
	"encoding/hex"
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
