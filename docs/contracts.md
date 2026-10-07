# HTTP and realtime contracts

This inventory records the integrated HTTP contracts. Participant entry, WebSocket messages and
presenter commands remain compatible with the pre-PostgreSQL baseline.

## Authentication and ownership

Form endpoints are `GET/POST /register`, `GET/POST /login`, and `POST /logout`.
Login submits `email` and `password`; registration also requires `passwordConfirmation` and
creates a pending account without signing it in. `GET /verify-email?token=...` consumes a
verification link and leads to ordinary login. Forgot/resend submit `email` to
`/forgot-password` and `/resend-verification`; reset submits `token`, `password` and
`passwordConfirmation` to `/reset-password` and never signs in automatically.
Spring Security holds the authenticated account principal in the session, rotates successful
sign-ins and rejects revoked credential versions.
The readable `XSRF-TOKEN` cookie is echoed in `X-XSRF-TOKEN` or the `_csrf` form parameter.
Admin, editor and settings pages and `/admin/api/**` require authentication. Ownership misses
return 404, rather than disclosing another account's sessions or quizzes.

## Quiz editor and settings

`GET /admin/api/quizzes` lists the caller's quizzes and validation issues.
`GET /admin/api/quizzes/{fileName}` returns `{fileName, quiz, version}`.
`POST /admin/api/quizzes` creates a quiz; `PUT /admin/api/quizzes/{fileName}` updates it;
`DELETE` on the same route deletes it. Updates submit `{quiz, version}`; stale writes return
409 with `{error:"REVISION_CONFLICT", currentVersion}`. Import posts raw `application/yaml`
to `/admin/api/quizzes/import`; export gets `/admin/api/quizzes/{fileName}/export`.

`GET /admin/api/account/settings` reads account/game defaults. The settings controller also
handles game defaults, password changes and account deletion. Settings include
`accountId`, `email`, `hasLocalPassword`, `allowLateJoin` and `autoAdvanceDelayMs`.
Local deletion supplies `{currentPassword}`; OAuth-only deletion requires recent same-account
provider reauthentication at `/reauthenticate`. Defaults apply to newly created game sessions,
not the participant identity.

The editor has explicit Save, serialized debounced saves, account-isolated local drafts,
recovery/conflict dialogs, navigation confirmation and `beforeunload`. Page hide stores local
content rather than issuing a racing server save. Acknowledgements clear only matching content
and base revisions; other tabs' drafts are not deleted.

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

`GET /health` is public and performs a bounded database readiness query. It returns
`{"status":"UP"}` or HTTP 503 with `{"status":"DOWN"}`. It contains no actuator, account,
configuration, database-address or credentials detail.
