import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: mode === 'development' ? {
      '/api': 'http://localhost:5000'
    } : undefined
  }
}));
