import json
import unittest

from btcspv import ser, validate_spv


class TestValidateSPV(unittest.TestCase):
    def setUp(self):
        f = open('../testVectors.json')
        self.vectors = json.loads(f.read())

        p = open('../testProofs.json')
        self.proof_vectors = json.loads(p.read())

        self.valid_proofs = [
            ser.deserialize_spv_proof(p) for p in self.proof_vectors['valid']
        ]

    def test_validate_vin(self):
        # TODO: need a sample tx dict to go in valid SPVProof
        for proof in self.valid_proofs:
            self.assertEqual(
                validate_spv.validate_vin(proof),
                True)

    def test_validate_vout(self):
        # TODO: need a sample tx dict to go in valid SPVProof
        for proof in self.valid_proofs:
            self.assertEqual(
                validate_spv.validate_vout(proof),
                True)

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
        for proof in self.valid_proofs:
            self.assertEqual(
                validate_spv.validate_header(proof['confirming_header']),
                True
            )

    def test_validate_spvproof(self):
        for proof in self.valid_proofs:
            self.assertEqual(
                validate_spv.validate_spvproof(proof),
                True
            )
