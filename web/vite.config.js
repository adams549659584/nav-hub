import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 避免 lightningcss 默认 targets 过窄，把标准 backdrop-filter 压掉只剩 -webkit-
  css: {
    lightningcss: {
      targets: {
        chrome: 111 << 16,
        firefox: 128 << 16,
        safari: 16 << 16,
        edge: 111 << 16,
      },
    },
  },
  build: {
    // 与上面 targets 对齐，minify 时保留标准 backdrop-filter
    cssMinify: 'lightningcss',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})