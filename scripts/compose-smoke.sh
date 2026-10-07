#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v jq >/dev/null || { echo "Install jq to run the Compose smoke" >&2; exit 1; }
export POSTGRES_PASSWORD="smoke-$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n')"
compose=(docker compose -p quizzle-smoke --profile dev -f docker-compose.yml -f scripts/compose-smoke.yml)
base=http://localhost:18080
mail=http://localhost:18025
cookies=$(mktemp)
started=false
cleanup() {
  local result=$?
  trap - EXIT
  rm -f "$cookies"
  if $started; then
    "${compose[@]}" down --volumes --remove-orphans >/dev/null || result=1
  fi
  exit "$result"
}
trap cleanup EXIT
existing=$("${compose[@]}" ps -aq)
volumes=$(docker volume ls --filter label=com.docker.compose.project=quizzle-smoke --quiet)
if [[ -n $existing || -n $volumes ]]; then
  echo "An existing quizzle-smoke project or volume exists; refusing to replace it" >&2
  exit 1
fi
wait_for_health() {
  local deadline=$((SECONDS + 120))
  until curl --fail --silent "$base/health" | grep -q '"status":"UP"' &&
      curl --fail --silent "$mail/api/v1/messages" >/dev/null; do
    if (( SECONDS >= deadline )); then
      echo "Application or Mailpit did not become healthy" >&2
      return 1
    fi
    sleep 1
  done
}
csrf() {
  curl --fail --silent -c "$cookies" -b "$cookies" "$base/login" >/dev/null
  awk '$6 == "XSRF-TOKEN" {token=$7} END {print token}' "$cookies"
}
json_request() {
  local method=$1 path=$2 data=${3:-} token
  token=$(csrf)
  curl --fail --silent --show-error -c "$cookies" -b "$cookies" \
    -H "X-XSRF-TOKEN: $token" -H "Content-Type: application/json" \
    -X "$method" --data "$data" "$base$path"
}
login() {
  local token
  token=$(csrf)
  curl --fail --silent --show-error -c "$cookies" -b "$cookies" -H "X-XSRF-TOKEN: $token" \
    --data-urlencode "email=$email" --data-urlencode "password=$password" \
    "$base/login" >/dev/null
  curl --fail --silent --show-error -b "$cookies" "$base/admin/api/account/settings" \
    | jq -e --arg email "$email" '.email == $email' >/dev/null
}
verify_mail() {
  local deadline=$((SECONDS + 60)) messages id text url
  until (( SECONDS >= deadline )); do
    messages=$(curl --fail --silent --show-error --get --data-urlencode "query=to:$email" "$mail/api/v1/search")
    id=$(jq -r '.messages[0].ID // empty' <<<"$messages")
    if [[ -n $id ]]; then
      text=$(curl --fail --silent --show-error "$mail/api/v1/message/$id" | jq -r '.Text')
      url=$(grep -Eo 'http://localhost:18080/verify-email\?token=[A-Za-z0-9_-]+' <<<"$text" || true)
      if [[ -n $url ]]; then
        curl --fail --silent --show-error "$url" >/dev/null
        return 0
      fi
    fi
    sleep 1
  done
  echo "Verification mail was not captured" >&2
  return 1
}
assert_markers() {
  login
  curl --fail --silent --show-error -b "$cookies" "$base/admin/api/quizzes/$file" \
    | jq -e '.quiz.title == "Persistence smoke"' >/dev/null
  curl --fail --silent --show-error -b "$cookies" "$base/admin/api/account/settings" \
    | jq -e '.allowLateJoin == true and .autoAdvanceDelayMs == 7000' >/dev/null
  curl --fail --silent --show-error -b "$cookies" "$base/admin/api/sessions/$code" \
    | jq -e '.state == "LOBBY"' >/dev/null
}
started=true
"${compose[@]}" up -d --build
wait_for_health
curl --fail --silent "$base/register" >/dev/null
token=$(csrf)
email="smoke-$(date +%s)@example.com"
password="Smoke-test-$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')"
curl --fail --silent -c "$cookies" -b "$cookies" -H "X-XSRF-TOKEN: $token" \
  --data-urlencode "email=$email" --data-urlencode "password=$password" \
  --data-urlencode "passwordConfirmation=$password" \
  "$base/register" >/dev/null
verify_mail
login
quiz='{"title":"Persistence smoke","description":"Restart marker","author":"Smoke","questions":[{"id":"q1","text":"Persisted?","points":1000,"timeSeconds":20,"multiple":false,"shuffleAnswers":false,"answers":[{"id":"yes","text":"Yes","correct":true},{"id":"no","text":"No","correct":false}]}]}'
file=$(json_request POST /admin/api/quizzes "$quiz" | jq -er '.fileName')
json_request PUT /admin/api/account/settings '{"allowLateJoin":true,"autoAdvanceDelayMs":7000}' >/dev/null
code=$(json_request POST /admin/api/sessions "$(jq -nc --arg file "$file" '{quizFileName:$file}')" | jq -er '.codehash')
assert_markers
"${compose[@]}" up -d --force-recreate --no-deps quizzle >/dev/null
wait_for_health
assert_markers
"${compose[@]}" down >/dev/null
"${compose[@]}" up -d >/dev/null
wait_for_health
assert_markers
echo "Compose account, quiz, settings and snapshot persistence smoke passed"
