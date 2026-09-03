# Quizzle

**A self-hosted live quiz platform for interactive safety training.**

![Java 21](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot 4.1](https://img.shields.io/badge/Spring_Boot-4.1-6DB33F?logo=springboot&logoColor=white)
![Gradle](https://img.shields.io/badge/Gradle-Wrapper-02303A?logo=gradle&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

Quizzle turns YAML files into presenter-led quizzes. An admin starts a session, participants join by
QR code from their phones, and the presenter controls each question from a shared screen. The whole
application runs as one Spring Boot process with embedded SQLite storage and no required external
services.

## At a glance

- **Easy to host:** one Java process or Docker Compose stack.
- **Real-time:** WebSockets connect participants; Server-Sent Events update the presenter.
- **Resilient:** active sessions are snapshotted to SQLite and restored after a restart.
- **Offline-friendly:** quizzes, branding, and DiceBear avatar assets are stored locally.
- **Safe by default:** the server validates quiz files, state transitions, and answer timing.
- **Customizable:** edit YAML files to change quizzes, wording, logo, and light/dark colors.

## Quick start with Docker

Requirements: [Docker](https://docs.docker.com/get-docker/) with Docker Compose. Run the commands
from the repository root.

**PowerShell**

```powershell
$env:ADMIN_PASSWORD = 'replace-with-a-long-password'
docker compose up --build
```

**Bash**

```bash
ADMIN_PASSWORD='replace-with-a-long-password' docker compose up --build
```

Open <http://localhost:8080/admin/login>, sign in, choose a quiz, and create a session. Stop the
stack with <kbd>Ctrl</kbd>+<kbd>C</kbd>, then run `docker compose down` when you no longer need it.

> [!IMPORTANT]
> `ADMIN_PASSWORD` is required. Use a long, unique value and never commit it to the repository.

### Run directly with Java

Requirements: JDK 21. The path overrides below connect the Gradle project in `quizzle/` to the
repository-level sample quizzes, branding, and data directory.

**PowerShell**

```powershell
Set-Location .\quizzle
$env:ADMIN_PASSWORD = 'replace-with-a-long-password'
$env:QUIZ_FOLDER = '../quizzes'
$env:BRANDING_FOLDER = '../branding'
$env:QUIZ_DATABASE_PATH = '../data/quiz-snapshots.db'
.\gradlew.bat bootRun
```

**Bash**

```bash
cd quizzle
ADMIN_PASSWORD='replace-with-a-long-password' \
QUIZ_FOLDER='../quizzes' \
BRANDING_FOLDER='../branding' \
QUIZ_DATABASE_PATH='../data/quiz-snapshots.db' \
./gradlew bootRun
```

You can persist the same entries in an ignored `quizzle/.env` file; copy
[`quizzle/.env.example`](quizzle/.env.example) to get started. Process environment variables take
precedence over `.env`; `.env` takes precedence over built-in defaults.

## Application pages

| Page | Path | Audience |
| --- | --- | --- |
| Admin login | `/admin/login` | Quiz administrator |
| Session overview | `/admin` | Quiz administrator |
| Presenter | `/admin/sessions/{codehash}` | Shared presentation screen |
| Participant | `/{codehash}/` | Players joining by link or QR code |

`PUBLIC_BASE_URL` must be reachable from participant devices. `localhost` only works when the
browser and Quizzle run on the same machine.

## Configuration

Configuration comes from environment variables or from a `.env` file next to the working directory.
Process environment variables win over `.env`, and `.env` wins over the built-in defaults. Copy
[`quizzle/.env.example`](quizzle/.env.example) to `quizzle/.env` as a starting point; the file is
ignored by Git.

| Variable | Default | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | — | **Required.** Shared password for the admin area. |
| `SERVER_PORT` | `8080` | HTTP listening port. |
| `PUBLIC_BASE_URL` | `http://localhost:8080` | Base URL used in participant links and QR codes. |
| `SESSION_COOKIE_SECURE` | `false` | Set to `true` when the public URL uses HTTPS. |
| `QUIZ_FOLDER` | `./quizzes` | Directory scanned for `.yaml` and `.yml` quizzes. |
| `BRANDING_FOLDER` | `./branding` | Directory containing branding configuration and images. |
| `BRANDING_FILE` | `branding.yaml` | Branding filename inside `BRANDING_FOLDER`. |
| `QUIZ_DATABASE_PATH` | `./data/quiz-snapshots.db` | SQLite snapshot database. |
| `SNAPSHOT_INTERVAL_MS` | `30000` | Periodic snapshot interval. |
| `SQLITE_BUSY_TIMEOUT_MS` | `5000` | SQLite lock wait timeout. |
| `SESSION_CODEHASH_LENGTH` | `10` | Length of generated session join codes. |
| `AUTO_ADVANCE_DELAY_MS` | `5000` | Presenter automatic-advance delay after results or the leaderboard. |
| `ALLOW_JOIN_AFTER_START` | `false` | When `true`, new players may join after the lobby, until the session is closed. |
| `WEBSOCKET_HEARTBEAT_INTERVAL_MS` | `15000` | Server ping interval. |
| `WEBSOCKET_HEARTBEAT_TIMEOUT_MS` | `40000` | Time without a pong before the socket is closed. |
| `WEBSOCKET_DISCONNECT_GRACE_MS` | `120000` | Reconnect window for disconnected participants. |
| `PLAYER_NAME_MAX_LENGTH` | `32` | Maximum participant name length. |

Quiz-validation limits (`QUIZ_MAX_QUESTIONS`, `QUIZ_MAX_POINTS`, `QUIZ_MAX_TIME_SECONDS`, …) and the
WebSocket message-size limits can be overridden the same way. Their names and defaults are listed in
[`application.properties`](quizzle/src/main/resources/application.properties).

## Create a quiz

Add one YAML file per quiz alongside
[`quizzes/safety-basics.yaml`](quizzes/safety-basics.yaml), then restart Quizzle so the catalog
reloads it. Start with that file or use this minimal example:

```yaml
title: "Workplace Safety Basics"
description: "A short introduction to safe conduct at work."
author: "Safety Team"
questions:
  - id: "emergency-exit"
    text: "What should you do when the evacuation alarm sounds?"
    points: 1000
    timeSeconds: 20
    multiple: false
    shuffle_answers: true
    answers:
      - id: "leave"
        text: "Leave by the nearest safe emergency exit"
        correct: true
      - id: "wait"
        text: "Wait at your desk"
        correct: false
```

Quizzes must have unique question IDs, at least two answers per question, and at least one correct
answer. A single-choice question must have exactly one correct answer. Invalid files are skipped and
shown in the admin catalog with a precise validation error; they do not prevent valid quizzes from
loading.

Answers are shuffled once per session by default. Set `shuffle_answers: false` when order matters.
For multiple-choice questions, a participant must select the exact correct set to score points.

## Customize the look

Edit [`branding/branding.yaml`](branding/branding.yaml) to change the product name, logo, light/dark
palette, and six answer colors. The included configuration uses
[`branding/images/quizzle.svg`](branding/images/quizzle.svg).

```yaml
name: "Quizzle"
mark: "quizzle.svg" # text, a local image filename, or an HTTPS URL
colors:
  primary: "#040066"
  accent: "#00d4ff"
answerColors:
  - "#c52f42"
  - "#1664ad"
  - "#b28200"
  - "#26824b"
  - "#7a3fa0"
  - "#c2660a"
```

All fields are optional. Colors use `#rgb` or `#rrggbb`; `answerColors` must contain exactly six
values. Restart Quizzle after changing the file. Invalid branding is logged and safely replaced by
built-in defaults.

## How a session works

```mermaid
stateDiagram-v2
    [*] --> LOBBY
    LOBBY --> QUESTION_OPEN: Start
    QUESTION_OPEN --> RESULTS: Timer / everyone answered / end early
    RESULTS --> LEADERBOARD: More questions
    LEADERBOARD --> QUESTION_OPEN: Next question
    RESULTS --> FINAL_RESULTS: Last question
    FINAL_RESULTS --> CLOSED: Close
```

- Participants join only in `LOBBY` and answer only during `QUESTION_OPEN`.
- The server accepts one answer per participant and question, before the server-side deadline.
- Points decay with the remaining time and are rounded to the nearest 10.
- During a question, the presenter sees an answer count—not the answer distribution.
- Dropped participant connections retry with backoff during the configured grace period.
- Every state change is persisted. Active sessions return after a restart; closed sessions are
  removed.

Participant avatars use a vendored DiceBear `bottts-neutral` bundle, so no avatar service is called
at runtime. A participant UUID provides a stable avatar across screens and reconnects.

## Project structure

```text
.
├── quizzle/                  Spring Boot 4.1 application and Gradle wrapper
│   └── src/main/
│       ├── java/gd/safety/quizzle/
│       └── resources/       Static admin, presenter, and participant clients
├── quizzes/                 Quiz catalog YAML files
├── branding/                Branding YAML and image assets
├── data/                    Local SQLite data (ignored by Git)
├── docs/                    Deployment documentation
├── Dockerfile
└── docker-compose.yml
```

The backend is split into admin endpoints, quiz catalog/model, session state, persistence, branding,
and WebSocket packages. The browser clients use vanilla JavaScript—there is no separate frontend
build.

## Build and test

Run the Gradle wrapper from `quizzle/`:

**PowerShell**

```powershell
Set-Location .\quizzle
.\gradlew.bat test
.\gradlew.bat bootJar
```

**Bash**

```bash
cd quizzle
./gradlew test
./gradlew bootJar
```

The executable JAR is written to `quizzle/build/libs/quizzle-0.0.1-SNAPSHOT.jar`. Tests include unit
and Spring MVC coverage. The repository also contains `smoke-test.ps1`, a restart/persistence smoke
test for a preconfigured `quizzle-test` container listening on port `18080`.

> [!NOTE]
> Run the Gradle tests without Quizzle configuration variables such as `ADMIN_PASSWORD`,
> `QUIZ_FOLDER`, or `BRANDING_FILE` in the process environment. Some tests intentionally verify
> precedence between process variables, `.env`, and test fixtures.

## Deploy

### Container image

Build a production image from the repository root. The multi-stage [`Dockerfile`](Dockerfile) builds
the JAR with `gradle:9.5.1-jdk21` and runs it on `eclipse-temurin:21-jre` as the unprivileged user
`quizzle` (UID 10001):

```bash
docker build -t quizzle:local .
```

The image expects three paths under `/data`, all owned by UID 10001:

| Path | Contents | Mount |
| --- | --- | --- |
| `/data/quizzes` | Quiz YAML files | read-only |
| `/data/branding` | `branding.yaml` and `images/` | read-only |
| `/data/db` | SQLite snapshot database | read-write, **must be persistent** |

[`docker-compose.yml`](docker-compose.yml) wires exactly that up and publishes port `8080`. Set
`ADMIN_PASSWORD` in the environment (or an ignored `.env` next to the compose file) before starting:

```bash
ADMIN_PASSWORD='a-long-password' docker compose up -d --build
```

### Standalone JAR

Set `ADMIN_PASSWORD`, point `PUBLIC_BASE_URL` at the address participants actually reach, and enable
`SESSION_COOKIE_SECURE` when serving over HTTPS. Run the JAR from the repository root so the default
relative paths resolve:

```bash
export ADMIN_PASSWORD='a-long-password'
export PUBLIC_BASE_URL='https://quiz.example.org'
export SESSION_COOKIE_SECURE=true
export QUIZ_FOLDER=./quizzes
export BRANDING_FOLDER=./branding
export QUIZ_DATABASE_PATH=./data/quiz-snapshots.db
java -jar quizzle/build/libs/quizzle-0.0.1-SNAPSHOT.jar
```

### Reverse proxy

A reverse proxy in front of Quizzle must:

- forward WebSocket upgrades — pass through the `Upgrade` and `Connection` headers, otherwise
  participants cannot join or answer;
- **not** buffer `text/event-stream` responses, otherwise the presenter view receives no live
  updates. Quizzle sends `X-Accel-Buffering: no` on the event stream, which nginx honours on its own;
- allow idle connections to live longer than `WEBSOCKET_HEARTBEAT_TIMEOUT_MS` (default 40 s);
- forward the original host/scheme if `PUBLIC_BASE_URL` is not set explicitly.

If the event stream delivers nothing within six seconds, the presenter falls back to polling
`/admin/api/sessions/{codehash}/state` every two seconds and shows `Live (polling)`.

### Data and updates

Sessions are written to SQLite on every state change and flushed again on a timer. After a restart
the registry rehydrates open sessions: previously connected players become
`TEMPORARILY_DISCONNECTED` so their cookies keep working, and a question that was open when the
server stopped gets a fresh timer instead of an already-expired one. Closed sessions are deleted
instead of restored. Back up and persist `QUIZ_DATABASE_PATH`; everything else is rebuilt from the
quiz and branding files.

Quiz and branding files are read once at startup, so restart Quizzle after editing them.

For a complete TrueNAS SCALE setup, including persistent datasets, reverse proxy configuration,
updates, backups, and troubleshooting, see
[`docs/DEPLOYMENT-TRUENAS.md`](docs/DEPLOYMENT-TRUENAS.md).

## Common problems

| Symptom | Check |
| --- | --- |
| Server exits immediately | `ADMIN_PASSWORD` is missing or blank. |
| Quiz catalog is empty | `QUIZ_FOLDER` points to the directory containing the YAML files. |
| QR code opens the wrong host | `PUBLIC_BASE_URL` is not reachable from participant devices. |
| Participants repeatedly disconnect | The reverse proxy is not forwarding WebSocket upgrades. |
| Presenter shows `Live (polling)` | The proxy is buffering or blocking Server-Sent Events. |
| Sessions disappear after restart | `QUIZ_DATABASE_PATH` is not on persistent storage. |

- Participants join in `LOBBY`. Set `ALLOW_JOIN_AFTER_START=true` to also accept joins after the quiz starts, until the session is closed. Answers are accepted only during `QUESTION_OPEN`.
