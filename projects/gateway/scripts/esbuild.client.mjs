import * as esbuild from 'esbuild';
import path from 'path';

await esbuild.build({
  entryPoints: [path.resolve(import.meta.dirname, '../src/client/index.tsx')],
  bundle: true,
  minify: true,
  sourcemap: true,
  outfile: 'dist/main.js',
});
