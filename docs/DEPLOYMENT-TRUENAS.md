# Quizzle on TrueNAS SCALE

TrueNAS SCALE versions supporting Docker Compose can run the repository stack. Build a pinned
Quizzle image on a build host and make it available to TrueNAS, or deploy the checked-out Compose
project using a supported local-build workflow. Do not clone/pull/build arbitrary `main` code as
root on every container start.

> **Breaking change:** the old single-container YAML-account/SQLite setup no longer applies.
> There is no automatic account/quiz/snapshot migration. Back up that installation, register and
> verify new accounts, then explicitly import exported quiz YAML. Follow the
> [deployment guide](deployment.md) for configuration and backup/restore.

## Storage and configuration

Use PostgreSQL 16 with a persistent volume mounted at `/var/lib/postgresql/data`. For TrueNAS
bind datasets, replace only the database volume's source with a dedicated dataset and ensure
the PostgreSQL container user can access it. Do not reuse the SQLite dataset as a database cluster.
Keep database host ports unpublished.

Mount a branding dataset at `/branding:ro`, preserving `branding.yaml` and `images/`. The app
uses UID/GID 10001 and needs only read access to branding. There are no writable per-account
quiz or account files to mount.

Configure the root `.env.example` variables through TrueNAS private environment settings:
PostgreSQL credentials, SMTP sender/host/auth/TLS, external `PUBLIC_BASE_URL`,
`SESSION_COOKIE_SECURE=true`, optional email-domain restriction and optional Google client
credentials. The app's JDBC hostname must match the database Compose service.

If using a prebuilt image, replace `build: .` with your pinned `image:` in the repository
Compose service. Keep the PostgreSQL dependency/health checks, graceful stop period and named
volume. Set the application port mapping to `17713:8080` if preserving the former TrueNAS port.
Do not change the application's internal port unless its health check is changed consistently.

## Proxy and first use

Terminate HTTPS at a trusted reverse proxy. Forward WebSocket upgrades for `/{codehash}/data`,
disable SSE buffering for `/admin/api/sessions/{codehash}/events`, and allow long-lived
connections. Set `PUBLIC_BASE_URL` to the external HTTPS origin, not the container IP.

Confirm `/health`, register at `/register`, follow the SMTP verification email, sign in at
`/login`, and import a quiz. Test one participant and presenter before public use. Google requires
the exact `/login/oauth2/code/google` authorized redirect URI when enabled.

## Upgrades and backups

Use `scripts/backup.sh` against the correct Compose deployment before updating the pinned image.
Store encrypted/off-host database dumps and separate branding/configuration backups. Replace the
image and recreate the app; Flyway migrates at startup. Confirm account/settings/quizzes and
supported session recovery.

Restarting/replacing containers does not delete PostgreSQL data. **Removing the database volume
or running `docker compose down -v` does.** Restoring a pre-upgrade dump may be necessary for
rollback after schema changes; a previous image alone is not a database rollback.
