# Deployment, persistence and operations

## Clean-start warning

This release intentionally does **not** migrate `accounts.yml`, per-account quiz YAML folders or
SQLite snapshots. Preserve a backup of your previous deployment before upgrading. New accounts
must register and verify again. Import sample or exported quiz YAML through the UI. Runtime
catalog scans and filesystem account writes are gone. Branding remains read-only YAML/images.

## First start

Install Docker Engine/Compose v2.24.4 or newer (the smoke override uses `!override`). Copy root
`.env.example` to `.env`; replace the database password, configure the externally reachable
`PUBLIC_BASE_URL` and real SMTP. Never commit `.env`. Then, from the repository root:

```bash
docker compose up -d --build
docker compose ps
curl --fail https://quiz.example.com/health
```

PostgreSQL 16 is internal-only, health-gated before application startup and persisted in the
project's `postgres-data` named volume at `/var/lib/postgresql/data`. The app runs as UID/GID 10001
and mounts `./branding:/branding:ro`. No writable quiz/account mount is needed. Flyway alone
manages the schema. A bounded JDBC pool and graceful shutdown suit a single application instance.
Do not run the new version against the legacy store expecting migration.

`docker compose down` removes containers/networks but retains the database. **`docker compose
down -v` irreversibly removes the project's database volume.** Rebuilding/recreating the app
does not modify that volume. A volume is persistence, not a backup.

Register at `/register`; local accounts stay pending until the single-use verification email
link activates them. Then sign in, import/create a quiz, and create a session.

## SMTP and public links

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_AUTH`,
`SMTP_STARTTLS`, `SMTP_SSL` and `SMTP_FROM`. Connection/read/write timeouts are finite. Use a provider-approved
sender and SMTP submission over TLS in production. Missing mail configuration must fail clearly;
a delivery failure does not activate an account. The user can request another verification email.

Verification/reset links are constructed only from `PUBLIC_BASE_URL`, not the incoming Host.
Use a fixed production HTTPS origin without a path prefix, userinfo, query or fragment. Never publish token URLs,
passwords, mail bodies or credentials in logs, screenshots or workflow artifacts.

`ALLOWED_EMAIL_DOMAIN` is optional. Blank permits any syntactically valid email; a configured
domain restricts both local and Google authentication. The email lookup uses stripped,
`Locale.ROOT` lowercased text; display email is preserved.

## Local development with Mailpit

Mailpit is only in the `dev` Compose profile. Override these entries in your ignored local `.env`:

```dotenv
PUBLIC_BASE_URL=http://localhost:8080
SESSION_COOKIE_SECURE=false
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_AUTH=false
SMTP_STARTTLS=false
SMTP_SSL=false
SMTP_FROM=quizzle@localhost
```

```bash
docker compose --profile dev up -d --build
```

Open <http://localhost:8080> and captured mail at <http://localhost:8025>. The Mailpit UI binds
only to the loopback interface. Do not enable the dev profile or captured-mail UI in production.
PostgreSQL has no host port in production Compose; standalone JDK development must arrange its
own PostgreSQL access. `quizzle/.env.example` documents standalone JDBC variables.

## Optional Google OIDC

Create a Google Cloud project, configure the OAuth consent screen for your audience and add
test users while the consent screen is in testing. Create an OAuth web application client and
set its authorized redirect URI to:

```text
https://quiz.example.com/login/oauth2/code/google
```

For localhost development add `http://localhost:8080/login/oauth2/code/google`. Configure both
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; leave both blank to disable Google sign-in.
Production callback/public URLs must use HTTPS. Do not commit client credentials.

Spring Security validates OIDC authorization-code state/nonce, issuer and audience. Google email
must be verified and satisfy the same domain policy. Identity records use Google's immutable
subject, not email or display name. A verified exact normalized-email match may link to a local
account; disabled accounts are rejected. When Google activates a pending local account, its
unverified password is discarded so a third party's pre-registration cannot become a trusted
local credential. Already verified local credentials are retained when linking. OAuth-only accounts have no password and do not receive
local-password reset emails. Sensitive OAuth-only actions require recent provider re-authentication.

