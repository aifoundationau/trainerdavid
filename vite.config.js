import { defineConfig } from 'vite'

// Vite with native esbuild JSX transform (instant, zero Babel dependencies)
export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  server: {
    port: 3000,
    open: false
  }
})
