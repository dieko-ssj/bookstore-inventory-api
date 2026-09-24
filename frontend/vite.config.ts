import fs from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const isDocker = fs.existsSync('/.dockerenv')
const defaultBackend = isDocker ? 'http://backend:8000' : 'http://localhost:8000'
const backendTarget = process.env.BACKEND_URL || defaultBackend

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true, // Permite conexiones externas en Docker
    // Proxy automático: http://backend:8000 en Docker o http://localhost:8000 en local
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
})
