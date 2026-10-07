# Passive DAST review

**NOT EXECUTED locally:** Docker is unavailable. Run nightly/manual CI before
claiming scanner coverage. `bash e2e/run-ci.sh zap` creates PostgreSQL/Mailpit
and a disposable application, runs Chromium authenticated security assertions,
then runs the pinned `ghcr.io/zaproxy/zaproxy:2.16.1` baseline scanner.

Standalone `bash scripts/zap-baseline.sh <disposable-compose-network>` requires
an already isolated HTTP stack and installed e2e Chromium dependencies.
The ZAP target is container-local `http://quizzle:8080`; it is not a configurable
external target. The crawler is anonymous/passive, not an authenticated active
attack scan. Authenticated CSRF/authorization checks are explicitly Playwright
tests, not claimed as ZAP crawler coverage.

Reviewed rules:

* 10020/10021/10038 FAIL: clickjacking, MIME sniffing and missing CSP.
* 10010 FAIL for cookies; the hook filters **only** `param == XSRF-TOKEN`
  at `quizzle:8080`. Browser JavaScript must read the double-submit CSRF cookie;
  every other cookie finding (including QUIZ_SESSION) remains blocking.
* 10011 IGNORE **only for the disposable plain-HTTP environment**. Secure
  session cookies must be verified in production HTTPS/backend configuration.
* 10035 WARN: HSTS belongs at the HTTPS boundary; review in deployment.
* Every unspecified rule remains WARN. Warnings return exit 2 and block CI;
  FAIL returns 1, scanner/infrastructure failure returns 3. No `-I`, global
  IGNORE or catch-all suppression exists. Do not convert new findings to IGNORE
  simply to obtain a green job.

Review findings against rule ID, evidence, affected paths, product requirements
and HTTPS boundary. Keep scoped exceptions documented here and covered by a
regression assertion. The hook mutates the gate's alert dictionary. The safe
summary retains rule IDs/severity, counts, known public paths and cookie names,
including the reviewed exception, without evidence payloads.

Reports are ephemeral, anonymous only, under ignored `scripts/zap-results`.
Raw scanner HTML/JSON may contain anonymous Set-Cookie values; the sanitizer
deletes them after extracting an allowlisted `safe-summary.json`. Only this
summary is uploaded. No raw ZAP request/response evidence is archived.
Only that dedicated directory is made writable for the scanner's non-root UID;
rule/hook files mount read-only. CI retains reports and safe test diagnostics
for three days. Do not add Mailpit, authenticated cookie/header dumps, token
links or production logs to uploaded artifacts.
