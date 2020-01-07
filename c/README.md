## bitcoin-spv-c

This

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

Dependencies: `docker`, `libcheck`, nervos docker toolchain

```
$ docker pull nervos/ckb-riscv-gnu-toolchain:gnu-bionic-20191012

(OSX) $ brew install check
(DEB) $ sudo apt install check

$ git submodule update --init
```

### Build and run tests

```
$ make
```

This will print the coverage report and generate the gcov files. Coverage
details can be viewed via `$ cat btcspv.c.gcov` and `$ cat evalspv.c.gcov`.
Running `make` also builds the Rust test and runs it.
