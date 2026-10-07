# Browser quality gates

## Status and safety

**Browser, PostgreSQL/Compose, ZAP and load execution: NOT EXECUTED locally.**
Docker is unavailable in the implementation environment. Type checking and
test discovery are separate checks, not evidence of end-to-end success.
Run the workflows before accepting runtime behavior or publishing capacity claims.

Use disposable accounts/database/mail only. `run-ci.sh` generates a unique
Compose project and deletes **only that project's** volumes on exit; never
point it at a production deployment. Host ports 8080 and 8025 must be free.
PostgreSQL is `16-alpine`; Mailpit is pinned to `v1.27.8` by root Compose.
The quality override sets generic SMTP to Mailpit:1025 with auth/TLS disabled,
`PUBLIC_BASE_URL=http://localhost:8080`, and `SESSION_COOKIE_SECURE=false`.
Production defaults are not changed. `COOKIE_SECURE` is not the Spring binding:
the actual environment variable is `SESSION_COOKIE_SECURE`.

## Commands

From the repository root, with Node **22.18.0**, Java 21 for backend checks,
and a Docker daemon for execution:

```sh
cd e2e
npm ci
npm run typecheck
npm run test:list
npx playwright install --with-deps chromium
cd ..
export POSTGRES_PASSWORD="$(openssl rand -hex 24)"
bash e2e/run-ci.sh smoke
```

Against an already running **isolated** PostgreSQL/Mailpit stack:

```sh
cd e2e
BASE_URL=http://localhost:8080 MAILPIT_URL=http://localhost:8025 npm run test:smoke
npx playwright install --with-deps chromium firefox webkit
BASE_URL=http://localhost:8080 MAILPIT_URL=http://localhost:8025 npm run test:full
```

`E2E_EMAIL_DOMAIN` defaults to `example.test`; set it to the configured allowed
domain when testing a restricted stack. The full command runs all three browsers.
Nightly CI runs one browser per fresh stack, avoiding shared authentication
rate-limit buckets and reducing runtime. Tests generate unique synthetic accounts,
quizzes and contexts; mail polling selects the exact recipient and expected origin.
Do not run repeated full suites against one long-lived stack without respecting
its production rate limits. No tests disable authentication or throttling.

## Coverage and contracts

| Suite | Assertions |
|---|---|
| Auth smoke | Pending registration, captured SMTP verification, unverified rejection, single use, login/logout; reset revokes existing sessions, rejects old password and token reuse, no automatic login |
| Auth full | Superseding verification resend, tampered links, identical known/unknown forgot acknowledgement |
| Editor smoke | Manual save/revision and reload; failed PUT autosave retains/restores local draft |
| Editor full | 409 preserves newer server content and stale local draft; dirty navigation Stay/Leave; recovery Discard |
| Editor durability | Malformed/foreign draft preservation, tab-local dismissal and changed-record recovery, delayed valid/invalid edits, serialized PUT revisions, mismatched revision/content acknowledgements, uncertain POST blocks duplicate retries, incomplete description prevents network save |
| Catalog full | Validation, optimistic conflict code/current version, YAML import/export round trip, delete, cross-account read/delete isolation |
| Settings | Values persist across relogin; invalid settings do not mutate; current-password requirement, password change, account deletion cannot affect another owner |
| Game | Real UI JOIN/ANSWER/ACK, result vote counts, FINAL_RESULTS; full flow adds reload reconnect, three questions and newly created games obeying both persisted late-join settings |
| Layout/axe | 390x844 and 1440x900, light/dark: login, registration, admin, editor, settings, presenter, participant; no horizontal overflow, primary control reachability and 40px touch targets, editor dialog bounds; serious/critical WCAG A/AA violations fail |
| Security | Anonymous API 401, authenticated missing/invalid CSRF 403, successful authorized delete, auth-page headers |

Quiz API: create POST is a direct definition; GET/PUT return
`{fileName,quiz,version}`; PUT accepts `{quiz,version}`, stale PUT returns
409 `{error:"REVISION_CONFLICT",currentVersion}`. YAML imports are raw
`application/yaml`. Settings expose stable accountId/email/hasLocalPassword.
Participant WS is `/{code}/data`: JOIN uses either name or reconnectToken;
ANSWER uses questionId/answerIds. Server messages are `{type,payload}`.
The final connected answer **automatically** transitions to RESULTS; terminal
state is FINAL_RESULTS, not FINISHED. Presenter CLOSE removes the session.

Expiry/rate-limit, optional Google/provider reauthentication and process restart
are backend/deployment integration concerns, not simulated by browser sleeps.
No arbitrary sleeps or blanket axe exclusions are used. No visual baselines
are committed before an actual reference run. Strict axe failures may identify
existing frontend issues; fix/review the UI rather than weakening the gate.

## Failure evidence and dependency policy

`safe-results/results.json` records test/project/status/duration and source
locations. Runtime diagnostics preserve console counts, HTTP error status and
JavaScript/network error categories; arbitrary message payloads are redacted.
Uncaught browser exceptions fail tests. The stack runner inspects raw server
output **in a pipe only** for uncaught-exception signatures and persists counts,
never raw logs. This heuristic complements assertions; it is not exhaustive
observability or proof that no exception ever occurred.

Traces, videos, HTML/blob reports and automatic screenshots are disabled:
Playwright stores raw form passwords, token URLs, cookie values and mail bodies
in those artifacts even when assertion output is redacted. This is an intentional
safety exception to generic “trace on failure” advice. Layout-only failures may
save screenshots on non-auth pages with input/private identity regions masked,
using synthetic content in the disposable stack. Auth lifecycle tests never save
screenshots. CI uploads only `safe-results`, for three days on failure.

Pinned versions: Playwright 1.55.1 (including matching playwright-core),
axe 4.10.2, TypeScript 5.9.2, Node types 22.18.6; npm lockfile is committed.
Actions use immutable SHA refs with major-version comments. Backend Spring,
Flyway, PostgreSQL JDBC and Testcontainers versions remain centrally managed
by the existing Spring Boot BOM; no duplicate Java version overrides are added.
Update Playwright package, core override, lockfile and downloaded browsers
together. Dependency review and CodeQL supplement runtime checks, not replace them.

PR workflow has a separate `integrationTest` Testcontainers job, in addition to
existing fast unit/MVC + bootJar CI. Nightly/manual workflow covers all browsers,
two load scenarios and anonymous passive DAST with targeted authenticated checks.
