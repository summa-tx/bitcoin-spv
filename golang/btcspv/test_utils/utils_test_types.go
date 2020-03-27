package testutils

type EncodeP2SHTC struct {
	Input  HexBytes `json:"input"`
	Output string   `json:"output"`
}

type EncodeP2PKHTC struct {
	Input  HexBytes `json:"input"`
	Output string   `json:"output"`
}

type EncodeP2WSHTC struct {
	Input  Hash256Digest `json:"input"`
	Output string        `json:"output"`
}

type EncodeP2WPKHTC struct {
	Input  HexBytes `json:"input"`
	Output string   `json:"output"`
}
