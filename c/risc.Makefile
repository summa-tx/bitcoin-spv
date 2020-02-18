TARGET := riscv64-unknown-linux-gnu
CC := $(TARGET)-gcc
LD := $(TARGET)-gcc
OBJCOPY := $(TARGET)-objcopy
CFLAGS := -fPIC -O3 -nostdinc -nostdlib -nostartfiles -fvisibility=hidden
CFLAGS += -I deps -I deps/ckb-c-stdlib -I deps/ckb-c-stdlib/libc -I deps/molecule -I build
CFLAGS += -Wall -Werror -Wno-nonnull -Wno-nonnull-compare -Wno-unused-function -g -DTARGETING_NERVOS_CKB
MOLC := moleculec
MOLC_VERSION := 0.4.1
PROTOCOL_HEADER := build/blockchain.h
PROTOCOL_SCHEMA := build/blockchain.mol
PROTOCOL_VERSION := d75e4c56ffa40e17fd2fe477da3f98c5578edcd1
PROTOCOL_URL := https://raw.githubusercontent.com/nervosnetwork/ckb/${PROTOCOL_VERSION}/util/types/schemas/blockchain.mol

# docker pull nervos/ckb-riscv-gnu-toolchain:gnu-bionic-20191012
BUILDER_DOCKER := nervos/ckb-riscv-gnu-toolchain@sha256:aae8a3f79705f67d505d1f1d5ddc694a4fd537ed1c7e9622420a470d59ba2ec3

all: build/swap-demo-risc

all-via-docker: ${PROTOCOL_HEADER}
	@docker run --rm -v `pwd`:/code ${BUILDER_DOCKER} bash -c "cd /code && make -f risc.Makefile"

build/swap-demo-risc: csrc/swap-demo.c csrc/btcspv.c csrc/evalspv.c
	@$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $<
	@$(OBJCOPY) --only-keep-debug $@ $@.debug
	@$(OBJCOPY) --strip-debug --strip-all $@

generate-protocol: check-moleculec-version ${PROTOCOL_HEADER}

check-moleculec-version:
	test "$$(${MOLC} --version | awk '{ print $$2 }' | tr -d ' ')" = ${MOLC_VERSION}

${PROTOCOL_HEADER}: ${PROTOCOL_SCHEMA}
	${MOLC} --language c --schema-file $< > $@

${PROTOCOL_SCHEMA}:
	mkdir -p build
	curl -L -o $@ ${PROTOCOL_URL}

install-tools:
	if [ ! -x "$$(command -v "${MOLC}")" ] \
			|| [ "$$(${MOLC} --version | awk '{ print $$2 }' | tr -d ' ')" != "${MOLC_VERSION}" ]; then \
		cargo install --force --version "${MOLC_VERSION}" "${MOLC}"; \
	fi

clean:
	@rm -f build/*-risc.o
	@rm -f build/*-risc.o.debug
	@rm -f build/*-risc.so

.PHONY: all all-via-docker dist clean fmt
.PHONY: generate-protocol check-moleculec-version install-tools