## HTTPS reverse proxy

Terminate HTTPS at a trusted reverse proxy and set `SESSION_COOKIE_SECURE=true`. Forward
WebSocket Upgrade/Connection for `/{codehash}/data`; do not buffer
`/admin/api/sessions/{codehash}/events` SSE. Allow idle connections longer than the WebSocket
heartbeat timeout. The presenter has a `/state` polling fallback, not a substitute for a working
participant WebSocket connection.

Do not trust arbitrary client forwarded headers for rate limits. Deploy one application instance;
live session state, HTTP sessions and bounded rate limits are single-node. Restrict direct backend
access when the trusted proxy supplies forwarding headers.

## Backup and restore

Run from the repository root:

```bash
bash scripts/backup.sh /secure/backup/destination
bash scripts/restore.sh /secure/backup/destination/quizzle-TIMESTAMP.dump
```

The custom-format dump has UTC timestamped filenames and private permissions. `pg_dump` runs
inside the database container; no password is printed or passed in a host command argument.
Copy backups off the host and encrypt/access-control them: they include password hashes, token
digests and quiz content. Back up branding and your private deployment configuration separately.
Test restoration into an isolated installation periodically.

Restore validates the archive listing before stopping the app, requires typing `RESTORE`
(`--confirm` is for deliberately approved automation), and completely drops/recreates the
configured application database before `pg_restore --single-transaction --exit-on-error`.
This also removes objects introduced by migrations after the backup. Maintenance databases are
refused. **The previous database is deleted, not retained as a fallback**; preserve a current
backup before restoring, and double-check the Compose project/destination.

A failed restore leaves the application stopped and may require another restore from backup.
After success the application also stays stopped: select the version compatible with the restored
schema before `docker compose up -d quizzle`, otherwise the newer image can reapply migrations.
Confirm `/health` and login/settings/quiz persistence before serving traffic.

## Upgrade

1. Back up PostgreSQL and deployment files; record the application commit/image and schema version.
2. Pull the intended version and run `docker compose build`.
3. Run `docker compose up -d`; Flyway upgrades the schema at application startup.
4. Confirm database/app health, sign-in, quiz ownership and supported session recovery.

Do not edit applied Flyway migrations. There are no automated down migrations. Rolling back only
the image after a schema change can be unsafe; stop the app and restore a compatible pre-upgrade
dump if required. Keep database volume names/project names stable across upgrades.

## Validation commands

JDK 21 fast unit/MVC and JAR commands:

```bash
cd quizzle
./gradlew test
./gradlew bootJar
./gradlew integrationTest
```

The last command requires Docker and real PostgreSQL Testcontainers, not H2. On Windows use
`.\gradlew.bat` from `quizzle`. Browser commands from `e2e`:

```bash
npm ci
npx playwright install --with-deps chromium
npm run test:smoke
npx playwright install --with-deps
npm run test:full
```

Run with the local Mailpit-enabled app. The suites use isolated accounts and captured mail.
From the repository root:

```bash
bash scripts/compose-smoke.sh
# Windows: .\scripts\compose-smoke.ps1
mkdir -p load/results
k6 run -e SCENARIO=single200 -e SUMMARY_PATH=load/results/single200.json load/quiz.js
node -e 'const s=require("./load/results/single200.json");if(!s.passed||!s.countsAgree)process.exit(1)'
k6 run -e SCENARIO=parallel5x40 -e SUMMARY_PATH=load/results/parallel5x40.json load/quiz.js
node -e 'const s=require("./load/results/parallel5x40.json");if(!s.passed||!s.countsAgree)process.exit(1)'
# Anonymous ZAP baseline and targeted authenticated checks in an isolated stack:
bash e2e/run-ci.sh zap
```

