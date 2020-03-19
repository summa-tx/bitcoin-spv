## bitcoin-spv-c

`bitcoin-spv` is a low-level toolkit for working with Bitcoin from other
blockchains. It supplies a set of pure functions that can be used to validate
almost all Bitcoin transactions and headers, as well as higher-level
functions that can evaluate header chains and transaction inclusion proofs.

Check the documentation in `btcspv.h` and `evalspv.h`. :)

### Contribution Ideas

Some things that would be cool:
1. Fix `swap-demo.c` and use it to make a (testnet) cross-chain swap.
1. Write a function (in JS or Rust) that translates JSON proofs
  to the format used in `swap-demo.c`.
1. Extend the `cli` in `../bin` to make proofs formatted for `swap-demo.c`.
1. Make a Nervos Type Script that [relays](https://github.com/summa-tx/relays)
  Bitcoin headers.

### Important Notes

`btcspv` is a low-level toolkit. It usually **does NOT check bounds**, and
**MAY read past the end of a view** if the input is bad. In order to prevent
this, ALWAYS verify the input using tools in `evalspv` BEFORE passing it to the
functions in `btcspv`.

**It is extremely easy to write insecure code using these libraries.**
We do not recommend a specific security model. Any SPV verification involves
complex security assumptions. Please seek external review for your design
before building with these libraries.

### Notes on project structure:

`csrc` contains the C source code. `deps` contains vendored dependencies. `src`
contains Rust tests that build a Nervos transaction and a sample lockscript.
The sample script can be found in `csrc/main.c`.

Unit tests are in `check_btcspv.c` in the `csrc` directory. To add tests,
implement a new test function, then add it to the running suite using
`tcase_add_test`. The tests pull vectors from `../testVectors.json`, and new
vectors will automatically be run if properly formatted.

We implement a simple byte view type, consisting of a pointer (`loc`) and a
length (`len`). This allows access to memory without having to copy it.
Functions MUST NOT modify the contents of the view, the compiler should enforce
this for `const_view_t`.

For functions that should return a bytearray that is not a view into one of the
arguments, the first function argument should be a pointer to an allocated
array into which to write the result. If the output is variable-length, the
function MUST return the number of bytes written. See the 4 hash function
implementations for an example.


#### Why two Makefiles?

It's easier for me to compartmentalize the build process this way. We want the
standard x86 build for running `check` and then the risc process to build the
Nervos-targeted ELF. Currently the risc Makefile builds the molecule files and
the sample script executable.


## Setup

Dependencies: `docker`, `libcheck`, Rust

* [Installing Check](https://libcheck.github.io/check/web/install.html)
* [Installing Rust Toolchains via Rustup](https://rustup.rs/)
* [Installing Docker](https://docs.docker.com/install/)

```
(DEB) $ sudo apt-get install build-essential
$ docker pull nervos/ckb-riscv-gnu-toolchain:gnu-bionic-20191012

(OSX) $ brew install check
(DEB) $ sudo apt install check

$ make setup  
```

### Build and run tests

```
$ make
```

This will print the coverage report and generate the gcov files. Coverage
details can be viewed via `$ cat btcspv.c.gcov` and `$ cat evalspv.c.gcov`.
Running `make` also builds the RISC-V exectuable, and runs the Rust tests.
