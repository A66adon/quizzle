export function redact(value: string): string {
  // Allowlist diagnostic categories, not arbitrary application text: even short
  // strings may be passwords, mail bodies, quiz contents or participant names.
  const kind = value.match(/\b(?:TypeError|ReferenceError|SyntaxError|RangeError|EvalError|URIError)\b/)?.[0]
    || (/\bnet::ERR_[A-Z_]+\b/.exec(value)?.[0])
    || (/failed to (?:fetch|load)/i.test(value) ? 'resource/network failure' : 'application error');
  const status = value.match(/\b(?:status|HTTP)\D{0,10}([45]\d{2})\b/i)?.[1];
  return `${kind}${status ? ` (HTTP ${status})` : ''}; message payload redacted`;
}
