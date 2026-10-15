import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH lo fija la GitHub Action (/nombre-del-repo/); en local y en Docker es "/".
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },
  },
  preview: {
    host: true,
    port: 4173,
  },
});
