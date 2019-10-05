#!/usr/bin/env bash

flake8 \
    --ignore=W503,W504 \
    --exclude btcspv/tests/ \
    btcspv && \
mypy \
    btcspv/ \
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
