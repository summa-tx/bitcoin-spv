package main

import (
	"bytes"
	"encoding/hex"
	"fmt"

	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

// InputType an enum of types of bitcoin inputs
type InputType int

// possible input types
const (
	InputNone     InputType = 0
	Legacy        InputType = 1
	Compatibility InputType = 2
	Witness       InputType = 3
)

func prettifyInput(numInput int, outpoint btcspv.Hash256Digest, index uint, inputType InputType, sequence uint) string {
	outpointStr := hex.EncodeToString(outpoint[:])

	// Get the input type in readable format
	inputTypeString := GetInputType(inputType)

	dataStr := fmt.Sprintf("\nInput #%d:\n  Outpoint: %s,\n  Index: %d,\n  Type: %s,\n  Sequence: %d\n", numInput, outpointStr, index, inputTypeString, sequence)

	return dataStr
}

// ParseVin parses an input vector from hex
func ParseVin(vin []byte) string {
	// Validate the vin
	isVin := btcspv.ValidateVin(vin)
	if !isVin {
		return "Invalid Vin\n"
	}

	numInputs := int(vin[0])
	var formattedInputs string
	for i := 0; i < numInputs; i++ {
		// Extract each vin at the specified index
		vin, _ := btcspv.ExtractInputAtIndex(vin, uint(i))

		// Use ParseInput to get more information about the vin
		sequence, inputID, inputIndex, inputType := parseInput(vin)

		// Format information about the vin
		numInput := i + 1
		data := prettifyInput(numInput, inputID, inputIndex, inputType, sequence)

		// Concat vin information onto `formattedInputs`
		formattedInputs = formattedInputs + data
	}

	return formattedInputs
}

// ExtractInputTxID returns the input tx id bytes
func ExtractInputTxID(input []byte) btcspv.Hash256Digest {
	LE := btcspv.ExtractInputTxIDLE(input)
	txID := btcspv.ReverseHash256Endianness(LE)
	return txID
}

// ParseInput returns human-readable information about an input
func parseInput(input []byte) (uint, btcspv.Hash256Digest, uint, InputType) {
	// NB: If the scriptsig is exactly 00, we are Witness.
	// Otherwise we are Compatibility or Legacy
	var sequence uint32
	var witnessTag []byte
	var inputType InputType

	if input[36] != 0 {
		sequence, _ = btcspv.ExtractSequenceLegacy(input)
		witnessTag = input[36:39:39]

		if bytes.Equal(witnessTag, []byte{34, 0, 32}) || bytes.Equal(witnessTag, []byte{22, 0, 20}) {
			inputType = Compatibility
		} else {
			inputType = Legacy
		}
	} else {
		sequence = btcspv.ExtractSequenceWitness(input)
		inputType = Witness
	}

	inputID := ExtractInputTxID(input)
	inputIndex := btcspv.ExtractTxIndex(input)

	return uint(sequence), inputID, inputIndex, inputType
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
