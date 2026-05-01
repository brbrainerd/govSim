/// <reference types="vitest" />
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,svelte.ts}"],
    setupFiles: [],
  },
  resolve: {
    alias: {
      $lib: resolve(__dirname, "src/lib"),
    },
  },
  // Vite dev server config for Tauri.
  server: {
    port: 5173,
    strictPort: true,
  },
  // Prevent Vite from obscuring Rust errors.
  clearScreen: false,
  // Produce source maps for easier debugging in Tauri.
  build: {
    sourcemap: true,
    // Manually split large vendor chunks for predictable lazy-loading.
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ["echarts"],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
