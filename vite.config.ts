import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // idus 웹사이트 프록시 (CORS 우회)
        '/idus-proxy': {
          target: 'https://www.idus.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/idus-proxy/, ''),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9',
          },
        },
        // idus API 프록시
        '/idus-api': {
          target: 'https://api.idus.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/idus-api/, ''),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9',
            'Origin': 'https://www.idus.com',
            'Referer': 'https://www.idus.com/',
          },
        },
        // Vercel API 프록시 (로컬 개발 시)
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['framer-motion', 'lucide-react'],
            store: ['zustand'],
          }
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@components': path.resolve(__dirname, 'components'),
        '@services': path.resolve(__dirname, 'services'),
        '@store': path.resolve(__dirname, 'store'),
      }
    },
    css: {
      postcss: './postcss.config.js'
    }
  };
});
