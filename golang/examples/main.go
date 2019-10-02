package main

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"os"

	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
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

func decodeIfHex(s string) []byte {
	res, err := hex.DecodeString(strip0xPrefix(s))
	if err != nil {
		return []byte(s)
	}
	return res
}

// ParseVin parses an input vector from hex
func ParseVin(vin []byte) string {
	// Use ValidateVin to check if it is a vin
	isVin := btcspv.ValidateVin(vin)
	if !isVin {
		return "Invalid Vin"
	}

	// TODO: Vin will have multiple inputs.
	//       Parse all of them and return a string with linebreaks
	//		 Use "ExtractInputAtIndex"

	// Using ParseInput to get more information about the vin
	sequence, inputID, inputIndex, inputType := btcspv.ParseInput(vin)
	return fmt.Sprintf("Sequence: %d, Input ID: %d, Input Index: %d, Input Type: %d", sequence, inputID, inputIndex, inputType)
}

// ParseVout parses an output vector from hex
func ParseVout(vout []byte) string {
	// Use ValidateVout to check if it includes a vout
	isVout := btcspv.ValidateVout(vout)
	if !isVout {
		return "Invalid Vout"
	}

	// TODO: Vout will have multiple outputs.
	//       Parse all of them and return a string with linebreaks
	//		 Use "ExtractOutputAtIndex"

	// Use ParseOutput to get more information about the vout
	value, outputType, payload := btcspv.ParseOutput(vout)
	return fmt.Sprintf("Value: %d, Output Type: %d, Payload: %d", value, outputType, payload)
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
