import * as esbuild from 'esbuild';
import { getClientEntryPoints } from './scriptUtils.mjs';

const watchMode = process.argv.some((arg) => arg === '--watch');

const baseEntryPath = 'src/client/pages/';

const sharedConfig = {
  assetNames: '[name]',
  bundle: true,
  loader: {
    '.png': 'file',
  },
  minify: process.env.NODE_ENV === 'production',
};

const clientCtx = await esbuild.context({
  ...sharedConfig,
  entryPoints: await getClientEntryPoints(baseEntryPath, 'hydrate.tsx'),
  entryNames: '[dir]/index-[hash]',
  format: 'esm',
  outbase: baseEntryPath,
  outdir: 'dist/static',
  sourcemap: true,
  splitting: true,
});

const serverCtx = await esbuild.context({
  ...sharedConfig,
  entryPoints: ['src/server/server.tsx'],
  outdir: 'dist',
  platform: 'node',
  sourcemap: true,
  target: 'node20',
});

clientCtx.watch();
serverCtx.watch();
if (!watchMode) {
  clientCtx.dispose();
  serverCtx.dispose();
}
