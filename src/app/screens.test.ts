import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { navFor, screens } from './screens';

describe('screen registry', () => {
  it('groups the rail Home → See → Act and unlocks over year 1', () => {
    const nav = navFor(1);
    expect(nav.map((g) => g.label)).toEqual(['Home', 'See', 'Act']);
    expect(nav.flatMap((g) => g.screens.filter((s) => s.locked).map((s) => s.id))).toEqual(['voters', 'congress', 'powers']);
    expect(navFor(4).flatMap((g) => g.screens).every((s) => !s.locked)).toBe(true);
    expect(navFor(1, true).flatMap((g) => g.screens).every((s) => !s.locked)).toBe(true);
  });

  it('keeps every label plain (≤ 6 words) and ids unique', () => {
    expect(new Set(screens.map((s) => s.id)).size).toBe(screens.length);
    for (const s of screens) expect(s.label.split(' ').length).toBeLessThanOrEqual(6);
  });
});

describe('token drift', () => {
  it('has no colour literals outside tokens.ts', () => {
    const files = readdirSync('src', { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.(svelte|css)$/.test(f));
    const offenders = files.filter((f) => /#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(readFileSync(join('src', f), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
