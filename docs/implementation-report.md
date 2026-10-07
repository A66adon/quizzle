# Implementation and execution report

## Environment and scope

Implementation started on a Windows workstation with an available Microsoft JDK 21.0.12.
The default `java` was Java 17; Gradle commands explicitly selected JDK 21 using `JAVA_HOME`.
There is no running local Docker engine. The user explicitly approved implementing Docker-ready
checkpoints without local Docker execution. No production system or existing private `.env`
was used for validation, and no production data was migrated.

PostgreSQL 16 is the sole mutable runtime store; focused JDBC/Flyway, vanilla JavaScript,
read-only branding, explicit YAML import/export, generic SMTP and optional Google OIDC are the
selected architecture. Old YAML-account/quiz folders and SQLite are a deliberate clean-start
breaking change, not an automatic migration.

## Delivered checkpoints by phase

| Phase | Main changed surfaces | Checkpoints |
| --- | --- | --- |
| 1: baseline and contracts | Existing Java tests, health controller, `fast-ci.yml`, `docs/contracts.md`, Compose smoke scaffold | `e902091` |
| 2: PostgreSQL | `AccountStore`, quiz catalog/editor repositories, snapshot repository, Flyway migrations, `build.gradle`, readiness/pool configuration | `fa18d06`, `ec0caca` |
| 3: verified email and security | Spring Security configuration, account/token/mail services, lifecycle controllers/pages/scripts, credential-version migration, bounded rate limits | `6ad313d`, `0f361a5`, `24e41b7`, `89f3d2e`, `77e97d1`, `ace5775` |
| 4: optional Google | Conditional OAuth client registration, identity linking and same-account recent reauthentication | `9f06d82`, `69144ae` |
| 5: durable quizzes/editor | JSONB revisions, import/export, `editor.js/html/css`, recovery/conflict/navigation behavior | `fa18d06`, `fcc2e00`, `69144ae` |
| 6: account lifecycle | Field-specific settings/password/status writes, credential revocation, deletion guards, admin and standalone settings | `4545ac2`, `9bb923b`, `89f3d2e`, `69144ae` |
| 7: quality tiers | `e2e/`, `load/`, ZAP scripts/rules and browser/integration/nightly/CodeQL/dependency workflows | `7bc570c`, `059fef5`, `d290a87`, `d80b118`, `a11eec9`, `049ee55`, `93ab364` |
| 8: deployment/operations | Dockerfile, root Compose/env examples, recreation smoke, backup/restore, README and deployment guides | `1f93350` |

Fast Gradle tests and PostgreSQL integration tests are separate tiers. Browser PR smoke is
Chromium-only; full browser/accessibility, DAST and load suites are separately scheduled/manual.
No heavy suite is represented as executed merely because its code or workflow is present.

## Baseline checkpoint

Commit `e902091` restores the baseline and adds fast CI, minimal public health, contract inventory
and an initial Compose smoke scaffold. Eight existing test files were repaired for account-owned
catalog/session APIs, session rotation, CSRF fixtures, branding image locations and draft validation.

From `quizzle`, with JDK 21:

```powershell
.\gradlew.bat --no-daemon --console=plain test bootJar
```

The original run built the JAR but failed test compilation with 21 obsolete API/fixture errors.
After baseline repairs the same command succeeded: **50 tests, zero failures, errors or skips**.
This is a measured baseline, not the final post-authentication result.

## PostgreSQL checkpoints

Commits `fa18d06` and `ec0caca` replace YAML accounts and live quiz folders with JDBC repositories,
add Flyway's PostgreSQL schema, JSONB quiz revisions/import/export and recoverable snapshots,
and add bounded connection/readiness settings. Metadata listing avoids deserializing all quizzes.
PostgreSQL Testcontainers checks are tagged separately and are not silently skipped or replaced
with H2.

After recovering the interrupted session, this exact JDK 21 command succeeded:

```powershell
.\gradlew.bat --no-daemon --console=plain test bootJar integrationTestClasses
```

The recovered checkpoint has **45 fast tests, zero failures/errors/skips**. Database-dependent
tests compile in the separate integration tier; compiling them does not execute PostgreSQL.

## Authentication and integration corrections

Local registration remains pending until verification and does not auto-login. Reset tokens are
single-use, password changes revoke stale credential versions, and optional Google login requires
a verified email and immutable provider subject. Sensitive OAuth-only operations require recent
same-account provider authentication.

The integration review's three concrete findings were corrected in `69144ae`: pending Google
activation discards the unverified local password and invalidates tokens; new/imported quiz
identities contain their immutable row UUID, so a deleted quiz cannot be replaced behind an old
tab's version-1 identity; account deletion commits before pure live-room/socket cleanup under the
creation guard, preserving live state when the database commit fails. Four focused repro tests
failed before the fixes and passed afterward. `c0003e6` aligns the admin-session integration title
assertion with its seeded fixture.

Forgot/resend already use comparable dummy credential work and bounded asynchronous delivery
after token commit. `77e97d1` adds blocked-SMTP acknowledgement regressions and static safe failure
events for delivery/queue rejection. The executor has one core/two maximum threads and a queue
of 100; SMTP timeouts are finite. Registration remains synchronous/actionable. `ace5775` enables
TLS server hostname verification in addition to required STARTTLS or configured implicit SSL.
Queued mail is not durable across an application restart; requesting a new link is the recovery
path, not a claim of exactly-once SMTP delivery.

