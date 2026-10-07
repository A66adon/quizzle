#!/usr/bin/env bash
set -euo pipefail
: "${1:?Supply the disposable quality Compose network}"
mkdir -p scripts/zap-results
chmod 0777 scripts/zap-results
# Targeted authenticated controls supplement the anonymous passive crawler.
(cd e2e && npx playwright test tests/security.spec.ts --project=chromium)
# No -I, no global IGNORE, no full active scan against an external deployment.
set +e
docker run --rm --network "$1" \
  -v "$PWD/scripts/zap-results:/zap/wrk:rw" \
  -v "$PWD/scripts/zap-rules.tsv:/zap/wrk/zap-rules.tsv:ro" \
  -v "$PWD/scripts/zap-hooks.py:/zap/wrk/zap-hooks.py:ro" \
  ghcr.io/zaproxy/zaproxy:2.16.1 \
  zap-baseline.py -t http://quizzle:8080 -m 1 -T 10 -s \
  -c zap-rules.tsv --hook /zap/wrk/zap-hooks.py \
  -r baseline.html -J baseline.json
scan_status=$?
set -e
node scripts/zap-sanitize.mjs scripts/zap-results
exit "$scan_status"
