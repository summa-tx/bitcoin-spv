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

// DecodeIfHex decodes a hex string into a byte array
func DecodeIfHex(s string) []byte {
	res, err := hex.DecodeString(strip0xPrefix(s))
	if err != nil {
		return []byte(s)
	}
	return res
}

// GetOuputType returns the name of the output type associated with the number
func GetOutputType(outputType OutputType) string {
	var typeString string
	switch outputType {
	case OutputNone:
		typeString = "Output None"
	case WPKH:
		typeString = "WPKH"
	case WSH:
		typeString = "WSH"
	case OpReturn:
		typeString = "Op Return"
	case PKH:
		typeString = "PKH"
	case SH:
		typeString = "SH"
	case Nonstandard:
		typeString = "Nonstandard"
	}
	return typeString
}

// GetInputType returns the name of the input type associated with the number
func GetInputType(inputType InputType) string {
	var typeString string
	switch inputType {
	case InputNone:
		typeString = "Input None"
	case Legacy:
		typeString = "Legacy"
	case Compatibility:
		typeString = "Compatibility"
	case Witness:
		typeString = "Witness"
	}
	return typeString
}
