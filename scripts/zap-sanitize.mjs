import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const directory = process.argv[2] || 'scripts/zap-results';
const jsonPath = join(directory, 'baseline.json');
const publicPaths = new Set([
  '/', '/login', '/register', '/forgot-password', '/reset-password',
  '/resend-verification', '/verify-email', '/health', '/auth/options'
]);
try {
  const report = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const rules = (report.site || []).flatMap(site => (site.alerts || []).map(alert => ({
    ruleId: String(alert.pluginid),
    riskCode: String(alert.riskcode),
    confidence: String(alert.confidence),
    instanceCount: (alert.instances || []).length,
    paths: [...new Set((alert.instances || []).map(instance => {
      try {
        const path = new URL(instance.uri).pathname;
        return publicPaths.has(path) ? path : '/[redacted-path]';
      } catch { return '/[redacted-path]'; }
    }))],
    cookies: [...new Set((alert.instances || []).map(instance =>
      ['XSRF-TOKEN', 'QUIZ_SESSION'].includes(instance.param) ? instance.param : '[redacted-param]'))]
  })));
  writeFileSync(join(directory, 'safe-summary.json'), JSON.stringify({ rules }, null, 2));
  console.log(`ZAP: ${rules.length} reported rules; evidence payloads redacted`);
} catch {
  console.error('ZAP report missing or invalid; raw payload withheld');
  process.exitCode = 1;
} finally {
  // ZAP evidence may contain Set-Cookie values, even for anonymous browsing.
  rmSync(jsonPath, { force: true });
  rmSync(join(directory, 'baseline.html'), { force: true });
}