Load setup registers/verifies isolated presenter fixtures through Mailpit (see `load/README.md`
for configuration and protocol metrics). Defaults are one 200-player quiz or five parallel 40-player
quizzes. Join/answer success must be at least 99%, application errors below 1%, p95 joins below
2 s and p95 answer acknowledgement below 1 s. Accepted answer/player counts must agree with
acknowledgements. These are a baseline for a documented reference machine, not a universal
capacity guarantee. Do not weaken thresholds to hide an execution failure.
The Node summary check is required: k6's thresholds enforce metric failures, but custom exact
count agreement in `handleSummary` cannot itself change k6's exit code. For automatic isolated
setup/cleanup and both gates, use `bash e2e/run-ci.sh single200` or `parallel5x40` on a Linux
Docker host with an ephemeral `POSTGRES_PASSWORD` set.

The Compose smoke uses an isolated `quizzle-smoke` project, localhost ports 18080/18025,
captured verification mail, and account/quiz/settings/session markers. It recreates the app,
then cycles the stack without deleting volumes and checks persisted data. Its final cleanup
removes **only the smoke project's** volumes. Do not run it against a production Compose project.

Fast Gradle runs gate PRs. PostgreSQL integration and Chromium smoke cover relevant backend/UI
changes. Cross-browser/accessibility, ZAP, and configurable k6 run nightly/manual. CodeQL and
dependency review provide separate checks. See workflow definitions for exact triggers/commands.
No Docker-dependent results are implied by merely shipping these suites.

## Controls and limitations

Authentication uses Spring Security session fixation protection and CSRF for browser writes.
Account/quiz/presenter operations are owner-scoped. Auth tokens are random, purpose-separated,
stored only as SHA-256 digests, expiring and single-use. Reset revokes authenticated sessions
and does not auto-login. Responses do not intentionally disclose whether a reset/resend email exists.
Cookies are HttpOnly/SameSite and Secure under HTTPS. CSP/security headers must remain compatible
with the application's local assets; avoid adding third-party assets to token pages.

Rate limits and HTTP/live sessions are in-memory, bounded and single-node; restarting resets
limits and logs users out. SMTP provider delivery, consent configuration and TLS termination need
operator validation. Browser drafts are local to an account/browser/origin, contain quiz content,
and can be unavailable if browser storage is blocked/full. No application can guarantee recovery
from cleared browser storage. Do not describe these controls as a blanket security certification.
`AUTH_RATE_LIMIT_IP_LIMIT` defaults to 60 per IP/auth action/15 minutes and must be 1-1000;
the email limit stays 10 and key storage is capped at 10,000. Disposable browser CI uses a
higher finite cap for many isolated test accounts sharing loopback; it does not disable throttling.

CSP deliberately permits inline scripts/styles for existing theme initialization and local
UI behavior. It does not provide nonce/hash-only script isolation. Moving that initialization
into external assets and tightening CSP is a separate hardening step, not a control claimed here.
Browser traces/video/raw logs are disabled or reduced to sanitized counts to avoid retaining
passwords, cookies and token URLs in failure artifacts; see `e2e/README.md`.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Database unhealthy | Volume permissions, PostgreSQL logs and password consistency. Changing `POSTGRES_PASSWORD` does not change an existing cluster's password automatically. |
| Application exits | JDBC URL/credentials, Flyway schema history and required SMTP configuration; do not bypass migration failures. |
| SMTP TLS/auth error | Correct submission port, STARTTLS/auth policy, credentials and allowed sender. |
| Verification missing | Spam/provider delivery status, pending account and resend; Mailpit only in dev. |
| Google callback fails | Both credentials, exact authorized redirect/public URI, consent/test users and verified email/domain. |
| Empty catalog | Create/import quizzes under this account; runtime folder scans no longer exist. |
| Participants disconnect | WebSocket upgrades, public URL/origin, proxy idle timeout. |
| Presenter polls | SSE buffering or proxy/network blocking. |
| Editor recovery/conflict | Restore local draft explicitly; export/copy local work before choosing server content; do not force an old revision over a new save. |
| Data lost after recreation | Correct Compose project/volume and whether `down -v` was used; restore a tested backup. |
