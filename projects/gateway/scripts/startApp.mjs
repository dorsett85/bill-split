import concurrently from 'concurrently';

// Start app in full watch mode.
concurrently(
  [
    // make a new scratch build server file in case the node
    // server tries to start before the build is done
    'rm -rf dist && mkdir dist && touch dist/server.js',
    'pnpm type-check --watch',
    'pnpm server:build --watch',
    'pnpm client:build --watch',
    'node --enable-source-maps --watch dist/server.js',
  ],
  {
    prefix: 'command',
    prefixLength: 30,
  },
);
