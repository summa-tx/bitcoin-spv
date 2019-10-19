import json
import unittest

from btcspv import ser


class TestSer(unittest.TestCase):
    def setUp(self):
        f = open('../testProofs.json')
        self.vectors = json.loads(f.read())

    # TODO: clean this up
    def test_deser_roundtrip(self):
        for v in self.vectors['valid']:
            proof = ser.deserialize_spv_proof(v)
            json_proof_string = ser.serialize_spv_proof(proof)
            second_proof = ser.deserialize_spv_proof(json_proof_string)

            self.assertEqual(proof, second_proof)

    def test_deser_header_roundtrip(self):
        for v in self.vectors['validHeader']:
            header = ser.deserialize_relay_header(v)
            json_header_string = ser.serialize_relay_header(header)
            second_header = ser.deserialize_relay_header(json_header_string)

            self.assertEqual(header, second_header)
