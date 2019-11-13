package main

import (
	"fmt"
	"os"
	"strconv"

	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

func route(command string, arguments [][]byte) string {
	var result string

	switch command {
	case "parseVin":
		result = ParseVin(arguments[0])
	case "parseVout":
		result = ParseVout(arguments[0])
	case "parseHeader":
		rawHeader, _ := btcspv.NewRawHeader(arguments[0])
		result = ParseHeader(rawHeader)
	case "validateHeaderChain":
		result = ValidateHeaderChain(arguments[0])
	case "prove":
		// convert argument to a uint
		str := string(arguments[6])
		uint64Arg, err := strconv.ParseUint(str, 10, 32)
		if err != nil {
			return fmt.Sprintf("%s\n", err)
		}
		uintArg := uint(uint64Arg)
		merkleRoot, _ := btcspv.NewHash256Digest(arguments[4])
		result = Prove(arguments[0], arguments[1], arguments[2], arguments[3], merkleRoot, arguments[5], uintArg)
	default:
		result = fmt.Sprintf("Unknown command: %s\n", command)
	}

	return result
}

// Map function to slice of strings
func Map(vs []string, f func(string) []byte) [][]byte {
	vsm := make([][]byte, len(vs))
	for i, v := range vs {
		vsm[i] = f(v)
	}
	return vsm
}

func main() {
	var result string

	if len(os.Args) < 2 {
		fmt.Print("Not enough arguments\n")
		return
	}

	command := os.Args[1]
	arguments := Map(os.Args[2:], btcspv.DecodeIfHex)

	result = route(command, arguments)
	fmt.Print(result)
}
