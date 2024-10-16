import * as esbuild from 'esbuild';
import path from 'path';

await esbuild.build({
  entryPoints: [path.resolve(import.meta.dirname, '../src/server.tsx')],
  bundle: true,
  minify: true,
  outfile: 'dist/server.js',
  platform: 'node',
  sourcemap: true,
});
