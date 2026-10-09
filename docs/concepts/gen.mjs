// usage: node gen.mjs <model> <outName> <promptFile> [aspect] [refImage...]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const [model, out, promptFile, aspect = '16:9', ...refs] = process.argv.slice(2);
const prompt = readFileSync(promptFile, 'utf8');
const content = [
  ...refs.map((f) => ({ type: 'image_url', image_url: { url: `data:image/png;base64,${readFileSync(f).toString('base64')}` } })),
  { type: 'text', text: prompt },
];
const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, modalities: ['image', 'text'], image_config: { aspect_ratio: aspect }, messages: [{ role: 'user', content }] }),
});
const j = await res.json();
if (!res.ok) { console.error(res.status, JSON.stringify(j).slice(0, 500)); process.exit(1); }
const imgs = j.choices?.[0]?.message?.images ?? [];
if (!imgs.length) { console.error('no image', JSON.stringify(j).slice(0, 500)); process.exit(1); }
mkdirSync('out', { recursive: true });
imgs.forEach((im, i) => {
  const f = `out/${out}${i ? '-' + i : ''}.png`;
  writeFileSync(f, Buffer.from(im.image_url.url.split(',')[1], 'base64'));
  console.log(f, j.usage?.cost ?? '');
});