## Final local result

After all implementation writers released ownership, the final JDK 21 command from `quizzle`
completed successfully:

```powershell
.\gradlew.bat --no-daemon --max-workers=1 --console=plain test --rerun bootJar integrationTestClasses
```

`--rerun` forced the fast test task to execute rather than reuse its up-to-date result.
JUnit XML totals: **84 tests, zero failures, errors or skips**. The production JAR is built and
PostgreSQL integration sources compile; the integration task itself was not executed.
The final IDE project build also succeeded with no reported problems.

An earlier overlapping validation attempt failed with a missing Gradle binary-results file;
another writer observed an EOF while producing the same reports. These were not assertion
failures. All other validation processes were stopped before the successful isolated rerun
above. The final narrow source review found no residual concrete issue in the three corrected
scenarios or generic asynchronous-mail handling.

## Editor checkpoint

Commit `fcc2e00` adds account-isolated, versioned drafts; serialized revision-aware saves;
recovery/conflict dialogs; exact acknowledgement matching; navigation safeguards; and explicit
YAML import/export. Incomplete edits, lost create responses, unavailable storage, cross-tab
changes and server rejection are handled visibly rather than silently overwritten.

The admin settings panel now uses email/local-password metadata, confirms local deletion with
the current password, and preserves exact stored delay values until the user explicitly changes
the delay. The parent reran **14 mocked Node VM checks**, including 7000/7123/1/0/120000 ms
late-join-only saves and serialized in-flight edits. The editor agent ran **19 mocked VM checks**.
These are behavioral checks using mocked DOM/fetch, not live browser/application results.
Both changed scripts passed `node --check`; the targeted IDE build completed successfully.

## Browser and quality preparation

From `e2e`, these commands have executed:

```powershell
npm run typecheck
npm run test:list
npm run test:smoke -- --list
```

TypeScript checking succeeded. Full discovery found **93 cases in seven files across Chromium,
Firefox and WebKit**; Chromium smoke discovery found **10 cases**. Discovery loads and lists tests
but does not launch a browser or exercise the application. Chromium is not installed locally;
the existing Edge installation prohibits DevTools through system policy.
The privacy-safe reporter explicitly labels discovery-only runs and does not write an execution
success artifact for them. Normal execution reporting remains separate.

Browser coverage includes email verification/reset, CSRF/ownership, durable quiz editing,
proactive shared-tab conflict and a separate real HTTP 409 scenario, deleted-quiz recovery,
exact 7123 ms settings preservation, account deletion safeguards, presenter/participant flows,
phone/laptop layouts, themes and accessibility. Disposable quality Compose explicitly uses a
finite authentication IP limit of 600; the production default remains 60 and the email limit 10.

The load suite implements `single200` and `parallel5x40` using the real WebSocket protocol.
Metric thresholds plus a required Node summary gate enforce exact accepted-count agreement;
server exception counts are checked by the isolated wrapper. There are **no measured load
results**, reference-host measurements or capacity conclusions from this workstation.

## Deployment validation

These commands have executed successfully without needing a Docker daemon:

```powershell
docker compose --env-file .env.example config --quiet
docker compose --env-file .env.example --profile dev config --quiet
docker compose --env-file .env.example -p quizzle-smoke --profile dev -f docker-compose.yml -f scripts\compose-smoke.yml config --quiet
docker compose --env-file .env.example -p quality-config-check --profile dev -f docker-compose.yml -f e2e\compose.quality.yml config --quiet
```

The PowerShell smoke parser accepted `scripts\compose-smoke.ps1`. Git Bash `bash -n` accepted
`scripts/compose-smoke.sh`, `scripts/backup.sh` and `scripts/restore.sh`.
These are syntax/configuration results only, not container startup, persistence or restore proof.

## Tested controls and remaining boundaries

The implementation uses owner-scoped PostgreSQL queries/constraints, Spring Security CSRF and
session fixation protection, credential-version revocation, bounded auth limits, purpose-separated
single-use token digests, configured-origin links, verified Google subject identities and current
password/recent-provider checks for sensitive actions. Focused tests cover these boundaries;
integration/browser execution remains necessary to validate the deployed configuration.

HTTP sessions, live game state and auth limits are single-node; restarts log users out and reset
limits. Durable snapshots preserve supported game recovery, not live socket connections.
Browser storage can be blocked, full or manually cleared; recovery cannot promise otherwise.
CSP deliberately allows inline scripts/styles for existing theme behavior and is not nonce-only.
Privacy-safe browser reporting omits raw traces/video/mail/cookies/token URLs; this trades some
failure diagnostics for avoiding sensitive artifacts. Backups contain private account/quiz data
and must be access-controlled and stored off-host. No blanket security certification is claimed.

## Execution not performed here

Real PostgreSQL Testcontainers, Compose restart/recreation persistence, Mailpit-backed browser
flows, cross-browser/axe, ZAP and k6 need the Docker-ready execution environment and have not
run on this workstation. No 200-player or five-parallel-quiz latency/throughput result is
available, and no reference-machine capacity is claimed. Thresholds have not been weakened.
Real Google consent/callback and SMTP provider delivery also need operator credentials.

Run the [deployment guide's commands](deployment.md#validation-commands) and the checked-in
workflows in an isolated Docker environment before release. Backup and restore scripts have
not performed a real database backup/restore here; exercise both against a disposable instance.
