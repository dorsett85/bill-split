import fs from 'fs/promises';
import { StaticFileService } from './StaticFileService.ts';

interface StaticFileServiceConstructorArgs {
  /**
   * Absolute path where static assets are located
   */
  staticDir: string;
}

export class LocalStaticFileService implements StaticFileService {
  private readonly staticDir: StaticFileServiceConstructorArgs['staticDir'];
  /**
   * Map with a page url as key (e.g., `/` is the homepage) and an array of
   * static assets for that page.
   */
  private readonly assetsByPage: Record<string, string[]> = {};
  /**
   * Set of available file paths for our static assets
   */
  private readonly staticPathSet = new Set<string>();

  public constructor({ staticDir }: StaticFileServiceConstructorArgs) {
    this.staticDir = staticDir;
  }

  /**
   * Prepopulate a list of static file paths for each page. This allows us to 1)
   * serve static assets with the hash name that the bundler creates, instead of
   * looking it up during the request, and 2) have a way of easily looking up
   * that a request is for a static asset.
   *
   * @param dirPath directories to search within the static directory. This
   *                defaults to the initial base static directory.
   */
  async populateFilenameCache(dirPath = '/') {
    const fullPath = `${this.staticDir}${dirPath}`;
    for (const filePath of await fs.readdir(fullPath)) {
      // Make sure there's a `/` between the directory path and the filepath
      const cachePath = `${dirPath}${dirPath === '/' ? '' : '/'}${filePath}`;

      const isDirectory = (
        await fs.lstat(fullPath + '/' + filePath)
      ).isDirectory();

      if (!isDirectory) {
        this.assetsByPage[dirPath] ??= [];
        this.assetsByPage[dirPath].push(cachePath);

        this.staticPathSet.add(cachePath);
        continue;
      }

      // At this point the cachePath is either a directory or not something we
      // want to cache.
      try {
        await this.populateFilenameCache(cachePath);
      } catch (e) {
        // no-op, not a dir
      }
    }
  }

  /**
   * Get all static asset filenames for a give page
   */
  public getPageAssetFilenames(path: string): string[] {
    return this.assetsByPage[path] ?? [];
  }

  public hasAsset(path: string): boolean {
    return this.staticPathSet.has(path);
  }

  public async getContent(path: string): Promise<Buffer> {
    return await fs.readFile(this.appendStaticDir(path));
  }

  /**
   * Helper function to append a path onto the absolute static dir
   */
  private appendStaticDir(path: string): string {
    return `${this.staticDir}/${path}`;
  }
}
