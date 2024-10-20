import * as esbuild from 'esbuild';
import { getClientEntryPoints } from './scriptUtils.mjs';

const watchMode = process.argv.some((arg) => arg === '--watch');

const baseEntryPath = 'src/client/pages/';

const ctx = await esbuild.context({
  entryPoints: await getClientEntryPoints(baseEntryPath, 'hydrate.tsx'),
  entryNames: '[dir]/index-[hash]',
  outbase: baseEntryPath,
  outdir: 'dist/static',
  bundle: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
});

await ctx.watch();
if (!watchMode) {
  await ctx.dispose();
}
