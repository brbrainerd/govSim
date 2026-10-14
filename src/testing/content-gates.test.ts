// Content and readability gates (OBS-05, GR-24, GR-25, GR-35).
import fs from 'node:fs';
import path from 'node:path';
import { fleschKincaid } from 'flesch-kincaid';
import { syllable } from 'syllable';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../..');
const CONTENT_DIR = path.join(ROOT, 'src/content');
const SRC_DIR = path.join(ROOT, 'src');

const BANNED_POLITICIANS = [
  'biden',
  'trump',
  'harris',
  'obama',
  'bush',
  'clinton',
  'mcconnell',
  'schumer',
  'pelosi',
  'jeffries',
  'mccarthy',
  'boehner',
  'gingrich',
];

function extractStrings(obj: unknown): string[] {
  if (typeof obj === 'string') return [obj];
  if (Array.isArray(obj)) return obj.flatMap(extractStrings);
  if (obj && typeof obj === 'object') {
    return Object.entries(obj)
      .filter(([k]) => k !== 'citation' && k !== 'legalBasis')
      .flatMap(([, v]) => extractStrings(v));
  }
  return [];
}

function collectFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        files.push(...collectFiles(fullPath));
      }
    } else if (/\.(ts|svelte)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('content and readability gates (OBS-05, GR-24, GR-25)', () => {
  it('content strings in src/content/ have reading grade <= 9.0 and sentences <= 20 words', async () => {
    // Note: briefing.ts uses dynamic state callbacks and is gated via src/content/briefing.test.ts.
    const mods = [
      await import('../content/parties'),
      await import('../content/orders'),
      await import('../content/myths'),
      await import('../content/explainers'),
      await import('../content/scenarios'),
      await import('../content/chyrons'),
    ];
    const rawStrings = mods.flatMap(extractStrings);
    const strings = rawStrings.filter(
      (s) => !s.startsWith('http') && !s.includes('§') && !/\([A-Z0-9-]+\)$/.test(s.trim()),
    );

    for (const str of strings) {
      // Split into sentences
      const sentences = str
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && /[a-zA-Z]/.test(s));

      for (const sentence of sentences) {
        const words = sentence.split(/\s+/).filter(Boolean);
        expect(
          words.length,
          `Sentence exceeds 20 words (${words.length} words): "${sentence}"`,
        ).toBeLessThanOrEqual(20);

        if (words.length >= 5) {
          const sylCount = words.reduce((acc, w) => acc + syllable(w), 0);
          const grade = fleschKincaid({
            sentence: 1,
            word: words.length,
            syllable: sylCount,
          });
          expect(
            grade,
            `Sentence exceeds 9.0 reading grade (${grade.toFixed(1)}): "${sentence}"`,
          ).toBeLessThanOrEqual(9.0);
        }
      }
    }
  });

  it('no real politician names appear in any source file under src/', () => {
    const files = collectFiles(SRC_DIR);
    const violations: { file: string; match: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const name of BANNED_POLITICIANS) {
        const regex = new RegExp(`\\b${name}\\b`, 'i');
        if (regex.test(content)) {
          violations.push({
            file: path.relative(ROOT, file),
            match: name,
          });
        }
      }
    }

    expect(
      violations,
      `Real politician names found in codebase:\n${JSON.stringify(violations, null, 2)}`,
    ).toEqual([]);
  });

  it('party names "Democratic" and "Republican" appear strictly in src/content/parties.ts', () => {
    const files = collectFiles(SRC_DIR);
    const violations: { file: string; match: string }[] = [];

    for (const file of files) {
      const rel = path.relative(ROOT, file);
      // parties.ts is the single source of truth for party names
      if (rel === 'src/content/parties.ts') continue;

      const content = fs.readFileSync(file, 'utf8');
      const match = content.match(/\b(Democratic|Republican)\b/);
      if (match) {
        violations.push({
          file: rel,
          match: match[0],
        });
      }
    }

    expect(
      violations,
      `Party names must ONLY appear in src/content/parties.ts, but were found in:\n${JSON.stringify(violations, null, 2)}`,
    ).toEqual([]);
  });
});
