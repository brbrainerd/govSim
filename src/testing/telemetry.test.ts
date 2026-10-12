// Zero-telemetry audit: ensures no tracking or telemetry libraries exist in dependencies or source code (OBS-04).
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../..');

const BANNED_PACKAGES = [
  'google-analytics',
  'gtag',
  'sentry',
  '@sentry',
  'posthog',
  'amplitude',
  'mixpanel',
  'clarity',
  'hotjar',
  'segment',
  '@segment',
  'datadog',
  '@datadog',
  'newrelic',
  'logrocket',
];

const BANNED_STRING_PATTERNS = [
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /sentry\.io/i,
  /posthog\.com/i,
  /mixpanel\.com/i,
  /amplitude\.com/i,
  /hotjar\.com/i,
  /clarity\.ms/i,
  /segment\.io/i,
  /\bgtag\s*\(/,
  /\b_gaq\b/,
  /\bnavigator\.sendBeacon\b/,
];

function collectFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        files.push(...collectFiles(fullPath));
      }
    } else if (/\.(ts|svelte|html|json|js|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('zero-telemetry audit (OBS-04)', () => {
  it('package.json contains zero analytics or telemetry dependencies', () => {
    const pkgJsonPath = path.join(ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

    const allDeps = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ];

    for (const dep of allDeps) {
      for (const banned of BANNED_PACKAGES) {
        expect(
          dep.toLowerCase(),
          `Banned telemetry package "${dep}" found in package.json`,
        ).not.toContain(banned);
      }
    }
  });

  it('source files contain zero tracking endpoints or telemetry beacons', () => {
    const srcDir = path.join(ROOT, 'src');
    const indexHtml = path.join(ROOT, 'index.html');
    const filesToScan = [...collectFiles(srcDir), indexHtml];

    const violations: { file: string; match: string }[] = [];

    for (const file of filesToScan) {
      // Skip this test file itself so it doesn't trigger on its own regex list
      if (file.endsWith('telemetry.test.ts')) continue;

      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of BANNED_STRING_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
          violations.push({
            file: path.relative(ROOT, file),
            match: match[0],
          });
        }
      }
    }

    expect(
      violations,
      `Found tracking/telemetry strings in source:\n${JSON.stringify(violations, null, 2)}`,
    ).toEqual([]);
  });

  it('index.html contains strict CSP restricting network egress', () => {
    const indexHtml = path.join(ROOT, 'index.html');
    const content = fs.readFileSync(indexHtml, 'utf8');

    expect(content).toContain('http-equiv="Content-Security-Policy"');
    expect(content).toContain("default-src 'none'");
    expect(content).toContain("script-src 'self'");
    expect(content).toContain("connect-src 'self' https://*.r2.cloudflarestorage.com");
  });
});
