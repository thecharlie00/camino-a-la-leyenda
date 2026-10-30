import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('.', import.meta.url));

function copyLegacySiteFiles() {
  let outDir = resolve(root, 'dist');
  return {
    name: 'copy-legacy-site-files',
    apply: 'build' as const,
    configResolved(config: { root: string; build: { outDir: string } }) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      for (const directory of ['en', 'de', 'fr', 'it', 'goat-ladder', 'privacidad', 'fonts']) {
        cpSync(resolve(root, directory), resolve(outDir, directory), { recursive: true });
      }
      for (const file of ['404.html', 'CNAME', '.nojekyll', 'ads.txt', 'site.css', 'site.js', 'goat-ladder.js', 'trophies.js', 'pixel.js', 'manifest.webmanifest', 'sitemap.xml']) {
        copyFileSync(resolve(root, file), resolve(outDir, file));
      }
      const sourceImages = resolve(root, 'img');
      const targetImages = resolve(outDir, 'img');
      mkdirSync(targetImages, { recursive: true });
      for (const file of readdirSync(sourceImages).filter((name) => !existsSync(resolve(targetImages, name)))) {
        copyFileSync(resolve(sourceImages, file), resolve(targetImages, file));
      }
    },
  };
}

function serveBuiltGameInDev() {
  return {
    name: 'serve-self-contained-game-in-dev',
    configureServer(server: ViteDevServer) {
      const gameFile = resolve(root, 'dist/jugar/juego.html');
      server.middlewares.use((req, res, next) => {
        if ((req.url || '').split('?')[0] !== '/jugar/juego.html') return next();
        if (!existsSync(gameFile)) {
          res.statusCode = 503;
          res.end('Run npm run dev again to build the game runtime.');
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(readFileSync(gameFile, 'utf8'));
      });
    },
  };
}

// Build the existing public site and the two play pages. The game page is also
// the WebView entry point packaged into the Android App Bundle.
export default defineConfig({
  base: './',
  plugins: [react(), copyLegacySiteFiles(), serveBuiltGameInDev()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        play: resolve(root, 'jugar/index.html'),
      },
    },
  },
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
