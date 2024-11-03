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
  /**
   * Map with a hashed filename key and file content value
   */
  private readonly filenameContentMap: Record<string, Buffer> = {};

  public constructor({ staticDir }: StaticFileServiceConstructorArgs) {
    this.staticDir = staticDir;
  }

  /**
   * As our bundler will create hashed static file names, we can prepopulate
   * a map of them when the server starts up so we don't have to waste time
   * finding them on each request.
   *
   * @param dirPath directories to search within the static directory
   */
  async populateHashFilenameCache(dirPath = '') {
    const fullPath = `${this.staticDir}/${dirPath}`;
    for (const filePath of await fs.readdir(fullPath)) {
      const cachePath = (dirPath && `${dirPath}/`) + filePath;

      const isDirectory = (
        await fs.lstat(fullPath + '/' + filePath)
      ).isDirectory();

      if (!isDirectory) {
        const pageKey = dirPath.startsWith('/') ? dirPath : '/' + dirPath;
        this.assetsByPage[pageKey] ??= [];
        this.assetsByPage[pageKey].push(cachePath);

        // Add a / to the prefix because the request url will have it
        this.staticPathSet.add('/' + cachePath);
        continue;
      }

      // At this point the cachePath is either a directory or not something we
      // want to cache.
      try {
        await this.populateHashFilenameCache(cachePath);
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
    if (!this.filenameContentMap[path]) {
      const fullPath = this.appendStaticDir(path);
      this.filenameContentMap[path] = await fs.readFile(fullPath);
    }
    return this.filenameContentMap[path];
  }

  /**
   * Helper function to append a path onto the absolute static dir
   */
  private appendStaticDir(path: string): string {
    return `${this.staticDir}/${path}`;
  }
}
