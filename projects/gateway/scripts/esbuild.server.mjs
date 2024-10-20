import * as esbuild from 'esbuild';

const watchMode = process.argv.some((arg) => arg === '--watch');

const ctx = await esbuild.context({
  bundle: true,
  entryPoints: ['src/server/server.tsx'],
  minify: process.env.NODE_ENV === 'production',
  outdir: 'dist',
  platform: 'node',
  sourcemap: true,
  target: 'node20',
});

await ctx.watch();
if (!watchMode) {
  await ctx.dispose();
}
