import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = process.env.VITE_API_URL || env.VITE_API_URL;

  if (!apiUrl) {
    throw new Error('Extension build failed: VITE_API_URL environment variable is required.');
  }

  let apiOrigin;
  try {
    const parsedUrl = new URL(apiUrl);
    if (!parsedUrl.protocol.startsWith('http')) {
      throw new Error('URL protocol must be http: or https:');
    }
    apiOrigin = parsedUrl.origin;
  } catch (err) {
    throw new Error(`Extension build failed: VITE_API_URL "${apiUrl}" is not a valid URL (${err.message}).`);
  }

  return {
    base: './',
    publicDir: false,
    plugins: [
      react(),
      {
        name: 'strip-external-css-resources',
        transform(code, id) {
          if (id.endsWith('.css')) {
            return {
              code: code.replace(/@import\s+url\(['"][^'"]+['"]\);?/g, ''),
              map: null,
            };
          }
        },
      },
      {
        name: 'chrome-extension-manifest-and-assets',
        generateBundle() {
          const manifestPath = path.resolve(__dirname, 'extension/manifest.json');
          let manifestContent = fs.readFileSync(manifestPath, 'utf-8');
          manifestContent = manifestContent.replace('__API_ORIGIN__', apiOrigin);
          this.emitFile({
            type: 'asset',
            fileName: 'manifest.json',
            source: manifestContent,
          });

          const iconsDir = path.resolve(__dirname, 'extension/icons');
          if (fs.existsSync(iconsDir)) {
            const icons = fs.readdirSync(iconsDir);
            for (const icon of icons) {
              const iconPath = path.join(iconsDir, icon);
              this.emitFile({
                type: 'asset',
                fileName: `icons/${icon}`,
                source: fs.readFileSync(iconPath),
              });
            }
          }
        },
        closeBundle() {
          const iconsSrc = path.resolve(__dirname, 'extension/icons');
          const iconsDest = path.resolve(__dirname, 'dist-extension/icons');
          if (fs.existsSync(iconsSrc)) {
            fs.mkdirSync(iconsDest, { recursive: true });
            fs.cpSync(iconsSrc, iconsDest, { recursive: true });
          }
        },
      },
    ],
    build: {
      outDir: 'dist-extension',
      emptyOutDir: true,
      rolldownOptions: {
        input: {
          sidepanel: path.resolve(__dirname, 'sidepanel.html'),
          background: path.resolve(__dirname, 'src/extension/background.js'),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  };
});
