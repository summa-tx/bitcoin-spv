import json
import unittest

from unittest import mock

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

        self.bad_headers = [
            ser.dict_to_relay_header(p['header'])
            for p in self.proof_vectors['badHeaders']
        ]

        with mock.patch('btcspv.ser.tx'):
            self.bad_proofs = [
                ser.dict_to_spv_proof(p['proof'])
                for p in self.proof_vectors['badSPVProofs']
            ]

    def test_validate_vin(self):
        for proof in self.valid_proofs:
            self.assertEqual(
                validate_spv.validate_vin(proof['vin']),
                True)

        invalid_proof = self.valid_proofs[0].copy()
        invalid_proof['vin'] = bytes.fromhex('00')
        self.assertEqual(
            validate_spv.validate_vin(invalid_proof['vin']),
            False
        )

    def test_validate_vout(self):
        for proof in self.valid_proofs:
            self.assertEqual(
                validate_spv.validate_vout(proof['vout']),
                True)

        invalid_proof = self.valid_proofs[0].copy()
        invalid_proof['vout'] = bytes.fromhex('f12b34efcd')
        self.assertEqual(
            validate_spv.validate_vout(invalid_proof['vout']),
            False
        )

    def test_extract_merkle_root_le(self):
        cases = self.vectors['extractMerkleRootLE']

        for case in cases:
            input = bytes.fromhex(case['input'][2:])
            output = bytes.fromhex(case['output'][2:])

            self.assertEqual(
                validate_spv.extract_merkle_root_le(input),
                output
            )

    def test_extract_prev_block_le(self):
        cases = self.vectors['extractPrevBlockLE']

        for case in cases:
            input = bytes.fromhex(case['input'][2:])
            output = bytes.fromhex(case['output'][2:])

            self.assertEqual(
                validate_spv.extract_prev_block_le(input),
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

        for header in self.bad_headers:
            self.assertEqual(
                validate_spv.validate_header(header),
                False
            )

    def test_validate_spvproof(self):
        for proof in self.valid_proofs:
            self.assertEqual(
                validate_spv.validate_spvproof(proof),
                True
            )

        for proof in self.bad_proofs:
            self.assertEqual(
                validate_spv.validate_spvproof(proof),
                False
            )

        invalid_header_proof = self.valid_proofs[0].copy()
        invalid_header_proof['confirming_header'][
            'merkle_root'
        ] = bytes.fromhex(
            'c61ac92842abc82aa93644b190fc18ad46c6738337e78bc0c69ab21c5d5ee2dd'
        )

        self.assertEqual(
            validate_spv.validate_spvproof(invalid_header_proof),
            False
        )
