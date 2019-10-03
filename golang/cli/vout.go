package main

import (
	"encoding/hex"
	"fmt"

	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

func prettifyOutput(
	numOutput int,
	outpoint []byte,
	value uint,
	outputType btcspv.OutputType) string {

	outpointStr := hex.EncodeToString(outpoint)

	// Get the output type in readable format
	outputTypeString := btcspv.GetOutputType(outputType)

	dataStr := fmt.Sprintf(
		"\nOutput #%d:\n  Payload: %s,\n  Value: %d,\n  Type: %s\n",
		numOutput, outpointStr, value, outputTypeString)
	return dataStr
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
		vout, err := btcspv.ExtractOutputAtIndex(vout, uint8(i))
		if err != nil {
			return fmt.Sprintf("%s\n", err)
		}

		// Use ParseOutput to get more information about the vout
		value, outputType, payload := btcspv.ParseOutput(vout)

		// Format information about the vout
		numOutput := i + 1
		data := prettifyOutput(numOutput, payload, value, outputType)

		// Concat vout information onto formattedOutputs
		formattedOutputs = formattedOutputs + data
	}

	return formattedOutputs
}
