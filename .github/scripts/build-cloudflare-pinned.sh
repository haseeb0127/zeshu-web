#!/usr/bin/env bash
# Build OpenNext for Cloudflare reproducibly while upstream AWS publishes
# mismatched transitive versions (credential-provider-env ^3.972.73 unavailable).
# This is a CI build-only override: do not alter the committed lockfile.
set -euo pipefail
npm pkg set 'overrides.@aws-sdk/credential-provider-env=3.972.72'
npm install --no-save --package-lock=false --no-audit --no-fund @opennextjs/cloudflare@1.20.6
./node_modules/.bin/opennextjs-cloudflare build
