import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],

  resolve: {
    alias: {
      '@': '/src'
    }
  },

  server: {
    port: 5173,
    open: true,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    },

    // ✅ fixes websocket / HMR failures on Windows + SW setups
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      clientPort: 5173
    }
  },

  build: {
    target: 'es2020',
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true
  }
})
