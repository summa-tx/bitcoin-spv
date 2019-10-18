import json
import unittest

from btcspv import utils


class TestSer(unittest.TestCase):
    def setUp(self):
        f = open('../testVectors.json')
        self.vectors = json.loads(f.read())

    def test_verify_proof(self):
        cases = self.vectors['verifyHash256Merkle']

        for case in cases:
            proof = bytes.fromhex(case['input']['proof'][2:])
            index = case['input']['index']

            self.assertEqual(
                utils.verify_proof(proof, index),
                case['output'])
