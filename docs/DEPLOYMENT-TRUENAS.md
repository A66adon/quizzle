# Running Quizzle on TrueNAS SCALE

TrueNAS SCALE 24.10 and newer can install plain Docker Compose files through
**Apps → Discover Apps → ⋮ → Install via YAML**. This guide uses that path.

There is no published Quizzle container image, so the stack uses the official
`gradle:9.5.1-jdk21` image as its base: on startup it clones (or updates) the repository, builds the
Spring Boot jar and runs it. Quizzle stores its state in an embedded SQLite file, so **no database
container is needed**.

The application listens on port **17713** in this setup.

## 1. Prepare the datasets

Create these directories (for example as datasets under an existing pool):

```
/mnt/FastData/Apps/Quizzle/workspace    # git checkout and Gradle cache
/mnt/FastData/Apps/Quizzle/quizzes      # your quiz YAML files
/mnt/FastData/Apps/Quizzle/db           # SQLite session snapshots
```

Copy at least one quiz YAML into `quizzes/`. The format is described in the
[README](../README.md#writing-a-quiz); you can start from
`Backend/Quiz/quizzes/safety-basics.yaml`.

## 2. Install the app

Open **Apps → Discover Apps → ⋮ → Install via YAML**, name the app `quizzle`, and paste:

```yaml
services:
  quizzle:
    container_name: quizzle
    image: gradle:9.5.1-jdk21
    user: root
    working_dir: /workspace

    environment:
      - TZ=Europe/Berlin
      - GRADLE_USER_HOME=/workspace/.gradle

      # Required: the admin login password.
      - ADMIN_PASSWORD=REPLACE_WITH_A_LONG_PASSWORD

      # Must be the URL participants actually open; it goes into the join links and QR codes.
      - PUBLIC_BASE_URL=https://quiz.example.org
      - SESSION_COOKIE_SECURE=true

      - SERVER_PORT=17713
      - QUIZ_FOLDER=/data/quizzes
      - QUIZ_DATABASE_PATH=/data/db/quiz-snapshots.db

      # Optional:
      # - JAVA_TOOL_OPTIONS=-Xms256m -Xmx1024m

    ports:
      - "17713:17713"

    volumes:
      - /mnt/FastData/Apps/Quizzle/workspace:/workspace
      - /mnt/FastData/Apps/Quizzle/quizzes:/data/quizzes
      - /mnt/FastData/Apps/Quizzle/db:/data/db

    restart: unless-stopped

    command:
      - bash
      - -c
      - |
        set -eu
        if [ -d /workspace/quizzle/.git ]; then
          git -C /workspace/quizzle pull --ff-only
        else
          git clone --depth 1 https://git.olli.info/Oliver/quizzle.git /workspace/quizzle
        fi
        cd /workspace/quizzle/Backend/Quiz
        gradle --no-daemon bootJar
        exec java -jar build/libs/Quiz-0.0.1-SNAPSHOT.jar
```

Replace `ADMIN_PASSWORD` and `PUBLIC_BASE_URL` before starting, then install.


The first start downloads the Gradle dependencies and takes a few minutes. Because
`GRADLE_USER_HOME` points into the persistent workspace, later restarts only rebuild what changed.
Follow the progress under **Apps → quizzle → Logs**; the app is ready when the log shows
`Started QuizApplication`.

## 3. Reverse proxy

Quizzle is reachable directly at `http://TRUENAS-IP:17713`. If you publish it through a reverse
proxy, the proxy must:

- forward WebSocket upgrades (`Upgrade` and `Connection` headers) for `/{codehash}/data`,
- not buffer `text/event-stream` responses – the presenter view uses Server-Sent Events for
  `/admin/api/sessions/{codehash}/events`,
- allow long-lived connections (a quiz session keeps one socket open for its whole duration).

Nginx example:

```nginx
location / {
    proxy_pass         http://TRUENAS-IP:17713;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade    $http_upgrade;
    proxy_set_header   Connection $connection_upgrade;
    proxy_set_header   Host       $host;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_buffering    off;
    proxy_read_timeout 3600s;
}
```

Set `PUBLIC_BASE_URL` to the public URL (`https://quiz.example.org`), not to the TrueNAS IP –
otherwise the QR code sends participants to an address they cannot reach. Keep
`SESSION_COOKIE_SECURE=true` whenever the public URL uses HTTPS.

## 4. Verify

1. Open `https://quiz.example.org/admin/login` and sign in.
2. The quiz catalog must list the files from `/data/quizzes`. Broken files appear as skipped with
   their validation error.
3. Create a session, open the presenter view and scan the QR code with a phone.
4. Restart the app in TrueNAS – the session must still be there afterwards, and the phone must
   reconnect on its own.

## Updating

Restart the app (**Apps → quizzle → ⋮ → Restart**). The start command runs `git pull --ff-only` and
rebuilds the jar.

To pin a specific version instead of always tracking `main`, replace the clone line with a tag:

```bash
git clone --depth 1 --branch v1.0.0 https://git.olli.info/Oliver/quizzle.git /workspace/quizzle
```

## Backup

Everything worth keeping lives in the mounted datasets:

- `quizzes/` – your quiz definitions,
- `db/quiz-snapshots.db` – running and finished sessions.

`workspace/` is a disposable build cache; deleting it only forces a fresh clone and rebuild.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| App exits immediately, log says `ADMIN_PASSWORD must be set` | `ADMIN_PASSWORD` is empty in the YAML. |
| App never starts, log ends in a `git clone` error | TrueNAS cannot reach `git.olli.info`, does not trust its certificate, or the repository needs a token. |
| Catalog is empty | `QUIZ_FOLDER` does not point at the mounted dataset, or it contains no `.yaml` / `.yml` files. |
| QR code leads nowhere | `PUBLIC_BASE_URL` still points at `localhost` or an internal address. |
| Participants show "Connection lost" in a loop | The reverse proxy does not forward WebSocket upgrades. |
| Presenter view stays on "Reconnecting" | The reverse proxy buffers `text/event-stream`. |
| Sessions gone after a restart | `/data/db` is not persisted, or `QUIZ_DATABASE_PATH` points outside the mount. |
