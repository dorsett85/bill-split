import fs from 'fs/promises';

/**
 * Recursively looks through directories starting with the baseEntryPath and
 * returns a list of full paths (relative to the baseEntryPath) that match the
 * target file name.
 *
 * @returns {Promise<string[]>} list of entry points
 */
export const getClientEntryPoints = async (baseEntryPath, target) => {
  const entryPoints = [];

  const findIndexFiles = async (dir) => {
    for (const path of await fs.readdir(dir)) {
      const newPath = `${dir}/${path}`;
      if (path === target) {
        entryPoints.push(newPath);
        continue;
      }
      try {
        await findIndexFiles(newPath);
      } catch (_e) {
        // no-op, not a dir
      }
    }
  };
  await findIndexFiles(baseEntryPath);
  return entryPoints;
};
