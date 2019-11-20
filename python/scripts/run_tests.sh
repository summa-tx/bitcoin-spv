#!/usr/bin/env bash

flake8 \
    --ignore=W503,W504 \
    --exclude btcspv/tests/ \
    btcspv && \
mypy \
    btcspv/ \
    --disallow-untyped-defs \
    --strict-equality \
    --show-error-codes \
    --warn-return-any \
    --ignore-missing-imports && \
coverage erase && \
pytest \
    btcspv/ \
    -q \
    --cov-config .coveragerc \
    --cov-report= \
    --cov && \
coverage report && \
coverage html
