import type { Reporter, TestCase, TestResult, FullResult, FullConfig, Suite } from '@playwright/test/reporter';
import { mkdirSync, writeFileSync } from 'node:fs';

export default class SafeReporter implements Reporter {
  private results: object[] = [];
  private readonly discoveryOnly = process.argv.includes('--list');
  private discoveredTests = 0;
  onBegin(_config: FullConfig, suite: Suite) {
    this.discoveredTests = suite.allTests().length;
  }
  onTestEnd(test: TestCase, result: TestResult) {
    console.log(`${result.status}: ${test.parent.project()?.name} / ${test.title}`);
    if (result.status !== 'passed') {
      // Playwright error messages include locator values, mail bodies and token URLs.
      const locations = result.errors.map(error => error.location
        ? `${error.location.file.split(/[\\/]/).pop()}:${error.location.line}`
        : 'see failing test assertion');
      console.log(`Failure locations: ${locations.join(', ')}`);
    }
    this.results.push({
      project: test.parent.project()?.name, title: test.title,
      status: result.status, durationMs: result.duration,
      failureLocations: result.errors.map(error => error.location
        ? `${error.location.file.split(/[\\/]/).pop()}:${error.location.line}` : 'assertion'),
      diagnostics: result.attachments.filter(item => item.name === 'safe-runtime-diagnostics')
        .map(item => item.body ? JSON.parse(item.body.toString()) : null)
    });
  }
  onEnd(result: FullResult) {
    if (this.discoveryOnly) {
      console.log(`Browser discovery only: ${this.discoveredTests} tests discovered; none executed.`);
      return;
    }
    console.log(`Browser suite: ${result.status}`);
    mkdirSync('safe-results', { recursive: true });
    writeFileSync('safe-results/results.json', JSON.stringify({ status: result.status, tests: this.results }, null, 2));
  }
}
