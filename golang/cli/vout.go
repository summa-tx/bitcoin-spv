package main

import (
	"bytes"
	"encoding/hex"
	"fmt"

	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
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

func prettifyOutput(
	numOutput int,
	outpoint []byte,
	value uint,
	outputType OutputType) string {

	outpointStr := hex.EncodeToString(outpoint)

	// Get the output type in readable format
	outputTypeString := GetOutputType(outputType)

	// Get the address associated with the output
	address := getAddress(outputType, outpoint)

	dataStr := fmt.Sprintf(
		"\nOutput #%d:\n  Address: %s\n  Payload: %s,\n  Value: %d,\n  Type: %s\n",
		numOutput, address, outpointStr, value, outputTypeString)
	return dataStr
}

// getAddress return the address associated with the output
func getAddress(outputType OutputType, outpoint []byte) string {
	var address string
	var err error

	switch outputType {
	case WPKH:
		address, err = btcspv.EncodeP2WPKH(outpoint)
	case WSH:
		digest, _ := btcspv.NewHash256Digest(outpoint)
		address, err = btcspv.EncodeP2WSH(digest)
	case PKH:
		address, err = btcspv.EncodeP2PKH(outpoint)
	case SH:
		address, err = btcspv.EncodeP2SH(outpoint)
	default:
		address = ""
	}

	if err != nil {
		return fmt.Sprintf("%s\n", err)
	}
	return address
}

// ParseVout parses an output vector from hex
func ParseVout(vout []byte) string {
	// Validate the vout
	isVout := btcspv.ValidateVout(vout)
	if !isVout {
		return "Invalid Vout\n"
	}

	numOutputs := int(vout[0])
	var formattedOutputs string
	for i := 0; i < numOutputs; i++ {
		// Extract each vout at the specified index
		vout, err := btcspv.ExtractOutputAtIndex(vout, uint(i))
		if err != nil {
			return fmt.Sprintf("%s\n", err)
		}

		// Use ParseOutput to get more information about the vout
		value, outputType, payload := parseOutput(vout)

		// Format information about the vout
		numOutput := i + 1
		data := prettifyOutput(numOutput, payload, value, outputType)

		// Concat vout information onto formattedOutputs
		formattedOutputs = formattedOutputs + data
	}

	return formattedOutputs
}

// ParseOutput extracts human-readable information from an output
func parseOutput(output []byte) (uint, OutputType, []byte) {
	value := btcspv.ExtractValue(output)
	var outputType OutputType
	var payload []byte

	if output[9] == 0x6a {
		outputType = OpReturn
		payload, _ = btcspv.ExtractOpReturnData(output)
	} else {
		prefixHash := output[8:10:10]
		if bytes.Equal(prefixHash, []byte{0x22, 0x00}) {
			outputType = WSH
			payload = output[11:43:43]
		} else if bytes.Equal(prefixHash, []byte{0x16, 0x00}) {
			outputType = WPKH
			payload = output[11:31:31]
		} else if bytes.Equal(prefixHash, []byte{0x19, 0x76}) {
			outputType = PKH
			payload = output[12:32:32]
		} else if bytes.Equal(prefixHash, []byte{0x17, 0xa9}) {
			outputType = SH
			payload = output[11:31:31]
		} else {
			outputType = Nonstandard
			payload = []byte{}
		}
	}

	return value, outputType, payload
}

// GetOutputType returns the name of the output type associated with the number
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
