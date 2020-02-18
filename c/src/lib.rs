#![allow(clippy::unreadable_literal)]

#[cfg(test)]
mod test_utils;

#[cfg(test)]
mod tests {

    use hex;
    use ckb_script::TransactionScriptsVerifier;
    use ckb_types::{
        bytes::Bytes,
        core::{Capacity, DepType, ScriptHashType, TransactionBuilder},
        packed::{Byte32, CellDep, CellInput, CellOutput, Script, OutPoint, WitnessArgs, WitnessArgsBuilder},
        prelude::*
    };

    use lazy_static::lazy_static;
    use crate::test_utils;

    pub const MAX_CYCLES: u64 = std::u64::MAX;

    lazy_static! {
        pub static ref VERIFIER_BIN: Bytes =
            Bytes::from(&include_bytes!("../build/swap-demo-risc")[..]);
    }

    /*
     * Witness:
     * - Inclusion proof
     * --- length-prefixed header vector
     * --- length-prefixed i    ntermediate-node vector
     * --- 4-byte LE tx index number
     * - Bitcoin tx
     * --- 4-byte version number
     * --- length-prefixed input vector
     * --- length-prefixed output vector containing address
     * --- 4-byte locktime number
     */
    fn get_witness_bytes() -> Vec<u8> {
        // 0x01 length prefixed
        // 1 header
        let header_hex = "0100000020767ef0b7300a2bd5730988eb7a45a3336c3bb4666d9c29000000000000000000cc8fe7f2efc0ebea7745696f5e0bd1df7919e11cccf9134815d5ed9529223ab3344a4a5c33d62f174b0aefba";
        // 0x0c == 12 nodes
        let nodes_hex = "0ca6c2967a6128f2e66854dfe887cca0e3069541486376eeb87aec9475ba2937306814a594cc147587f160415b78c562b023e17481e003151a318f23827887802b1ba84d08564da9e092ec48e721c6502a111bc166d92144b30b8a2f85863220b56ccc7bcd7606d5cad6631313eae6c4e8cd7a4894b4c1ab07f15591410a7dbd4ae13e3e74512518fa26afba79bead35953f6ba02d17bfb3df46a8e1362f25bdf5f53ffd98816c004e4d533291b8b803a0b2b89e52a03cad3d35b09047d71cfac11408796d2a660dab99f56600043debce2cdf7164686420d96bb778d7351841741b905fab8d15abd8b91a5fcbbd54c86bbe17e6d8f31efa951fa107d2e781d1f595e47e3402ac3c1a5669008b70e5155db1f74be5ebbafe48ceb3f82779f693eccc6e3997b21da3cf5f82aa237355b090818babbac0aeff272edec319e36cd3deceeb1099cb7c65cbc8fd1be2bf0b08a8df71c3210dc1a9c55095daeebbd4229725e0bcdbd5cc4dae39f3392f1fe9e90b3a05c937c4545030d61c234ef2adb0a5";
        // hex for 310, the tx index in block
        let index = "36010000";
        let tx_hex = "0100000002a4af13e0aed3dda50af3719ab5e25a0155b013c4d7df188bf6fed7873489867e0700000000fdffffff4d455613803475fbbbb8b1b64b8d3afd2a5621196bcf923d4ff9e7a9c7826c7e0100000000fdffffff0398992d00000000001600145e055023df804935b125c7a1862b800d3cbde4f10000000000000000166a14d727394c8d881145a2009bde6ec73d8a9db6ddb37d1903000000000016001450ee71cdf48e18f41443130babb9786f42571b8c498b0800";

        let mut witness: Vec<u8> = vec!();
        witness.append(&mut hex::decode(header_hex).unwrap());
        witness.append(&mut hex::decode(nodes_hex).unwrap());
        witness.append(&mut hex::decode(index).unwrap());
        witness.append(&mut hex::decode(tx_hex).unwrap());

        witness
    }

