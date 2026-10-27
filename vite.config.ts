import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Permite abrir la vista previa alojada (p. ej. túneles *.e2b.app) además de localhost.
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
  },
});
