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
		return sdk.ZeroUint(), errors.New("Header bytes not multiple of 80")
	}

	var digest Hash256Digest
	totalDifficulty := sdk.ZeroUint()

	for i := 0; i < len(headers)/80; i++ {
		start := i * 80
		end := start + 80
		header, _ := NewRawHeader(headers[start:end:end])

		// After the first header, check that headers are in a chain
		if i != 0 {
			if !ValidateHeaderPrevHash(header, digest) {
				return sdk.ZeroUint(), errors.New("Header bytes not a valid chain")
			}
		}

		// ith header target
		target := ExtractTarget(header)

		// Require that the header has sufficient work
		digest = Hash256(header[:])
		if !ValidateHeaderWork(digest, target) {
			return sdk.ZeroUint(), errors.New("Header does not meet its own difficulty target")
		}

		totalDifficulty = totalDifficulty.Add(CalculateDifficulty(target))
	}
	return totalDifficulty, nil
}

// Validate checks validity of all the elements in a BitcoinHeader
func (b BitcoinHeader) Validate() (bool, error) {
	// Check that HashLE is the correct hash of the raw header
	headerHash := Hash256(b.Raw[:])
	if !bytes.Equal(headerHash[:], b.Hash[:]) {
		return false, errors.New("Hash is not the correct hash of the header")
	}

	// Check that the MerkleRootLE is the correct MerkleRoot for the header
	extractedMerkleRootLE := ExtractMerkleRootLE(b.Raw)
	if !bytes.Equal(extractedMerkleRootLE[:], b.MerkleRoot[:]) {
		return false, errors.New("MerkleRoot is not the correct merkle root of the header")
	}

	// Check that PrevHash is the correct PrevHash for the header
	extractedPrevHashLE := ExtractPrevBlockHashLE(b.Raw)
	if bytes.Compare(extractedPrevHashLE[:], b.PrevHash[:]) != 0 {
		return false, errors.New("Prevhash is not the correct parent hash of the header")
	}

	return true, nil
}

// Validate checks validity of all the elements in an SPVProof
func (s SPVProof) Validate() (bool, error) {
	intermediateNodes := s.IntermediateNodes
	index := uint(s.Index)

	validVin := ValidateVin(s.Vin)
	if !validVin {
		return false, errors.New("Vin is not valid")
	}
	validVout := ValidateVout(s.Vout)
	if !validVout {
		return false, errors.New("Vout is not valid")
	}

	// Calculate the Tx ID and compare it to the one in SPVProof
	txid := CalculateTxID(s.Version, s.Vin, s.Vout, s.Locktime)
	if !bytes.Equal(txid[:], s.TxID[:]) {
		return false, errors.New("Version, Vin, Vout and Locktime did not yield correct TxID")
	}

	// Validate all the fields in ConfirmingHeader
	_, err := s.ConfirmingHeader.Validate()
	if err != nil {
		return false, err
	}

	// Check that the proof is valid
	validProof := Prove(s.TxID, s.ConfirmingHeader.MerkleRoot, intermediateNodes, index)
	if !validProof {
		return false, errors.New("Merkle Proof is not valid")
	}

	// If there are no errors, return true
	return true, nil
}