    fn gen_output_script() -> Script {
        let mut dest = [0u8; 32];
        // padded with junk data, because it originally represented a 20-byte Ethereum address
        let d = hex::decode("d727394c8d881145a2009bde6ec73d8a9db6ddb3777777777777777788888888")
            .unwrap();

        dest[..32].clone_from_slice(&d.as_slice());

        Script::new_builder()
            .code_hash(Byte32::new(dest))
            .build()
    }

    fn setup_dep_cell_with_script(dummy: &mut test_utils::DummyDataLoader) -> CellDep {
        let script_outpoint = {
            let contract_tx_hash = {
                let buf = [8u8; 32];
                buf.pack()
            };
            OutPoint::new(contract_tx_hash.clone(), 0)
        };

        let cell = CellOutput::new_builder()
            .capacity(
                Capacity::bytes(VERIFIER_BIN.len())
                    .expect("script capacity")
                    .pack(),
            )
            .build();

        dummy.cells.insert(
            script_outpoint.clone(),
            (cell, VERIFIER_BIN.clone())
        );

        CellDep::new_builder()
            .out_point(script_outpoint)
            .dep_type(DepType::Code.into())
            .build()
    }

    fn setup_input_cell(dummy: &mut test_utils::DummyDataLoader) -> OutPoint {
        // hardcode for the example
        // This UTXO was spent by
        // txid 736aee0e936516e6c0fbec70adf1899f29bcd35d13b9747e08ec25651d874da2
        // As part of a solidity stateless swap
        // First 8 bytes are CKB-value (1)
        // next 8 bytes are reqDiffBE (1)
        // final 36 bytes are the Bitcoin outpoint that must be spent
        let args_vec = hex::decode("01000000000000000000000000000001a4af13e0aed3dda50af3719ab5e25a0155b013c4d7df188bf6fed7873489867e07000000")
            .unwrap();

        let args = Bytes::from(args_vec);

        let verifier_cell_data_hash = CellOutput::calc_data_hash(&VERIFIER_BIN);
        let dummy_capacity = Capacity::shannons(42);

        let previous_tx_hash = {
            let buf = [7u8; 32];
            buf.pack()
        };
        let previous_outpoint = OutPoint::new(previous_tx_hash, 0);

        let script = Script::new_builder()
            .args(args.pack())
            .code_hash(verifier_cell_data_hash.clone())
            .hash_type(ScriptHashType::Data.into())
            .build();

        let previous_output_cell = CellOutput::new_builder()
            .capacity(dummy_capacity.pack())
            .lock(script)
            .build();

        dummy.cells.insert(
            previous_outpoint.clone(),
            (previous_output_cell.clone(), Bytes::new())
        );

        previous_outpoint
    }

    fn get_witness() -> WitnessArgs {
        let wit = get_witness_bytes();
        let witness_args = WitnessArgsBuilder::default()
            .lock(Bytes::from(wit).pack())
            .build();

        witness_args
    }

    fn build_output() -> CellOutput {
        let dummy_capacity = Capacity::shannons(5);
        let output_script = gen_output_script();
        CellOutput::new_builder()
            .lock(output_script)
            .capacity(dummy_capacity.pack())
            .build()
    }

    #[test]
    fn test_stateless_spv() {
        let mut dummy = test_utils::DummyDataLoader::new();

        let cell_dep = setup_dep_cell_with_script(&mut dummy);
        let previous_outpoint = setup_input_cell(&mut dummy);
        let witness = get_witness();
        let output = build_output();

        let builder = TransactionBuilder::default()
            .cell_dep(cell_dep)
            .input(CellInput::new(previous_outpoint, 0))
            .witness(witness.as_bytes().pack())
            .output(output)
            .output_data(Bytes::new().pack());

        let tx = builder.build();
        let resolved_tx = test_utils::build_resolved_tx(&dummy, &tx);

        let verify_result = TransactionScriptsVerifier::new(&resolved_tx, &dummy)
            .verify(MAX_CYCLES);
        verify_result.expect("pass verification");
    }
}
