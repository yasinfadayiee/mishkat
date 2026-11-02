import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base نسبی تا همین خروجی در ویندوز (Electron)، اندروید/آیفون (Capacitor) و وب کار کند
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173 },
})
