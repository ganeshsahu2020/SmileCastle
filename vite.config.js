// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Vite configuration
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,    // dev server port (npm run dev)
    open: true
  },
  preview: {
    port: 5177,    // preview server port (npm run preview)
    open: true
  }
})
