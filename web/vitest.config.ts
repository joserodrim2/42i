import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Standalone from vite.config.ts: unit tests don't need the dev proxy or the
// Tailwind plugin, just React + jsdom.
export default defineConfig({
  plugins: [react()],
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
