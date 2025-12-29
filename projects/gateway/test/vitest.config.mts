import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./test/vitest-setup.ts'],
          exclude: [
            ...configDefaults.exclude,
            // The dao modules require db setup that we'll test separately
            './src/server/dao/**/*.test.ts',
          ],
        },
      },
      {
        test: {
          name: 'db',
          include: ['./src/server/dao/**/*.test.ts'],
          globalSetup: ['./test/vitest-db-global-setup.ts'],
          setupFiles: ['./test/vitest-db-suite-setup.ts'],
          pool: 'threads',
        },
      },
    ],
  },
});

// testing ci change
