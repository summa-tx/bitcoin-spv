package examples

import (
	"fmt"

	btcspv "github.com/summa-tx/bitcoin-spv/golang/btcspv"
)

// Make sure you are using byte arrays
var vin = []byte("0x011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff")
var vout = []byte("0x024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211")

func ParseVin() string {
	// Use ValidateVin to check if it is a vin
	isVin := btcspv.ValidateVin(vin)
	// Using ParseInput to get more information about the vin
	sequence, inputID, inputIndex, inputType := btcspv.ParseInput(vin)
	return fmt.Sprintf("Is Vin: %d, Sequence: %d, Input ID: %d, Input Index: %d, Input Type: %d", isVin, sequence, inputID, inputIndex, inputType)
}

func ParseVout() string {
	// Use ValidateVout to check if it includes a vout
	isVout := btcspv.ValidateVout(vout)
	// Use ParseOutput to get more information about the vout
	value, outputType, payload := btcspv.ParseOutput(vout)
	return fmt.Sprintf("Is Vout: %d, Value: %d, Output Type: %d, Payload: %d", isVout, value, outputType, payload)
}
