// Proves the engine replays bit-identically on Node, Chromium, Firefox and WebKit, minified and not (FND-02).
// Compares every runtime with Node's unminified result computed live; no committed goldens (Phase 2, OBS-02).
// usage: pnpm determinism      (exit 1 on any DIFF or if fewer than 8 results were collected)
import { build } from 'vite';
import { chromium, firefox, webkit } from '@playwright/test';

const EXPECTED = 8;

const bundle = async (minify) => {
  const out = await build({
    configFile: false,
    logLevel: 'error',
    build: { write: false, minify, lib: { entry: 'src/engine/replayFixture.ts', name: 'Fx', formats: ['iife'] } },
  });
  return (Array.isArray(out) ? out[0] : out).output[0].code;
};

const results = [];
try {
  for (const minify of [false, true]) {
    const code = await bundle(minify);
    const run = `(() => { ${code}; return Fx.runFixture(); })()`;
    results.push([`node ${process.version} (min=${minify})`, (0, eval)(run)]);
    for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
      const browser = await type.launch();
      try {
        const page = await browser.newPage();
        results.push([`${name} ${browser.version()} (min=${minify})`, await page.evaluate(run)]);
      } finally {
        await browser.close();
      }
    }
  }
} catch (err) {
  console.error('determinism run failed:', err);
  process.exit(1);
}

const ref = results[0][1];
for (const [label, r] of results) console.log(r === ref ? 'OK  ' : 'DIFF', label);
const bad = results.filter(([, r]) => r !== ref).length;
if (results.length < EXPECTED) console.error(`only ${results.length} of ${EXPECTED} results collected`);
if (bad || results.length < EXPECTED) process.exit(1);
