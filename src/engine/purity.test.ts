// D10 / T-1-04: the engine is arithmetic-only. The scanner is self-tested so it cannot pass silently.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scan } from '../testing/scan';

describe('scanner self-test', () => {
  const hits = (src: string) => scan('x.ts', src).hits.length;
  it('flags what the engine must not use', () => {
    expect(hits('Math.log(x)')).toBe(1);
    expect(hits('x ** 2')).toBe(1);
    expect(hits('const d = Date.now()')).toBe(1);
    expect(hits("import x from '../app/session'")).toBe(1);
  });
  it('ignores what is allowed', () => {
    expect(hits('Math.max(a, b)')).toBe(0);
    expect(hits('// Math.log(x)')).toBe(0);
  });
  it('reports bare numeric literals', () => {
    expect(scan('x.ts', '0.07 * x').literals).toHaveLength(1);
  });
});

describe('engine purity', () => {
  const dir = 'src/engine';
  const files = readdirSync('src/engine').filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
  it('scans the engine files', () => {
    expect(files).toContain('game.ts');
    expect(files).toContain('rng.ts');
  });
  it('has no non-deterministic Math, **, platform global or UI import', () => {
    const hits = files.flatMap((f) => scan(join(dir, f), readFileSync(join(dir, f), 'utf8')).hits);
    expect(hits).toEqual([]);
  });
});
