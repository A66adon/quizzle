#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
compose=(docker compose -p quizzle-smoke -f docker-compose.yml -f scripts/compose-smoke.yml)
base=http://localhost:18080
cookies=$(mktemp)
cleanup() {
  local result=$?
  trap - EXIT
  rm -f "$cookies"
  "${compose[@]}" down --volumes --remove-orphans >/dev/null || result=1
  exit "$result"
}
trap cleanup EXIT
wait_for_health() {
  local deadline=$((SECONDS + 120))
  until curl --fail --silent "$base/health" | grep -q '"status":"UP"'; do
    if (( SECONDS >= deadline )); then
      echo "Application did not become healthy" >&2
      return 1
    fi
    sleep 1
  done
}
csrf() {
  curl --fail --silent -c "$cookies" -b "$cookies" "$base/login" >/dev/null
  awk '$6 == "XSRF-TOKEN" {token=$7} END {print token}' "$cookies"
}
"${compose[@]}" up -d --build
wait_for_health
curl --fail --silent "$base/register" >/dev/null
token=$(csrf)
username="smoke-$(date +%s)"
password="Smoke-test-password-$(date +%s)"
curl --fail --silent -c "$cookies" -b "$cookies" -H "X-XSRF-TOKEN: $token" \
  --data-urlencode "username=$username" --data-urlencode "password=$password" \
  "$base/register" >/dev/null
curl --fail --silent -b "$cookies" "$base/admin/api/account/settings" | grep -q "$username"
"${compose[@]}" restart quizzle >/dev/null
wait_for_health
token=$(csrf)
curl --fail --silent -c "$cookies" -b "$cookies" -H "X-XSRF-TOKEN: $token" \
  --data-urlencode "username=$username" --data-urlencode "password=$password" \
  "$base/login" >/dev/null
curl --fail --silent -b "$cookies" "$base/admin/api/account/settings" | grep -q "$username"
echo "Compose account persistence smoke passed"
