#!/usr/bin/env bash
set -euo pipefail
# Only disposable CI stacks: never reuse a production Compose project/volume.
mode="${1:-smoke}"
case "$mode" in smoke|full|single200|parallel5x40|zap) ;; *) echo "Unknown quality mode" >&2; exit 64 ;; esac
: "${POSTGRES_PASSWORD:?Set an ephemeral POSTGRES_PASSWORD}"
project="quality-${GITHUB_RUN_ID:-local}-$(date +%s)-$$"
compose=(docker compose -p "$project" -f docker-compose.yml -f e2e/compose.quality.yml --profile dev)
mkdir -p e2e/safe-results load/results scripts/zap-results
cleanup() {
  status=$?
  trap - EXIT
  set +e
  # Do not persist raw server logs: they may contain mail, cookies or private data.
  exceptions=$("${compose[@]}" logs --no-color quizzle 2>&1 |
    awk '/Exception in thread|Servlet.service.*threw exception|[Uu]ncaught|Unhandled exception|ERROR.*(Exception|Error)/ {n++} END {print n+0}')
  printf '{"uncaughtServerExceptionLines":%s}\n' "$exceptions" > e2e/safe-results/server-diagnostics.json
  if (( exceptions > 0 )); then echo "Uncaught server exception log lines: $exceptions" >&2; status=1; fi
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || status=1
  exit "$status"
}
trap cleanup EXIT
"${compose[@]}" config --quiet
"${compose[@]}" up -d --build --wait --wait-timeout 180 >/dev/null
for attempt in {1..60}; do
  if curl --fail --silent http://localhost:8080/health >/dev/null &&
     curl --fail --silent http://localhost:8025/api/v1/messages >/dev/null; then break; fi
  if (( attempt == 60 )); then echo "Quality stack readiness timed out" >&2; exit 1; fi
  sleep 1
done
export BASE_URL=http://localhost:8080 MAILPIT_URL=http://localhost:8025
case "$mode" in
  smoke) (cd e2e && npm run test:smoke) ;;
  full) (cd e2e && npm run test:full -- --project="${BROWSER_PROJECT:-chromium}") ;;
  single200|parallel5x40)
    # host networking deliberately targets only this Linux CI runner's disposable stack.
    docker run --rm --network host --user "$(id -u):$(id -g)" \
      -v "$PWD:/work" -w /work \
      -e BASE_URL -e MAILPIT_URL -e SCENARIO="$mode" \
      -e SUMMARY_PATH="load/results/${mode}.json" \
      grafana/k6:1.3.0 run --quiet --no-color load/quiz.js
    # handleSummary cannot change k6's exit status: enforce exact counts separately.
    node -e 'const fs=require("fs");const s=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));if(!s.passed||!s.countsAgree)process.exit(1)' \
      "load/results/${mode}.json"
    ;;
  zap) bash scripts/zap-baseline.sh "${project}_default" ;;
esac
