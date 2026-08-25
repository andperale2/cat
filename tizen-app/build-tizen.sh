#!/usr/bin/env bash
echo "Building dango Tizen TV (.wgt)..."
cd "$(dirname "$0")"
node package-wgt.js
