import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,        // allow fallback to next port if 5173 is taken
    hmr: {
      overlay: true,          // show errors as overlay instead of crashing
    },
    watch: {
      usePolling: true,       // more reliable file watching on Windows
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})

