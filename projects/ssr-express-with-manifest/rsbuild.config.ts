import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import fs from 'fs/promises';

/**
 * Recursively looks through directories starting with the baseEntryPath and
 * returns a record of entry points (relative to the baseEntryPath) that match
 * the target file name.
 */
export const getClientEntryPoints = async (
  baseEntryPath: string,
  target: string,
): Promise<Record<string, string>> => {
  const entryPoints: Record<string, string> = {};

  const findIndexFiles = async (dir: string) => {
    for (const path of await fs.readdir(dir)) {
      const newPath = `${dir}/${path}`;
      if (path === target) {
        const strippedPath = newPath
          .replace(new RegExp(`^${baseEntryPath}\/`), '')
          .replace(/^(.*index).*$/, '$1');
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
  environments: {
    web: {
      source: {
        entry: await getClientEntryPoints('./src/pages', 'index.client.tsx'),
      },
      output: {
        manifest: true,
      },
    },
    node: {
      output: {
        module: true,
        target: 'node' as const,
        distPath: {
          root: 'dist/server',
        },
      },
      source: {
        entry: {
          index: './src/pages/index.server',
        },
      },
    },
  },
  tools: {
    htmlPlugin: false,
  },
}));
