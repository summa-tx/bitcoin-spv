import os
import unittest
from unittest import mock

import scripts
from scripts import merkle
from scripts.tests import helpers

class MerkleTest(unittest.TestCase):

    def setUp(self):
        pass

    @unittest.skip('TODO')
    def test_get_client(self):
        pass

    @unittest.skip('TODO')
    def test_setup_client(self):
        pass

    @unittest.skip('TODO')
    def test_make_ether_data(self):
        pass

    @unittest.skip('TODO')
    def test_get_latest_blockheight(self):
        pass

    @unittest.skip('TODO')
    def test_get_block_merkle_root(self):
        pass

    @unittest.skip('TODO')
    def test_get_tx_from_api(self):
        pass

    @unittest.skip('TODO')
    def test_get_header_chain(self):
        pass

    @unittest.skip('TODO')
    def test_get_merkle_proof_from_api(self):
        pass

    @unittest.skip('TODO')
    def test_verify_proof(self):
        pass

    @unittest.skip('TODO')
    def test_do_it_all(self):
        pass

    def test_parse_args(self):
        args = merkle.parse_args(['merkle.py', helpers.tx_id, helpers.num_headers])
        self.assertEqual(args.tx_id, helpers.tx_id)
        self.assertEqual(args.num_headers, int(helpers.num_headers))

    def test_main(self):
        with self.assertRaises(SystemExit):
            merkle.main(['merkle.py']) 
