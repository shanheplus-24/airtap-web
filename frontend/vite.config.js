import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './',
    cacheDir: env.VITE_CACHE_DIR || undefined,
    plugins: [
      react({
        include: '**/*.{jsx,js}',
      })
    ],
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.[jt]sx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 3069,
      strictPort: true,
      open: false,
      watch: {usePolling: true, interval: 700},
      fs: {allow: ['.', '/mnt/d/Codex Files/Environment/Runtimes/WaterTAP_UI/node_modules']},
      proxy: {'/api': {target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8002', rewrite: path => path.replace(/^\/api/, ''), timeout: 0, proxyTimeout: 0}}
    },
    build: {
      outDir: '../build',
      emptyOutDir: true
    },
    test: {
      globals: true,  // This enables test, describe, it, expect globally
      environment: 'happy-dom',
      setupFiles: './src/setupTests.js'
    }
  }
})

