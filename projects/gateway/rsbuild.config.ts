import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import fs from 'fs/promises';

/**
 * Recursively looks through directories starting with the baseEntryPath and
 * returns a record of url entry points (relative to the baseEntryPath) that
 * match the target file name.
 */
export const getEntryPoints = async (
  baseEntryPath: string,
  target: string,
): Promise<Record<string, string>> => {
  const entryPoints: Record<string, string> = {};

  const findIndexFiles = async (dir: string) => {
    for (const path of await fs.readdir(dir)) {
      const newPath = `${dir}/${path}`;
      if (path === target) {
        const strippedPath = newPath
          // Get just the url path
          .replace(new RegExp(`^${baseEntryPath}(.*)index.*$`), '$1')
          // Remove trailing /
          .replace(/(.+)\/$/, '$1')
          // Replace bracket segments with colon, [id] --> :id
          .replace(/\[(\w+)]/g, ':$1');
        entryPoints[strippedPath] = newPath;
        continue;
      }
      try {
        await findIndexFiles(newPath);
      } catch {
        // no-op, not a dir
      }
    }
  };
  await findIndexFiles(baseEntryPath);
  return entryPoints;
};

export default defineConfig(async () => ({
  plugins: [pluginReact()],
  server: {
    port: 8080,
  },
  environments: {
    web: {
      source: {
        entry: await getEntryPoints('./src/client/pages', 'index.client.tsx'),
      },
      output: {
        filename: {
          js: 'chunk_[contenthash].js',
          css: 'chunk_[contenthash].css',
        },
        manifest: true,
        distPath: { root: 'dist' },
      },
    },
    node: {
      source: {
        entry: await getEntryPoints('./src/client/pages', 'index.server.tsx'),
      },
      output: {
        filename: {
          js: 'index_[contenthash].js',
        },
        manifest: true,
        module: true,
        target: 'node' as const,
        distPath: {
          root: 'dist/server',
        },
      },
    },
  },
  tools: {
    htmlPlugin: false,
  },
}));
