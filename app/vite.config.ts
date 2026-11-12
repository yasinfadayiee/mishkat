import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// base نسبی تا همین خروجی در ویندوز (Electron)، اندروید/آیفون (Capacitor) و وب کار کند
export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version.replace(/\.0$/, '')) },
  worker: { format: 'es' },
  server: { port: 5173 },
})
