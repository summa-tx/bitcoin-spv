package btcspv

import (
	"bytes"
	"errors"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Prove checks the validity of a merkle proof
func Prove(txid Hash256Digest, merkleRoot Hash256Digest, intermediateNodes []byte, index uint) bool {
	// Shortcut the empty-block case
	if bytes.Equal(txid[:], merkleRoot[:]) && index == 0 && len(intermediateNodes) == 0 {
		return true
	}

	proof := []byte{}
	proof = append(proof, txid[:]...)
	proof = append(proof, intermediateNodes...)
	proof = append(proof, merkleRoot[:]...)

	return VerifyHash256Merkle(proof, index)
}

// CalculateTxID hashes transaction to get txid
func CalculateTxID(version, vin, vout, locktime []byte) Hash256Digest {
	txid := []byte{}
	txid = append(txid, version...)
	txid = append(txid, vin...)
	txid = append(txid, vout...)
	txid = append(txid, locktime...)
	return Hash256(txid)
}

// ParseInput returns human-readable information about an input
func ParseInput(input []byte) (uint, Hash256Digest, uint, InputType) {
	// NB: If the scriptsig is exactly 00, we are Witness.
	// Otherwise we are Compatibility or Legacy
	var sequence uint
	var witnessTag []byte
	var inputType InputType

	if input[36] != 0 {
		sequence = ExtractSequenceLegacy(input)
		witnessTag = input[36:39]

		if bytes.Equal(witnessTag, []byte{34, 0, 32}) || bytes.Equal(witnessTag, []byte{22, 0, 20}) {
			inputType = Compatibility
		} else {
			inputType = Legacy
		}
	} else {
		sequence = ExtractSequenceWitness(input)
		inputType = Witness
	}

	inputID := ExtractInputTxID(input)
	inputIndex := ExtractTxIndex(input)

	return sequence, inputID, inputIndex, inputType
}

// ParseOutput extracts human-readable information from an output
func ParseOutput(output []byte) (uint, OutputType, []byte) {
	value := ExtractValue(output)
	var outputType OutputType
	var payload []byte

	if output[9] == 0x6a {
		outputType = OpReturn
		payload, _ = ExtractOpReturnData(output)
	} else {
		prefixHash := output[8:10]
		if bytes.Equal(prefixHash, []byte{0x22, 0x00}) {
			outputType = WSH
			payload = output[11:43]
		} else if bytes.Equal(prefixHash, []byte{0x16, 0x00}) {
			outputType = WPKH
			payload = output[11:31]
		} else if bytes.Equal(prefixHash, []byte{0x19, 0x76}) {
			outputType = PKH
			payload = output[12:32]
		} else if bytes.Equal(prefixHash, []byte{0x17, 0xa9}) {
			outputType = SH
			payload = output[11:31]
		} else {
			outputType = Nonstandard
			payload = []byte{}
		}
	}

	return value, outputType, payload
}

// ParseHeader parses a block header struct from a bytestring
func ParseHeader(header RawHeader) (Hash256Digest, uint, Hash256Digest, Hash256Digest, uint, sdk.Uint, uint, error) {
	digestLE := Hash256(header[:])

	digest := ReverseHash256Endianness(digestLE)
	version := BytesToUint(ReverseEndianness(header[0:4]))
	prevHash := ExtractPrevBlockHashLE(header)
	merkleRoot := ExtractMerkleRootLE(header)
	timestamp := ExtractTimestamp(header)
	target := ExtractTarget(header)
	nonce := BytesToUint(ReverseEndianness(header[76:80]))

	return digest, version, prevHash, merkleRoot, timestamp, target, nonce, nil
}

// ValidateHeaderWork checks validity of header work
func ValidateHeaderWork(digest Hash256Digest, target sdk.Uint) bool {
	if bytes.Equal(digest[:], bytes.Repeat([]byte{0}, 32)) {
		return false
	}
	return BytesToBigUint(ReverseEndianness(digest[:])).LT(target)
}

// ValidateHeaderPrevHash checks validity of header chain
func ValidateHeaderPrevHash(header RawHeader, prevHeaderDigest Hash256Digest) bool {
	// Extract prevHash of current header
	prevHash := ExtractPrevBlockHashLE(header)

	return bytes.Equal(prevHash[:], prevHeaderDigest[:])
}

// ValidateHeaderChain checks validity of header chain
func ValidateHeaderChain(headers []byte) (sdk.Uint, error) {
	// Check header chain length
	if len(headers)%80 != 0 {
		return sdk.ZeroUint(), errors.New("Header bytes not multiple of 80.")
	}

	var digest Hash256Digest
	totalDifficulty := sdk.ZeroUint()

	for i := 0; i < len(headers)/80; i++ {
		start := i * 80
		header, _ := NewRawHeader(headers[start : start+80])

		// After the first header, check that headers are in a chain
		if i != 0 {
			if !ValidateHeaderPrevHash(header, digest) {
				return sdk.ZeroUint(), errors.New("Header bytes not a valid chain.")
			}
		}

		// ith header target
		target := ExtractTarget(header)

		// Require that the header has sufficient work
		digest = Hash256(header[:])
		if !ValidateHeaderWork(digest, target) {
			return sdk.ZeroUint(), errors.New("Header does not meet its own difficulty target.")
		}

		totalDifficulty = totalDifficulty.Add(CalculateDifficulty(target))
	}
	return totalDifficulty, nil
}

// Validate checks validity of all the elements in a BitcoinHeader
func (b BitcoinHeader) Validate() (bool, error) {
	// Check that HashLE is the correct hash of the raw header
	headerHash := Hash256(b.Raw[:])
	if !bytes.Equal(headerHash[:], b.HashLE[:]) {
		return false, errors.New("HashLE is not the correct hash of the header")
	}

	// Check that HashLE is the reverse of Hash
	reversedHash := ReverseEndianness(b.Hash[:])
	if !bytes.Equal(reversedHash, b.HashLE[:]) {
		return false, errors.New("HashLE is not the LE version of Hash")
	}

	// Check that the MerkleRootLE is the correct MerkleRoot for the header
	extractedMerkleRootLE := ExtractMerkleRootLE(b.Raw)
	if !bytes.Equal(extractedMerkleRootLE[:], b.MerkleRootLE[:]) {
		return false, errors.New("MerkleRootLE is not the correct merkle root of the header")
	}

	// Check that MerkleRootLE is the reverse of MerkleRoot
	reversedMerkleRoot := ReverseEndianness(b.MerkleRoot[:])
	if !bytes.Equal(reversedMerkleRoot, b.MerkleRootLE[:]) {
		return false, errors.New("MerkleRootLE is not the LE version of MerkleRoot")
	}

	// Check that PrevHash is the correct PrevHash for the header
	extractedPrevHashLE := ExtractPrevBlockHashLE(b.Raw)
	if bytes.Compare(extractedPrevHashLE[:], b.PrevHashLE[:]) != 0 {
		return false, errors.New("PrevhashLE is not the correct parent hash of the header")
	}

	// Check that PrevHashLE is the reverse of Prevhash
	reversedPrevHash := ReverseEndianness(b.PrevHash[:])
	if !bytes.Equal(reversedPrevHash, b.PrevHashLE[:]) {
		return false, errors.New("PrevhashLE is not the LE version of Prevhash")
	}

	return true, nil
}

// Validate checks validity of all the elements in an SPVProof
func (s SPVProof) Validate() (bool, error) {
	intermediateNodes := s.IntermediateNodes
	index := uint(s.Index)

	validVin := ValidateVin(s.Vin)
	if !validVin {
		return false, errors.New("Vin is not valid.")
	}
	validVout := ValidateVout(s.Vout)
	if !validVout {
		return false, errors.New("Vout is not valid.")
	}

	// Calculate the Tx ID and compare it to the one in SPVProof
	txid := CalculateTxID(s.Version, s.Vin, s.Vout, s.Locktime)
	if !bytes.Equal(txid[:], s.TxIDLE[:]) {
		return false, errors.New("Version, Vin, Vout and Locktime did not yield correct TxID")
	}

	// Validate all the fields in ConfirmingHeader
	_, err := s.ConfirmingHeader.Validate()
	if err != nil {
		return false, err
	}

	// Check that the proof is valid
	validProof := Prove(s.TxIDLE, s.ConfirmingHeader.MerkleRootLE, intermediateNodes, index)
	if !validProof {
		return false, errors.New("Merkle Proof is not valid.")
	}

	// If there are no errors, return true
	return true, nil
}
