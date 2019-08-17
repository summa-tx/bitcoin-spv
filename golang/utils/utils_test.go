package utils

import (
	"bytes"
	"encoding/hex"
	"log"
	"testing"

	"github.com/stretchr/testify/assert"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

func TestReverseEndianness(t *testing.T) {
	testbytes := []byte{1, 2, 3}
	reversed := ReverseEndianness(testbytes)
	assert.Equal(t, reversed, []byte{3, 2, 1})
	assert.NotEqual(t, reversed, []byte{1, 2, 3})
	assert.Equal(t, len(reversed), len(testbytes))
}

func TestLastBytes(t *testing.T) {
	testbytes := []byte{1, 2, 3, 4}
	last := LastBytes(testbytes, 1)
	assert.Equal(t, last, []byte{4})
}

// func TestHash160(t *testing.T) {
// 	testString := "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
// 	compareString := "1b60c31dba9403c74d81af255f0c300bfed5faa3"

// 	decodedTest, errTest := hex.DecodeString(testString)
// 	if errTest != nil {
// 		log.Fatal(errTest)
// 	}

// 	decodedCompare, errCompare := hex.DecodeString(compareString)
// 	if errCompare != nil {
// 		log.Fatal(errCompare)
// 	}

// 	hashed := Hash160(decodedTest)

// 	assert.Equal(t, hashed, decodedCompare)
// }

func TestHash256(t *testing.T) {
	testString := "00"
	compareString := "1406e05881e299367766d313e26c05564ec91bf721d31726bd6e46e60689539a"

	decodedTest, errTest := hex.DecodeString(testString)
	if errTest != nil {
		log.Fatal(errTest)
	}

	decodedCompare, errCompare := hex.DecodeString(compareString)
	if errCompare != nil {
		log.Fatal(errCompare)
	}

	hashed := Hash256(decodedTest)

	assert.Equal(t, hashed, decodedCompare)
}

func TestBytesToUint(t *testing.T) {
	decode, _ := hex.DecodeString("00")
	res := bytesToUint(decode)
	assert.Equal(t, res, uint(0))

	decode, _ = hex.DecodeString("ff")
	res = bytesToUint(decode)
	assert.Equal(t, res, uint(255))

	decode, _ = hex.DecodeString("00ff")
	res = bytesToUint(decode)
	assert.Equal(t, res, uint(255))

	decode, _ = hex.DecodeString("ff00")
	res = bytesToUint(decode)
	assert.Equal(t, res, uint(65280))

	decode, _ = hex.DecodeString("01")
	res = bytesToUint(decode)
	assert.Equal(t, res, uint(1))

	decode, _ = hex.DecodeString("0001")
	res = bytesToUint(decode)
	assert.Equal(t, res, uint(1))

	decode, _ = hex.DecodeString("0100")
	res = bytesToUint(decode)
	assert.Equal(t, res, uint(256))
}

func TestBytesToBigInt(t *testing.T) {
	hexString := "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
	decoded, _ := hex.DecodeString(hexString)

	buf := bytes.Buffer{}
	buf.WriteString("0x")
	buf.WriteString(hexString)

	expected, _ := sdk.NewIntFromString(buf.String())
	result := BytesToBigInt(decoded)

	assert.True(t, expected.Equal(result))
}

//   it('extracts a sequence from a witness input as LE and int', () => {
//     const input = utils.deserializeHex(constants.OP_RETURN.INPUTS);

//     let res = BTCUtils.extractSequenceLEWitness(input);
//     const arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0xffffffff'));
//     assert.isTrue(arraysAreEqual);

//     res = BTCUtils.extractSequenceWitness(input);
//     assert.equal(res, BigInt(4294967295));
//   });
func TestExtractSequenceWitness(t *testing.T) {
	t.Skip()
}

func TestExtractSequenceLEWitness(t *testing.T) {
	t.Skip()
}

func TestExtractSequenceLegacy(t *testing.T) {
	decodeTest, _ := hex.DecodeString("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000203232323232323232323232323232323232323232323232323232323232323232ffffffff")
	res := ExtractSequenceLegacy(decodeTest)

	assert.Equal(t, res, uint(4294967295))

}

func TestExtractSequenceLELegacy(t *testing.T) {
	decodeTest, _ := hex.DecodeString("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000203232323232323232323232323232323232323232323232323232323232323232ffffffff")
	res := ExtractSequenceLELegacy(decodeTest)

	decodeAnswer, _ := hex.DecodeString("ffffffff")

	assert.Equal(t, res, decodeAnswer)

}

//   it('extracts an outpoint as bytes', () => {
//     const input = constants.OP_RETURN.INPUTS;
//     const res = BTCUtils.extractOutpoint(utils.deserializeHex(input));
//     const u8aValue = utils.deserializeHex('0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000');
//     const arraysAreEqual = utils.typedArraysAreEqual(res, u8aValue);
//     assert.isTrue(arraysAreEqual);
//   });
func TestExtractOutpoint(t *testing.T) {
	t.Skip()
}

//   /* Witness Output */
//   it('extracts the length of the output script', () => {
//     const output = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT);
//     const opReturnOutput = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT);

//     let res = BTCUtils.extractOutputScriptLen(output);
//     assert.equal(res, 0x22);

//     res = BTCUtils.extractOutputScriptLen(opReturnOutput);
//     assert.equal(res, 0x16);
//   });
func TestExtractOuputScriptLen(t *testing.T) {
	t.Skip()
}

//   it('extracts the hash from an output', () => {
//     const output = constants.OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT;
//     const opReturnOutput = constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT;

//     let res = BTCUtils.extractHash(utils.deserializeHex(output));
//     let arraysAreEqual = utils.typedArraysAreEqual(
//       res,
//       utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].PAYLOAD)
//     );
//     assert.isTrue(arraysAreEqual);

//     try {
//       BTCUtils.extractHash(utils.deserializeHex(opReturnOutput));
//       assert(false, 'expected an error');
//     } catch (e) {
//       assert.include(e.message, 'Nonstandard, OP_RETURN, or malformatted output');
//     }

//     // malformatted witness
//     try {
//       BTCUtils.extractHash(utils.deserializeHex('0x0000000000000000220017'));
//       assert(false, 'expected an error');
//     } catch (e) {
//       assert.include(e.message, 'Maliciously formatted witness output.');
//     }

//     // malformatted p2pkh
//     try {
//       BTCUtils.extractHash(utils.deserializeHex('0x00000000000000001976a912'));
//       assert(false, 'expected an error');
//     } catch (e) {
//       assert.include(e.message, 'Maliciously formatted p2pkh output.');
//     }

//     // malformatted p2pkh
//     try {
//       BTCUtils.extractHash(utils.deserializeHex('0x00000000000000001976a914FFFF'));
//       assert(false, 'expected an error');
//     } catch (e) {
//       assert.include(e.message, 'Maliciously formatted p2pkh output.');
//     }

//     // good p2pkh
//     res = BTCUtils.extractHash(utils.deserializeHex('0x00000000000000001976a914000000000000000000000000000000000000000088ac'));
//     arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex(`0x${'00'.repeat(20)}`));
//     assert.isTrue(arraysAreEqual);

//     // malformatted p2sh
//     try {
//       BTCUtils.extractHash(utils.deserializeHex('0x000000000000000017a914FF'));
//       assert(false, 'expected an error');
//     } catch (e) {
//       assert.include(e.message, 'Maliciously formatted p2sh output.');
//     }

//     // good p2sh
//     res = BTCUtils.extractHash(utils.deserializeHex('0x000000000000000017a914000000000000000000000000000000000000000087'));
//     arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex(`0x${'00'.repeat(20)}`));
//     assert.isTrue(arraysAreEqual);
//   });
func TestExtractHash(t *testing.T) {
	t.Skip()
}

//   it('extracts the value as LE and int', () => {
//     let res;
//     let arraysAreEqual;

//     const output = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT);
//     const outputLERes = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].VALUE_LE);

//     res = BTCUtils.extractValueLE(output);
//     arraysAreEqual = utils.typedArraysAreEqual(res, outputLERes);
//     assert.isTrue(arraysAreEqual);

//     res = BTCUtils.extractValue(output);
//     assert.equal(res, BigInt(497480));

//     const opReturnOutput = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT);
//     const opReturnLERes = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].VALUE_LE);

//     res = BTCUtils.extractValueLE(opReturnOutput);
//     arraysAreEqual = utils.typedArraysAreEqual(res, opReturnLERes);
//     assert.isTrue(arraysAreEqual);

//     res = BTCUtils.extractValue(opReturnOutput);
//     assert.equal(res, BigInt(0));
//   });
func TestExtractValue(t *testing.T) {
	t.Skip()
}

func TestExtractValueLE(t *testing.T) {
	t.Skip()
}

//   it('extracts op_return data blobs', () => {
//     const output = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT);
//     const opReturnOutput = utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT);

//     const res = BTCUtils.extractOpReturnData(opReturnOutput);
//     const arraysAreEqual = utils.typedArraysAreEqual(
//       res,
//       utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].PAYLOAD)
//     );
//     assert.isTrue(arraysAreEqual);

//     try {
//       BTCUtils.extractOpReturnData(output);
//       assert(false, 'expected an error');
//     } catch (e) {
//       assert.include(e.message, 'Malformatted data. Must be an op return.');
//     }
//   });
func TestExtractOpReturnData(t *testing.T) {
	t.Skip()
}

//   it('extracts inputs at specified indices', () => {
//     let res = BTCUtils.extractInputAtIndex(utils.deserializeHex(constants.OP_RETURN.VIN), 0);
//     let arraysAreEqual = utils.typedArraysAreEqual(
//       res,
//       utils.deserializeHex(constants.OP_RETURN.INPUTS)
//     );
//     assert.isTrue(arraysAreEqual);

//     res = BTCUtils.extractInputAtIndex(TWO_IN_TX_VIN, 0);
//     arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0x7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab3750000000000ffffffff'));
//     assert.isTrue(arraysAreEqual);

//     res = BTCUtils.extractInputAtIndex(TWO_IN_TX_VIN, 1);
//     arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0xaa15ec17524f1f7bd47ab7caa4c6652cb95eec4c58902984f9b4bcfee444567d0000000000ffffffff'));
//     assert.isTrue(arraysAreEqual);
//   });
func TestExtractInputAtIndex(t *testing.T) {
	t.Skip()
}

//   it('sorts legacy from witness inputs', () => {
//     const input = constants.OP_RETURN.INPUTS;
//     let res;
//     res = BTCUtils.isLegacyInput(utils.deserializeHex(input));
//     assert.isFalse(res);

//     res = BTCUtils.isLegacyInput(utils.deserializeHex('0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000001eeffffffff'));
//     assert.isTrue(res);
//   });
func TestIsLegacyInput(t *testing.T) {
	// TODO: first test
	decode, _ := hex.DecodeString("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000001eeffffffff")
	res := IsLegacyInput(decode)
	assert.Equal(t, res, true)
}

func TestDetermineInputLength(t *testing.T) {
	decode, _ := hex.DecodeString("7bb2b8f32b9ebf13af2b0a2f9dc03797c7b77ccddcac75d1216389abfa7ab3750000000000ffffffffaa15ec17524f1f7bd47ab7caa4c6652cb95eec4c58902984f9b4bcfee444567d0000000000ffffff")
	res := DetermineInputLength(decode)
	assert.Equal(t, res, uint(41))

	decode, _ = hex.DecodeString("dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd040000000000000000")
	res = DetermineInputLength(decode)
	assert.Equal(t, res, uint(41))

	decode, _ = hex.DecodeString("dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd0400000002000000000000")
	res = DetermineInputLength(decode)
	assert.Equal(t, res, uint(43))

	decode, _ = hex.DecodeString("dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd040000000900000000000000000000000000")
	res = DetermineInputLength(decode)
	assert.Equal(t, res, uint(50))

	decode, _ = hex.DecodeString("dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd04000000fdff0000000000")
	res = DetermineInputLength(decode)
	assert.Equal(t, res, uint(298))

}

//   it('extracts the scriptSig from inputs', () => {
//     let res;
//     let arraysAreEqual;
//     res = BTCUtils.extractScriptSig(utils.deserializeHex(constants.OP_RETURN.INPUTS));
//     arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0x00'));
//     assert.isTrue(arraysAreEqual);

//     res = BTCUtils.extractScriptSig(utils.deserializeHex('0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000001eeffffffff'));
//     arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0x01ee'));
//     assert.isTrue(arraysAreEqual);

//     res = BTCUtils.extractScriptSig(utils.deserializeHex('0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000fd0100eeffffffff'));
//     arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0xfd0100ee'));
//     assert.isTrue(arraysAreEqual);

//     res = BTCUtils.extractScriptSig(utils.deserializeHex('0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000fe01000000eeffffffff'));
//     arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0xfe01000000ee'));
//     assert.isTrue(arraysAreEqual);
//   });
func TestExtractScriptSig(t *testing.T) {
	// TODO: first test
	decodeTest, _ := hex.DecodeString("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000001eeffffffff")
	res := ExtractScriptSig(decodeTest)
	decodeAnswer, _ := hex.DecodeString("01ee'")
	assert.Equal(t, res, decodeAnswer)

	decodeTest, _ = hex.DecodeString("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000fd0100eeffffffff")
	res = ExtractScriptSig(decodeTest)
	decodeAnswer, _ = hex.DecodeString("fd0100ee")
	assert.Equal(t, res, decodeAnswer)

	decodeTest, _ = hex.DecodeString("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000fe01000000eeffffffff")
	res = ExtractScriptSig(decodeTest)
	decodeAnswer, _ = hex.DecodeString("fe01000000ee")
	assert.Equal(t, res, decodeAnswer)
}

//   it('extracts the length of the VarInt and scriptSig from inputs', () => {
//     let res;
//     res = BTCUtils.extractScriptSigLen(utils.deserializeHex(constants.OP_RETURN.INPUTS));
//     assert.equal(res.dataLen, BigInt(0));
//     assert.equal(res.scriptSigLen, BigInt(0));

//     res = BTCUtils.extractScriptSigLen(utils.deserializeHex('0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000001eeffffffff'));
//     assert.equal(res.dataLen, BigInt(0));
//     assert.equal(res.scriptSigLen, BigInt(1));

//     res = BTCUtils.extractScriptSigLen(utils.deserializeHex('0x1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000FF0000000000000000ffffffff'));
//     assert.equal(res.dataLen, BigInt(8));
//     assert.equal(res.scriptSigLen, BigInt(0));
//   });
func TestExtractScriptSigLen(t *testing.T) {
	// TODO: write first test

	decode, _ := hex.DecodeString("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000001eeffffffff")
	dataLen, scriptSigLen := ExtractScriptSigLen(decode)
	assert.Equal(t, dataLen, uint(0))
	assert.Equal(t, scriptSigLen, uint(1))

	decode, _ = hex.DecodeString("1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba3000000000FF0000000000000000ffffffff")
	dataLen, scriptSigLen = ExtractScriptSigLen(decode)
	assert.Equal(t, dataLen, uint(8))
	assert.Equal(t, scriptSigLen, uint(0))

}

//   it('validates vin length based on stated size', () => {
//     let res;

//     // valid
//     res = BTCUtils.validateVin(utils.deserializeHex(constants.OP_RETURN.VIN));
//     assert.isTrue(res);

//     // too many inputs stated
//     res = BTCUtils.validateVin(utils.deserializeHex('0xFF1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff'));
//     assert.isFalse(res);

//     // no inputs stated
//     res = BTCUtils.validateVin(utils.deserializeHex('0x001746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff'));
//     assert.isFalse(res);

//     // fewer bytes in vin than stated
//     res = BTCUtils.validateVin(utils.deserializeHex('0x011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffff'));
//     assert.isFalse(res);

//     // more bytes in vin than stated
//     res = BTCUtils.validateVin(utils.deserializeHex('0x011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffffEEEEE'));
//     assert.isFalse(res);
//   });
func TestValidateVin(t *testing.T) {
	// TODO: write first test
	decode, _ := hex.DecodeString("FF1746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff")
	res := ValidateVin(decode)
	assert.Equal(t, res, false)

	decode, _ = hex.DecodeString("001746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffff")
	res = ValidateVin(decode)
	assert.Equal(t, res, false)

	decode, _ = hex.DecodeString("011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffff")
	res = ValidateVin(decode)
	assert.Equal(t, res, false)

	decode, _ = hex.DecodeString("011746bd867400f3494b8f44c24b83e1aa58c4f0ff25b4a61cffeffd4bc0f9ba300000000000ffffffffEEEEE")
	res = ValidateVin(decode)
	assert.Equal(t, res, false)

}

//   it('validates vout length based on stated size', () => {
//     let res;

//     // valid
//     res = BTCUtils.validateVout(utils.deserializeHex(constants.OP_RETURN.VOUT));
//     assert.isTrue(res);

//     // too many outputs stated
//     res = BTCUtils.validateVout(utils.deserializeHex('0xFF4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211'));
//     assert.isFalse(res);

//     // no outputs stated
//     res = BTCUtils.validateVout(utils.deserializeHex('0x004897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211'));
//     assert.isFalse(res);

//     // fewer bytes in vout than stated
//     res = BTCUtils.validateVout(utils.deserializeHex('0x024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b078952'));
//     assert.isFalse(res);

//     // more bytes in vout than stated
//     res = BTCUtils.validateVout(utils.deserializeHex('0x024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b078952111111111111111'));
//     assert.isFalse(res);
//   });
func TestValidateVout(t *testing.T) {
	// TODO: write first test
	decode, _ := hex.DecodeString("FF4897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211")
	res := ValidateVin(decode)
	assert.Equal(t, res, false)

	decode, _ = hex.DecodeString("004897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b07895211")
	res = ValidateVin(decode)
	assert.Equal(t, res, false)

	decode, _ = hex.DecodeString("024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b078952")
	res = ValidateVin(decode)
	assert.Equal(t, res, false)

	decode, _ = hex.DecodeString("024897070000000000220020a4333e5612ab1a1043b25755c89b16d55184a42f81799e623e6bc39db8539c180000000000000000166a14edb1b5c2f39af0fec151732585b1049b078952111111111111111")
	res = ValidateVin(decode)
	assert.Equal(t, res, false)

}

//   it('determines output length properly', () => {
//     let res;
//     res = BTCUtils.determineOutputLength(utils.deserializeHex('0x00000000000000002200'));
//     assert.equal(res, BigInt(43));

//     res = BTCUtils.determineOutputLength(utils.deserializeHex('0x00000000000000001600'));
//     assert.equal(res, BigInt(31));

//     res = BTCUtils.determineOutputLength(utils.deserializeHex('0x0000000000000000206a'));
//     assert.equal(res, BigInt(41));

//     res = BTCUtils.determineOutputLength(utils.deserializeHex('0x000000000000000002'));
//     assert.equal(res, BigInt(11));

//     res = BTCUtils.determineOutputLength(utils.deserializeHex('0x000000000000000000'));
//     assert.equal(res, BigInt(9));

//     res = BTCUtils.determineOutputLength(utils.deserializeHex('0x000000000000000088'));
//     assert.equal(res, BigInt(145));

//     try {
//       res = BTCUtils.determineOutputLength(utils.deserializeHex('0x0000000000000000FF00'));
//       assert(false, 'Expected an error');
//     } catch (e) {
//       assert.include(e.message, 'Multi-byte VarInts not supported');
//     }
//   });
func TestDetermineOutputLength(t *testing.T) {
	decode, _ := hex.DecodeString("00000000000000002200")
	res := DetermineOutputLength(decode)
	assert.Equal(t, res, uint(43))

	decode, _ = hex.DecodeString("00000000000000001600")
	res = DetermineOutputLength(decode)
	assert.Equal(t, res, uint(31))

	decode, _ = hex.DecodeString("0000000000000000206a")
	res = DetermineOutputLength(decode)
	assert.Equal(t, res, uint(41))

	decode, _ = hex.DecodeString("000000000000000002")
	res = DetermineOutputLength(decode)
	assert.Equal(t, res, uint(11))

	decode, _ = hex.DecodeString("000000000000000000")
	res = DetermineOutputLength(decode)
	assert.Equal(t, res, uint(9))

	decode, _ = hex.DecodeString("000000000000000088")
	res = DetermineOutputLength(decode)
	assert.Equal(t, res, uint(145))

	// TODO: write test for error handling

}

//   it('extracts outputs at specified indices', () => {
//     let res;
//     let arraysAreEqual;
//     res = BTCUtils.extractOutputAtIndex(utils.deserializeHex(constants.OP_RETURN.VOUT), 0);
//     arraysAreEqual = utils.typedArraysAreEqual(
//       res,
//       utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[0].OUTPUT)
//     );
//     assert.isTrue(arraysAreEqual);

//     res = BTCUtils.extractOutputAtIndex(utils.deserializeHex(constants.OP_RETURN.VOUT), 1);
//     arraysAreEqual = utils.typedArraysAreEqual(
//       res,
//       utils.deserializeHex(constants.OP_RETURN.INDEXED_OUTPUTS[1].OUTPUT)
//     );
//     assert.isTrue(arraysAreEqual);

//     res = BTCUtils.extractOutputAtIndex(TWO_IN_TX_VOUT, 0);
//     arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0x4db6000000000000160014455c0ea778752831d6fc25f6f8cf55dc49d335f0'));

//     res = BTCUtils.extractOutputAtIndex(TWO_IN_TX_VOUT, 1);
//     arraysAreEqual = utils.typedArraysAreEqual(res, utils.deserializeHex('0x40420f0000000000220020aedad4518f56379ef6f1f52f2e0fed64608006b3ccaff2253d847ddc90c91922'));
//   });
func TestExtractOutputAtIndex(t *testing.T) {
	t.Skip()
}

//   it('extracts a root from a header', () => {
//     const res = BTCUtils.extractMerkleRootBE(HEADER_170);
//     const u8aValue = utils.deserializeHex('0x7dac2c5666815c17a3b36427de37bb9d2e2c5ccec3f8633eb91a4205cb4c10ff');
//     const arraysAreEqual = utils.typedArraysAreEqual(res, u8aValue);
//     assert.isTrue(arraysAreEqual);
//   });
func TestExtractMerkleRootBE(t *testing.T) {
	t.Skip()
}

//   it('extracts the target from a header', () => {
//     const res = BTCUtils.extractTarget(HEADER_170);
//     assert.equal(res, BigInt('26959535291011309493156476344723991336010898738574164086137773096960'));
//   });
func TestExtractTarget(t *testing.T) {
	t.Skip()
}

//   it('extracts the prev block hash', () => {
//     const res = BTCUtils.extractPrevBlockBE(HEADER_170);
//     const u8aValue = utils.deserializeHex('0x000000002a22cfee1f2c846adbd12b3e183d4f97683f85dad08a79780a84bd55');
//     const arraysAreEqual = utils.typedArraysAreEqual(res, u8aValue);
//     assert.isTrue(arraysAreEqual);
//   });
func TestExtractPrevBlockHashBE(t *testing.T) {
	t.Skip()
}

//   it('extracts a timestamp from a header', () => {
//     const res = BTCUtils.extractTimestamp(HEADER_170);
//     assert.equal(res, BigInt(1231731025));
//   });
// FIXME: sdk.NewInt stuff doesn't work
func TestExtractTimestamp(t *testing.T) {
	t.Skip()
	decoded, _ := hex.DecodeString("0100000055bd840a78798ad0da853f68974f3d183e2bd1db6a842c1feecf222a00000000ff104ccb05421ab93e63f8c3ce5c2c2e9dbb37de2764b3a3175c8166562cac7d51b96a49ffff001d283e9e70")
	res := ExtractTimestamp(decoded)
	assert.Equal(t, res, sdk.NewInt(int64(1231731025)))
}

//   it('verifies a bitcoin merkle root', () => {
//     let res;
//     res = BTCUtils.verifyHash256Merkle(
//       utils.deserializeHex('0x82501c1178fa0b222c1f3d474ec726b832013f0a532b44bb620cce8624a5feb1169e1e83e930853391bc6f35f605c6754cfead57cf8387639d3b4096c54f18f4ff104ccb05421ab93e63f8c3ce5c2c2e9dbb37de2764b3a3175c8166562cac7d'),
//       0 // 0-indexed
//     );
//     assert.isTrue(res);

//     res = BTCUtils.verifyHash256Merkle(
//       utils.deserializeHex('0x169e1e83e930853391bc6f35f605c6754cfead57cf8387639d3b4096c54f18f482501c1178fa0b222c1f3d474ec726b832013f0a532b44bb620cce8624a5feb1ff104ccb05421ab93e63f8c3ce5c2c2e9dbb37de2764b3a3175c8166562cac7d'),
//       1 // 0-indexed
//     );
//     assert.isTrue(res);

//     res = BTCUtils.verifyHash256Merkle(
//       utils.deserializeHex('0x6c1320f4552ba68f3dbdd91f9422405f779b779e21678448e8035c21c1e2edd67a6190a846e318878be71565841d90a78e9e617b2d859d5e0767c13de427be4a2a6a6d55b17316d45ac11c4e613c38b293db606bace5062470d783471cc66c180455e6472ce92d32179994c3d44b75dd9834e1e7438cf9ab5be1ef6edf1e4a8d361dda470aca6e97c3b4056d4b329beba9ffd6a26c86a2a3f8f9ad31826b69ee49693027a439b3149853907afe87031f3bcf484b8bdd2e047d579d2ee2569c16769a33473b652d1d365886f9f9fba64fdea23ab16306ae1484ed632dcd381e5132c401084bc783478306202844b9cf34aff6ab24182206caa6eebc3e016fa373986d08ac9ae256ddda2deedc6662fd8f8a300ecdd38db2c5d6d2765a7515531e7f96f0310f9493cf79be3e60f63d8a6fa0c62ea59312731fd5b71b261abd99f5b908b3166d53532c9557a0f6ce9bc18f7b7619b2257043052a7ff2e5030e838f2e9edcc0f7273fa273a6b3ce2112dbd686f060b5f61deb1abc7247edf1bd6cd7ca4a6c5cfaedbc5905ef4f0511b143a0672ce4fa2dc1ed8852e077e0184febca'),
//       4 // 0-indexed
//     );
//     assert.isTrue(res);

//     res = BTCUtils.verifyHash256Merkle(OP_RETURN_PROOF, Number(OP_RETURN_INDEX));
//     assert.isTrue(res);

//     res = BTCUtils.verifyHash256Merkle(TWO_IN_PROOF, Number(TWO_IN_INDEX));
//     assert.isTrue(res);

//     // not evenly divisible by 32
//     res = BTCUtils.verifyHash256Merkle(utils.deserializeHex('0x00'), 0);
//     assert.isFalse(res);

//     // 1-hash special case
//     res = BTCUtils.verifyHash256Merkle(utils.deserializeHex('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'), 0);
//     assert.isTrue(res);

//     // 2-hash special case
//     res = BTCUtils.verifyHash256Merkle(utils.deserializeHex('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'), 0);
//     assert.isFalse(res);
//   });
func TestVerifyHash256Merkle(t *testing.T) {
	t.Skip()
}

func TestDetermineVarIntDataLength(t *testing.T) {
	res1 := DetermineVarIntDataLength(uint8(0x01))
	assert.Equal(t, res1, uint8(0))
	res2 := DetermineVarIntDataLength(uint8(0xfd))
	assert.Equal(t, res2, uint8(2))
	res3 := DetermineVarIntDataLength(uint8(0xfe))
	assert.Equal(t, res3, uint8(4))
	res4 := DetermineVarIntDataLength(uint8(0xff))
	assert.Equal(t, res4, uint8(8))
}

//   it('calculates consensus-correct retargets', () => {
//     let firstTimestamp;
//     let secondTimestamp;
//     let previousTarget;
//     let expectedNewTarget;
//     let res;
//     for (let i = 0; i < constants.RETARGET_TUPLES.length; i += 1) {
//       firstTimestamp = constants.RETARGET_TUPLES[i][0].timestamp;
//       secondTimestamp = constants.RETARGET_TUPLES[i][1].timestamp;
//       previousTarget = BTCUtils.extractTarget(
//         utils.deserializeHex(constants.RETARGET_TUPLES[i][1].hex)
//       );
//       expectedNewTarget = BTCUtils.extractTarget(
//         utils.deserializeHex(constants.RETARGET_TUPLES[i][2].hex)
//       );
//       res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
//       // (response & expected) == expected
//       // this converts our full-length target into truncated block target
//       assert.equal(res & expectedNewTarget, expectedNewTarget);

//       secondTimestamp = firstTimestamp + 5 * 2016 * 10 * 60; // longer than 4x
//       res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
//       assert.equal(res / BigInt(4) & previousTarget, previousTarget);

//       secondTimestamp = firstTimestamp + 2016 * 10 * 14; // shorter than 1/4x
//       res = BTCUtils.retargetAlgorithm(previousTarget, firstTimestamp, secondTimestamp);
//       assert.equal(res * BigInt(4) & previousTarget, previousTarget);
//     }
//   });
func TestRetargetAlgorithm(t *testing.T) {
	t.Skip()
}

//   it('extracts difficulty from a header', () => {
//     let actual;
//     let expected;
//     for (let i = 0; i < constants.RETARGET_TUPLES.length; i += 1) {
//       actual = BTCUtils.extractDifficulty(
//         utils.deserializeHex(constants.RETARGET_TUPLES[i][0].hex)
//       );
//       expected = constants.RETARGET_TUPLES[i][0].difficulty;
//       assert.equal(actual, expected);

//       actual = BTCUtils.extractDifficulty(
//         utils.deserializeHex(constants.RETARGET_TUPLES[i][1].hex)
//       );
//       expected = constants.RETARGET_TUPLES[i][1].difficulty;
//       assert.equal(actual, expected);

//       actual = BTCUtils.extractDifficulty(
//         utils.deserializeHex(constants.RETARGET_TUPLES[i][2].hex)
//       );
//       expected = constants.RETARGET_TUPLES[i][2].difficulty;
//       assert.equal(actual, expected);
//     }
//   });
// });
func TestExtractDifficulty(t *testing.T) {
	// var actual sdk.Int
	// var expected sdk.Int
	t.Skip()
}

func TestCalculateDifficulty(t *testing.T) {
	diffOneTarget, _ := sdk.NewIntFromString("0xffff0000000000000000000000000000000000000000000000000000")
	diff := CalculateDifficulty(diffOneTarget)
	assert.True(t, diff.Equal(sdk.NewInt(1)))

	diff256, _ := sdk.NewIntFromString("0xffff00000000000000000000000000000000000000000000000000")
	diff = CalculateDifficulty(diff256)
	assert.True(t, diff.Equal(sdk.NewInt(256)))

	diff65536, _ := sdk.NewIntFromString("0xffff000000000000000000000000000000000000000000000000")
	diff = CalculateDifficulty(diff65536)
	assert.True(t, diff.Equal(sdk.NewInt(65536)))
}
