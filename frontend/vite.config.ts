import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_URL = (process.env.VITE_API_URL || 'http://localhost:8000/api') as string;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(API_URL),
  },
});

