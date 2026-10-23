import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Geliştirmede React yenileme betiği satır içi çalıştığı için CSP yalnızca derlemede eklenir
const csp = {
  name: 'studio-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content:
          "default-src 'self'; img-src 'self' data: https: studio-media:; media-src 'self' https: studio-media:; style-src 'self' 'unsafe-inline'; script-src 'self'",
      },
      injectTo: 'head-prepend',
    },
  ],
}

export default defineConfig({
  plugins: [react(), csp],
  base: './',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
})
