package main

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"os"

	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

// // InputType an enum of types of bitcoin inputs
// type InputType int

// // OutputType an enum of types of bitcoin outputs
// type OutputType int

func strip0xPrefix(s string) string {
	if len(s) < 2 {
		return s
	}
	if s[0:2] == "0x" {
		return s[2:]
	}
	return s
}

func decodeIfHex(s string) []byte {
	res, err := hex.DecodeString(strip0xPrefix(s))
	if err != nil {
		return []byte(s)
	}
	return res
}

func prettifyInput(numInput int, outpoint []byte, index uint, inputType btcspv.InputType, sequence uint) string {
	outpointStr := hex.EncodeToString(outpoint)
	dataStr := fmt.Sprintf(`input #%d:
		Outpoint: %s,
		Index: %d,
		Type: %d,
		Sequence: %d
	`, numInput, outpointStr, index, inputType, sequence)
	return dataStr
}

// ParseVin parses an input vector from hex
func ParseVin(vin []byte) string {
	// Validate the vin
	isVin := btcspv.ValidateVin(vin)
	if !isVin {
		return "Invalid Vin"
	}

	numInputs := int(vin[0])
	var inputs string
	for i := 0; i < numInputs; i++ {
		// Extract each vin at the specified index
		vin := btcspv.ExtractInputAtIndex(vin, uint8(i))

		// Use ParseInput to get more information about the vin
		sequence, inputID, inputIndex, inputType := btcspv.ParseInput(vin)

		// Format information about the vin
		numInput := i + 1
		vinData := prettifyInput(numInput, inputID, inputIndex, inputType, sequence)

		// Concat vin information onto `inputs`
		inputs = inputs + vinData
	}

	return inputs
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
			return "Error extracting output"
		}

		// Use ParseOutput to get more information about the vout
		value, outputType, payload := btcspv.ParseOutput(vout)

		// Format information about the vout
		voutData := fmt.Sprintf(`Output #%d:
			Value: %d,
			Type: %d,
			Payload: %d`, i, value, outputType, payload)

		// Concat vout information onto `outputs`
		outputs = outputs + "\n" + voutData
	}

	return outputs
}

func route(command string, argument string, buf []byte) string {
	var result string

	switch command {
	case "parseVin":
		result = ParseVin(buf)
	case "parseVout":
		result = ParseVout(buf)
	default:
		result = fmt.Sprintf("Unknown command: %s", command)
	}

	return result
}

func main() {
	var result string
	command := os.Args[1]
	argument := os.Args[2]
	buf := decodeIfHex(argument)

	// If decoded and arg are the same, it isn't hex
	if bytes.Equal([]byte(argument), buf) {
		fmt.Printf("Invalid hex string: %s", argument)
		return
	}
	result = route(command, argument, buf)
	fmt.Print(result)
}
