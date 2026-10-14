import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Relative base so the static build works on GitHub Pages or custom host paths.
export default defineConfig({
  plugins: [svelte()],
  base: './',
  test: {
    include: ['src/**/*.test.ts'],
  },
  preview: {
    headers: {
      'Content-Security-Policy':
        "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://*.r2.cloudflarestorage.com https://openrouter.ai https://generativelanguage.googleapis.com https://api.groq.com http://localhost:* http://127.0.0.1:*;",
    },
  },
});
