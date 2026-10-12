// Cheap mechanical checks for rules that are easy to break by accident and slow to catch in review:
// focused or skipped tests, Svelte 4 syntax in a Svelte 5 runes codebase, and non-exact dependency pins.
// Run: node scripts/guard.mjs (CI runs it too). Exits 1 with one line per problem.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);

const RULES = [
  { files: /\.test\.ts$/, re: /\b(?:it|test|describe)\.(?:only|skip|todo)\b|\bx(?:it|describe)\(/, why: 'focused or skipped test' },
  { files: /\.svelte$/, re: /\bon:[a-z]+=|^\s*export let\b|^\s*\$:\s|createEventDispatcher|<slot\b/m, why: 'Svelte 4 syntax (use onclick, $props, $derived, snippets)' },
  { files: /\.(?:ts|svelte)$/, re: /from 'svelte\/store'/, why: 'svelte/store (use a class with $state fields)' },
];

const problems = [];
for (const file of walk('src')) {
  const text = readFileSync(file, 'utf8');
  for (const r of RULES) {
    if (!r.files.test(file)) continue;
    text.split('\n').forEach((line, i) => { if (r.re.test(line)) problems.push(`${file}:${i + 1} ${r.why}: ${line.trim()}`); });
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const [name, v] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }))
  if (!/^\d+\.\d+\.\d+$/.test(v)) problems.push(`package.json ${name}@${v}: pin an exact version`);

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('guard ok');
