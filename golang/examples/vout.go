package main

import (
	"encoding/hex"
	"fmt"

	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

func prettifyOutput(numOutput int, outpoint []byte, value uint, outputType btcspv.OutputType) string {
	outpointStr := hex.EncodeToString(outpoint)

	// Get the output type in readable format
	outputTypeString := btcspv.GetOutputType(outputType)

	dataStr := fmt.Sprintf("\nOutput #%d:\n  Payload: %s,\n  Value: %d,\n  Type: %s\n", numOutput, outpointStr, value, outputTypeString)
	return dataStr
}

// ParseVout parses an output vector from hex
func ParseVout(vout []byte) string {
	// Validate the vout
	isVout := btcspv.ValidateVout(vout)
	if !isVout {
		return "Invalid Vout"
	}

	numOutputs := int(vout[0])
	var outputs string
	for i := 0; i < numOutputs; i++ {
		// Extract each vout at the specified index
		vout, err := btcspv.ExtractOutputAtIndex(vout, uint8(i))
		if err != nil {
			return fmt.Sprintf("%s", err)
		}

		// Use ParseOutput to get more information about the vout
		value, outputType, payload := btcspv.ParseOutput(vout)

		// Format information about the vout
		numOutput := i + 1
		voutData := prettifyOutput(numOutput, payload, value, outputType)

		// Concat vout information onto `outputs`
		outputs = outputs + voutData
	}

	return outputs
}
