# HTTP and realtime contracts

This inventory captures the pre-PostgreSQL baseline. Changes below retain route names unless
explicitly noted; participant entry, WebSocket messages and presenter commands remain compatible.

## Authentication and ownership

Baseline form endpoints are `GET/POST /register`, `GET/POST /login`, and `POST /logout`.
Forms currently submit `username` and `password`; the authentication checkpoint replaces the
username field with `email` and adds password confirmation and verification.
The baseline account ID is held in an HTTP session, rotated on successful registration/login.
The readable `XSRF-TOKEN` cookie is echoed in `X-XSRF-TOKEN` or the `_csrf` form parameter.
Admin, editor and settings pages and `/admin/api/**` require authentication. Ownership misses
return 404, rather than disclosing another account's sessions or quizzes.

## Quiz editor and settings

`GET /admin/api/quizzes` lists the caller's quizzes and validation issues.
`GET /admin/api/quizzes/{fileName}` returns `{fileName, quiz}`.
`POST /admin/api/quizzes` creates a quiz; `PUT /admin/api/quizzes/{fileName}` updates it;
`DELETE` on the same route deletes it. The database checkpoint adds an explicit revision to
responses and update requests and returns 409 on stale writes.

`GET /admin/api/account/settings` reads account/game defaults. The settings controller also
handles game defaults, password changes and account deletion. Defaults apply to newly created
game sessions, not the participant identity.

The existing editor has explicit Save, dirty comparison, navigation confirmation, `beforeunload`
and best-effort page-hide saving. It has no durable account-isolated local draft or revision
conflict protection at baseline.

## Presenter lifecycle

`GET/POST /admin/api/sessions` lists/creates owned sessions. Creation submits
`{quizFileName}`. `GET /admin/api/sessions/{codehash}` reads an owned session.
`POST /admin/api/sessions/{codehash}/commands` submits `{command}`.
Other routes beneath the session are `qr.svg`, `events` (SSE), `state` (polling fallback),
`players/{playerId}/kick`, and `leaderboard` with `{enabled}`.

Session states are `LOBBY`, `QUESTION_OPEN`, `RESULTS`, `LEADERBOARD`, `FINAL_RESULTS`, and `CLOSED`.
Consult `GameCommand` and `GameStateMachine` for valid transitions. Closed snapshots are removed;
restart recovery marks participant connections disconnected and normalizes open-question state.

## Participants

Participants enter through `/{codehash}/` and connect to `/{codehash}/data`.
The first JSON message is `{type:"JOIN", name}` or `{type:"JOIN", reconnectToken}` (exactly one).
Subsequent answers are `{type:"ANSWER", questionId, answerIds:[...]}`.
The server sends `{type, payload}` envelopes with `JOINED`, `STATE`, `ANSWER_ACCEPTED`, or `ERROR`.
`JOINED` includes the participant, reconnect token, prior answers, server time and session state.
`ANSWER_ACCEPTED` includes question ID and accepted-answer count. Answers are checked against
the server deadline and current question, not client clocks. Ping/pong and a disconnect grace
period support reconnection; maximum message size and name length are configurable.

## Health

`GET /health` is public and returns only `{"status":"UP"}`. It contains no actuator, account,
configuration or credentials detail. Deployment readiness must additionally confirm database
health and successful application startup.
