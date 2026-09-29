import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env': {},
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id))
              return 'vendor-react';
            if (/[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/.test(id))
              return 'vendor-router';
            if (/[\\/]node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id))
              return 'vendor-motion';
            if (/[\\/]node_modules[\\/](sweetalert2)[\\/]/.test(id)) return 'vendor-swal';
            if (/[\\/]node_modules[\\/](lucide-react)[\\/]/.test(id)) return 'vendor-icons';
            if (/[\\/]node_modules[\\/](recharts|d3-|victory-|decimal.js)[\\/]/.test(id))
              return 'vendor-charts';
            if (/[\\/]node_modules[\\/](date-fns)[\\/]/.test(id)) return 'vendor-date';
          },
        },
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        }
      },
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
