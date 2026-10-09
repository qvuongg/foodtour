import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {fileURLToPath} from 'node:url';
import { assertSafePublicEnvironment } from './src/lib/public-env';

export default defineConfig(({ mode }) => {
  const environment = {
    ...loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), ''),
    ...process.env,
  };
  assertSafePublicEnvironment(environment);

  return {
    plugins: [react(), {
      name: 'guard-public-environment',
      configResolved(config) {
        // Include the final resolved public env too (e.g. an explicit --root/envDir override).
        assertSafePublicEnvironment({
          ...environment,
          ...loadEnv(config.mode, config.envDir, ''),
          ...process.env,
          ...config.env,
        });
      },
    }],
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
    base: process.env.PUBLIC_BASE_PATH || '/',
    css: { postcss: { plugins: [tailwindcss()] } },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    define: { 'process.env.NEXT_PUBLIC_BASE_PATH': JSON.stringify((process.env.PUBLIC_BASE_PATH || '/').replace(/\/$/, '')) },
  };
});
