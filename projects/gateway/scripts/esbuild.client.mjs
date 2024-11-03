import * as esbuild from 'esbuild';
import { getClientEntryPoints } from './scriptUtils.mjs';

const watchMode = process.argv.some((arg) => arg === '--watch');

const baseEntryPath = 'src/client/pages/';

const ctx = await esbuild.context({
  bundle: true,
  entryPoints: await getClientEntryPoints(baseEntryPath, 'hydrate.tsx'),
  entryNames: '[dir]/index-[hash]',
  format: 'esm',
  minify: process.env.NODE_ENV === 'production',
  outbase: baseEntryPath,
  outdir: 'dist/static',
  sourcemap: true,
  splitting: true,
});

await ctx.watch();
if (!watchMode) {
  await ctx.dispose();
}
