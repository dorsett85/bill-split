import concurrently from 'concurrently';
import fs from 'fs/promises';

const OUT_DIR = 'dist';
const STATIC_OUT_DIR = OUT_DIR + '/static';

// Clear the old dist folder before starting the app. We also make a new scratch
// build server file in case the node server tries to start before the build is
// done.
try {
  await fs.access(OUT_DIR);
  await fs.rm(OUT_DIR, { recursive: true });
} catch (_e) {
  // directory doesn't exist, no-op
}
await fs.mkdir(OUT_DIR);
await fs.mkdir(STATIC_OUT_DIR);
await fs.writeFile(OUT_DIR + '/server.js', '');

// Move public assets to the static output folder
await fs.cp('public', STATIC_OUT_DIR, {
  recursive: true,
});

// Start app in full watch mode.
concurrently(
  [
    'pnpm type-check --watch',
    'pnpm build --watch',
    'node --enable-source-maps --watch dist/server.js',
  ],
  {
    prefix: 'command',
    prefixLength: 30,
  },
);
