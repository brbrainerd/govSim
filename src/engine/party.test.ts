import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { newGame } from './game';
import { START } from './fixture';

// FND-08 / D4: the engine is party-blind by absence. Comments count too.
describe('party blindness', () => {
  it('no engine source file mentions party or parties', () => {
    const files = readdirSync('src/engine', { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    const offenders = files.filter((f) => /\bpart(y|ies)\b/i.test(readFileSync(join('src/engine', f), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('newGame takes only (seed, start) and its state has no party', () => {
    expect(newGame.length).toBe(2);
    expect(Object.keys(newGame(1, START))).not.toContain('party');
  });
});
