package btcspv

import sdk "github.com/cosmos/cosmos-sdk/types"

type ExtractSequenceWitnessTC struct {
	Input  HexBytes `json:"input"`
	Output uint32   `json:"output"`
}

// TODO: Why is this output in bytes instead of uint?
type ExtractSequenceLEWitnessTC struct {
	Input  HexBytes `json:"input"`
	Output HexBytes `json:"output"`
}

type ExtractSequenceLegacyTC struct {
	Input  HexBytes `json:"input"`
	Output uint32   `json:"output"`
}

type ExtractSequenceLegacyError struct {
	Input        HexBytes `json:"input"`
	ErrorMessage string   `json:"errorMessage"`
}

// TODO: Why is this output in bytes instead of uint?
type ExtractSequenceLELegacyTC struct {
	Input  HexBytes `json:"input"`
	Output HexBytes `json:"output"`
}

type ExtractSequenceLELegacyError struct {
	Input        HexBytes `json:"input"`
	ErrorMessage string   `json:"errorMessage"`
}

type Hash160TC struct {
	Input  HexBytes `json:"input"`
	Output HexBytes `json:"output"`
}

type Hash256TC struct {
	Input  HexBytes `json:"input"`
	Output HexBytes `json:"output"`
}

type BytesToBigUintTC struct {
	Input  HexBytes `json:"input"`
	Output uint     `json:"output"`
}

type ExtractOutpointTC struct {
	Input  HexBytes `json:"input"`
	Output HexBytes `json:"output"`
}

type ExtractOutputScriptLenTC struct {
	Input  HexBytes `json:"input"`
	Output uint     `json:"output"`
}

type ExtractHashTC struct {
	Input  HexBytes `json:"input"`
	Output HexBytes `json:"output"`
}

type ExtractHashError struct {
	Input        HexBytes `json:"input"`
	ErrorMessage string   `json:"errorMessage"`
}

type ExtractValueTC struct {
	Input  HexBytes `json:"input"`
	Output uint     `json:"output"`
}

type ExtractValueLETC struct {
	Input  HexBytes `json:"input"`
	Output HexBytes `json:"output"`
}

type ExtractOpReturnDataTC struct {
	Input  HexBytes `json:"input"`
	Output HexBytes `json:"output"`
}

type ExtractOpReturnDataError struct {
	Input        HexBytes `json:"input"`
	ErrorMessage string   `json:"errorMessage"`
}

type ExtractInputAtIndexInput struct {
	Vin   HexBytes `json:"vin"`
	Index uint     `json:"index"`
}

type ExtractInputAtIndexTC struct {
	Input  ExtractInputAtIndexInput `json:"input"`
	Output HexBytes                 `json:"output"`
}

type ExtractInputAtIndexError struct {
	Input        ExtractInputAtIndexInput `json:"input"`
	ErrorMessage string                   `json:"errorMessage"`
}

type IsLegacyInputTC struct {
	Input  HexBytes `json:"input"`
	Output bool     `json:"output"`
}

type DetermineInputLengthTC struct {
	Input  HexBytes `json:"input"`
	Output uint64   `json:"output"`
}

type ExtractScriptSigTC struct {
	Input  HexBytes `json:"input"`
	Output HexBytes `json:"output"`
}

type ExtractScriptSigError struct {
	Input        HexBytes `json:"input"`
	ErrorMessage string   `json:"errorMessage"`
}

type ExtractScriptSigLenTC struct {
	Input  HexBytes `json:"input"`
	Output []uint64 `json:"output"`
}

type ValidateVinTC struct {
	Input  HexBytes `json:"input"`
	Output bool     `json:"output"`
}

type ValidateVoutTC struct {
	Input  HexBytes `json:"input"`
	Output bool     `json:"output"`
}

type ExtractInputTxIDLETC struct {
	Input  HexBytes      `json:"input"`
	Output Hash256Digest `json:"output"`
}

/****** NEW *******/

type ExtractTxIndexLETC struct {
	Input  HexBytes `json:"input"`
	Output HexBytes `json:"output"`
}

type ExtractTxIndexTC struct {
	Input  HexBytes `json:"input"`
	Output uint     `json:"output"`
}

type DetermineOutputLengthTC struct {
	Input  HexBytes `json:"input"`
	Output uint64   `json:"output"`
}

type DetermineOutputLengthError struct {
	Input        HexBytes `json:"input"`
	ErrorMessage string   `json:"errorMessage"`
}

type ExtractOutputAtIndexInput struct {
	Vout  HexBytes `json:"vout"`
	Index uint     `json:"index"`
}
type ExtractOutputAtIndexTC struct {
	Input  ExtractOutputAtIndexInput `json:"input"`
	Output HexBytes                  `json:"output"`
}

type ExtractOutputAtIndexError struct {
	Input        ExtractOutputAtIndexInput `json:"input"`
	ErrorMessage string                    `json:"errorMessage"`
}

type ExtractTargetTC struct {
	Input  RawHeader `json:"input"`
	Output HexBytes  `json:"output"`
}

type ExtractTimestampTC struct {
	Input  RawHeader `json:"input"`
	Output uint      `json:"output"`
}

type Hash256MerkleStepTC struct {
	Input  []HexBytes    `json:"input"`
	Output Hash256Digest `json:"output"`
}

type VerifyHash256MerkleInput struct {
	Proof HexBytes `json:"proof"`
	Index uint     `json:"index"`
}

type VerifyHash256MerkleTC struct {
	Input  VerifyHash256MerkleInput `json:"input"`
	Output bool                     `json:"output"`
}

type Retarget struct {
	Hash       Hash256Digest `json:"hash"`
	Version    uint          `json:"version"`
	PrevBlock  Hash256Digest `json:"prev_block"`
	MerkleRoot Hash256Digest `json:"merkle_root"`
	Timestamp  uint          `json:"timestamp"`
	Nbits      HexBytes      `json:"nbits"`
	Nonce      HexBytes      `json:"nonce"`
	Difficulty uint64        `json:"difficulty"`
	Hex        RawHeader     `json:"hex"`
	Height     uint32        `json:"height"`
}

type RetargetAlgorithmTC struct {
	Input  []Retarget `json:"input"`
	Output uint64     `json:"output"`
}

type CalculateDifficultyTC struct {
	Input  sdk.Uint `json:"input"`
	Output sdk.Int  `json:"output"`
}
