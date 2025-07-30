import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Vite configuration
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,          // Custom dev server port
    open: true           // Auto-open browser on dev start
  }
})
