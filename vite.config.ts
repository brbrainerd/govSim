import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Relative base so the static build works on GitHub Pages project paths.
export default defineConfig({ plugins: [svelte()], base: './' });
