package btcspv

import "bytes"

// import (
// 	"bytes"
// 	// "crypto/sha256"
// 	// "encoding/binary"
// 	// "encoding/hex"
// 	// "errors"
// 	// "math/big"
// 	// sdk "github.com/cosmos/cosmos-sdk/types"
// 	// "golang.org/x/crypto/ripemd160"
// )

type INPUT_TYPE int

const (
	INPUT_NONE    INPUT_TYPE = 0
	LEGACY        INPUT_TYPE = 1
	COMPATIBILITY INPUT_TYPE = 2
	WITNESS       INPUT_TYPE = 3
)

type OUTPUT_TYPE int

const (
	OUTPUT_NONE OUTPUT_TYPE = 0
	WPKH        OUTPUT_TYPE = 1
	WSH         OUTPUT_TYPE = 2
	OP_RETURN   OUTPUT_TYPE = 3
	PKH         OUTPUT_TYPE = 4
	SH          OUTPUT_TYPE = 5
	NONSTANDARD OUTPUT_TYPE = 6
)

func prove(txid []byte, merkleRoot []byte, intermediateNodes []byte, index uint) bool {
	// Shortcut the empty-block case
	if bytes.Equal(txid, merkleRoot) && index == 0 && len(intermediateNodes) == 0 {
		return true
	}

	proof := []byte{}
	proof = append(proof, txid...)
	proof = append(proof, intermediateNodes...)
	proof = append(proof, merkleRoot...)

	return VerifyHash256Merkle(proof, index)
}

func CalculateTxId(version, vin, vout, locktime []byte) []byte {
	txid := []byte{}
	txid = append(txid, version...)
	txid = append(txid, vin...)
	txid = append(txid, vout...)
	txid = append(txid, locktime...)
	return Hash256(txid)
}

func ParseInput(input []byte) (uint, []byte, uint, uint) {
	// NB: If the scriptsig is exactly 00, we are WITNESS.
	// Otherwise we are Compatibility or LEGACY
	var sequence uint
	var witnessTag []byte
	var inputType uint

	if input[36] != 0 {
		sequence = ExtractSequenceLegacy(input)
		witnessTag = input[36:39]

		if bytes.Equal(witnessTag, []byte{34, 0, 32}) || bytes.Equal(witnessTag, []byte{32, 0, 20}) {
			inputType = uint(COMPATIBILITY)
		} else {
			inputType = uint(LEGACY)
		}
	} else {
		sequence = ExtractSequenceWitness(input)
		inputType = uint(WITNESS)
	}

	inputId := ExtractInputTxId(input)
	inputIndex := ExtractTxIndex(input)

	return sequence, inputId, inputIndex, inputType
}

func ParseOutput(output []byte) (uint, uint, []byte) {
	value := ExtractValue(output)
	var outputType uint
	var payload []byte

	if output[9] == 0x6a {
		outputType = uint(OP_RETURN)
		payload, _ = ExtractOpReturnData(output)
	} else {
		prefixHash := output[8:10]
		if bytes.Equal(prefixHash, []byte{34, 0}) {
			outputType = uint(WSH)
			payload = output[11:43]
		} else if bytes.Equal(prefixHash, []byte{22, 0}) {
			outputType = uint(WPKH)
			payload = output[11:31]
		} else if bytes.Equal(prefixHash, []byte{25, 118}) {
			outputType = uint(PKH)
			payload = output[12:32]
		} else if bytes.Equal(prefixHash, []byte{23, 169}) {
			outputType = uint(SH)
			payload = output[11:31]
		} else {
			outputType = uint(NONSTANDARD)
			payload = []byte{}
		}
	}

	return value, outputType, payload
}

// func ParseHeader() {
// 	// if (header.length !== 80) {
//   //   throw new TypeError('Malformatted header. Must be exactly 80 bytes.');
//   // }

//   // const digest = utils.reverseEndianness(BTCUtils.hash256(header));
//   // const version = utils.bytesToUint(utils.reverseEndianness(utils.safeSlice(header, 0, 4)));
//   // const prevHash = BTCUtils.extractPrevBlockLE(header);
//   // const merkleRoot = BTCUtils.extractMerkleRootLE(header);
//   // const timestamp = BTCUtils.extractTimestamp(header);
//   // const target = BTCUtils.extractTarget(header);
//   // const nonce = utils.bytesToUint(utils.reverseEndianness(utils.safeSlice(header, 76, 80)));

//   // return {
//   //   digest, version, prevHash, merkleRoot, timestamp, target, nonce
//   // };
// }

// func ValidateHeaderWork() {

// }

// func ValidateHeaderPrevHash() {

// }

// func ValidateHeaderChain() {

// }
