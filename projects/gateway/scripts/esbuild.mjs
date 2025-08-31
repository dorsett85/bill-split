import path from 'path';
import * as esbuild from 'esbuild';
import fs from 'fs/promises';
import { getClientEntryPoints } from './scriptUtils.mjs';

const watchMode = process.argv.some((arg) => arg === '--watch');

/**
 * This plugin creates a custom manifest of our static assets. It will:
 *   1) Map assets that need to be available for each page
 *   2) Map dynamic web paths to our system paths, e.g.:
 *     '/bills/:id/index.js' --> '/bills/[id]/index.js'
 */
const staticFileManifestPlugin = {
  name: 'staticFileManifest',
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length > 0) return;

      const staticFileManifest = { assetsByPage: {}, assetMapping: {} };

      const { outdir } = build.initialOptions;
      const publicDir = path.resolve(import.meta.dirname, '..', 'public');
      const staticDir = path.resolve(import.meta.dirname, '..', outdir);
      const staticPrefix = '/static';

      // Add public files to the manifest and copy them to the output folder
      for (const file of await fs.readdir(publicDir)) {
        const urlPath = path.join(staticPrefix, file);
        staticFileManifest.assetsByPage['/'] ??= [];
        staticFileManifest.assetsByPage['/'].push(urlPath);
        staticFileManifest.assetMapping[urlPath] = urlPath;
      }
      await fs.cp(publicDir, staticDir, {
        recursive: true,
      });

      // Add build files to the manifest
      for (const fileName of Object.keys(result.metafile.outputs)) {
        const { dir, base } = path.parse(fileName.replace(outdir, ''));
        const dynamicWebDir = dir.replace(/\[(\w+)]/g, ':$1');
        const staticSystemPath = path.join(staticPrefix, dir, base);
        const staticWebPath = path.join(staticPrefix, dynamicWebDir, base);

        staticFileManifest.assetsByPage[dynamicWebDir] ??= [];
        staticFileManifest.assetsByPage[dynamicWebDir].push(staticWebPath);
        staticFileManifest.assetMapping[staticWebPath] = staticSystemPath;
      }

      await fs.writeFile(
        path.join(staticDir, 'staticFileManifest.json'),
        JSON.stringify(staticFileManifest),
      );
    });
  },
};

const clientEntryPath = 'src/client/pages';

const sharedConfig = {
  assetNames: '[name]',
  bundle: true,
  loader: {
    '.png': 'file',
  },
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
};

const clientCtx = await esbuild.context({
  ...sharedConfig,
  entryPoints: await getClientEntryPoints(clientEntryPath, 'hydrate.tsx'),
  entryNames: '[dir]/entry-[hash]',
  format: 'esm',
  outdir: 'dist/static',
  plugins: [staticFileManifestPlugin],
  splitting: true,
  metafile: true,
});

const serverCtx = await esbuild.context({
  ...sharedConfig,
  entryPoints: ['src/server/server.tsx'],
  outdir: 'dist',
  platform: 'node',
  target: 'node22',
});

void clientCtx.watch();
void serverCtx.watch();
if (!watchMode) {
  void clientCtx.dispose();
  void serverCtx.dispose();
}
