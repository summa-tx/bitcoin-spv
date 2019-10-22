import json
import unittest

from btcspv import validate_spv

from btcspv.types import RelayHeader, SPVProof


class TestSer(unittest.TestCase):
    def setUp(self):
        f = open('../testVectors.json')
        self.vectors = json.loads(f.read())

        p = open('../testProofs.json')
        self.proofs = json.loads(p.read())

        # parse valid string and return list
        valid = json.loads(self.proofs['valid'][0])
        # change list data to SPVProof
        self.valid = SPVProof(valid)
        # deserialize data, TODO: Put deserialize in own function?
        for value in self.valid:
            if isinstance(self.valid[f'{value}'], str):
                self.valid[f'{value}'] = bytes.fromhex(
                    self.valid[f'{value}'][2:]
                )

        # deserialize confirming_header
        self.valid['confirming_header'] = RelayHeader(
            self.valid['confirming_header']
        )
        for value in self.valid['confirming_header']:
            if isinstance(self.valid['confirming_header'][f'{value}'], str):
                self.valid['confirming_header'][f'{value}'] = bytes.fromhex(
                    self.valid['confirming_header'][f'{value}'][2:]
                )

    # def test_validate_vin(self):
    #     # TODO: need a sample tx dict to go in valid SPVProof
    #     self.assertEqual(
    #         validate_spv.validate_vin(self.valid),
    #         True
    #     )

    def test_extract_merkle_root_le(self):
        cases = self.vectors['extractMerkleRootBE']

        for case in cases:
            input = bytes.fromhex(case['input'][2:])
            output_be = bytes.fromhex(case['output'][2:])
            output_le = output_be[::-1]

            self.assertEqual(
                validate_spv.extract_merkle_root_le(input),
                output_le
            )

    def test_extract_prev_block_le(self):
        cases = self.vectors['extractPrevBlockBE']

        for case in cases:
            input = bytes.fromhex(case['input'][2:])
            output_be = bytes.fromhex(case['output'][2:])
            output_le = output_be[::-1]

            self.assertEqual(
                validate_spv.extract_prev_block_le(input),
                output_le
            )

    def test_extract_prev_block_be(self):
        cases = self.vectors['extractPrevBlockBE']

        for case in cases:
            input = bytes.fromhex(case['input'][2:])
            output = bytes.fromhex(case['output'][2:])

            self.assertEqual(
                validate_spv.extract_prev_block_be(input),
                output
            )

    def test_prove(self):
        cases = self.vectors['prove']

        for case in cases:
            tx_id = bytes.fromhex(case['input']['txIdLE'][2:])
            merkle_root = bytes.fromhex(case['input']['merkleRootLE'][2:])
            proof = bytes.fromhex(case['input']['proof'][2:])
            index = case['input']['index']

            self.assertEqual(
                validate_spv.prove(tx_id, merkle_root, proof, index),
                case['output']
            )

    def test_validate_header(self):
        self.assertEqual(
            validate_spv.validate_header(self.valid['confirming_header']),
            True
        )

    def test_validate_spvproof(self):
        self.assertEqual(
            validate_spv.validate_spvproof(self.valid),
            True
        )
