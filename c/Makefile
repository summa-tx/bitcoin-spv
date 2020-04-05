CC=gcc
CFLAGS=-I deps
CFLAGS+=-Wall -Werror
CFLAGS+=-fprofile-arcs -ftest-coverage
LIBS=$(shell pkg-config --cflags --libs check)

all: clean test sort coverage risc risc-test

# add new test executable prerequesites here, then execute them
test: build/check_btcspv
	@echo "\n\n"
	@./build/check_btcspv
	@echo "\n\n"

build/check_btcspv: csrc/btcspv.c csrc/evalspv.c csrc/check_btcspv.c
	@echo "Building new test executable $@"
	@$(CC) $(CFLAGS) -o $@ $^ $(LIBS)

sort:
	@mv *.gcda csrc/
	@mv *.gcno csrc/

coverage:
	@gcov csrc/btcspv.c
	@gcov csrc/evalspv.c

risc-test:
	@cargo test -- --nocapture

clean:
	@rm -f build/main-risc
	@rm -f build/check_btcspv
	@rm -f build/btcspv.o
	@rm -f build/check_btcspv.o
	@rm -f build/check_evalspv
	@rm -f build/evalspv.o
	@rm -f build/check_evalspv.o
	@rm -f csrc/*.gcda
	@rm -f csrc/*.gcno

fmt:
	clang-format -i -style=Google $(wildcard csrc/*.h csrc/*.c)
	git diff --exit-code $(wildcard csrc/*.h csrc/*.c)

risc:
	@make -f risc.Makefile clean --no-print-directory
	@make -f risc.Makefile all-via-docker --no-print-directory

setup:
	@git submodule update --init
	@make -f risc.Makefile install-tools
	@make -f risc.Makefile build/blockchain.h

.PHONY: all risc
