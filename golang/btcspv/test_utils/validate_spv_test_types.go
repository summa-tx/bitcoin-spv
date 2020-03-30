package testutils

import sdk "github.com/cosmos/cosmos-sdk/types"

type ProveInput struct {
	TxIdLE       Hash256Digest `json:"txIdLE"`
	MerkleRootLE Hash256Digest `json:"merkleRootLE"`
	Proof        HexBytes      `json:"proof"`
	Index        uint          `json:"index"`
}

type ProveTC struct {
	Input  ProveInput `json:"input"`
	Output bool       `json:"output"`
}

type CalculateTxIDTC struct {
	Input  SPVProof      `json:"input"`
	Output Hash256Digest `json:"output"`
}

type ValidateHeaderWorkInput struct {
	Digest Hash256Digest `json:"digest"`
	Target sdk.Uint      `json:"target"`
}

type ValidateHeaderWorkTC struct {
	Input  ValidateHeaderWorkInput `json:"input"`
	Output bool                    `json:"output"`
}

type ValidateHeaderPrevHashInput struct {
	Header   RawHeader     `json:"header"`
	PrevHash Hash256Digest `json:"prevHash"`
}

type ValidateHeaderPrevHashTC struct {
	Input  ValidateHeaderPrevHashInput `json:"input"`
	Output bool                        `json:"output"`
}

type ValidateHeaderChainTC struct {
	Input  HexBytes `json:"input"`
	Output uint64   `json:"output"`
}

type ValidateHeaderChainError struct {
	Input        HexBytes `json:"input"`
	ErrorMessage string   `json:"golangError"`
}
