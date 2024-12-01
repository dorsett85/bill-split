import fs from 'fs/promises';
import { StaticFileService } from '../types/staticFileService.ts';
import path from 'path';

interface StaticFileServiceConstructorInput {
  /**
   * Absolute path to the server hosting our static assets
   */
  hostPath: string;
  /**
   * relative path where static assets are located
   */
  staticPath: string;
}

export class LocalStaticFileService implements StaticFileService {
  private readonly hostPath: string;
  private readonly staticPath: string;
  /**
   * Map with a page url as key (e.g., `/` is the homepage) and an array of
   * static assets for that page.
   */
  private readonly assetsByPage: Record<string, string[]> = {};
  /**
   * All file paths for our static assets
   */
  private readonly staticPaths: Set<string> = new Set();

  public constructor({
    hostPath,
    staticPath,
  }: StaticFileServiceConstructorInput) {
    this.hostPath = hostPath;
    this.staticPath = staticPath;
  }

  /**
   * Prepopulate a list of static file paths for each page. This allows us to 1)
   * serve static assets with the hash name that the bundler creates, instead of
   * looking it up during the request, and 2) have a way of easily looking up
   * that a request is for a static asset.
   *
   * @param pagePath directories to search within the static directory that are
   *                 based on our app page paths
   */
  async populateFilenameCache(pagePath = '/') {
    const fullPath = path.join(this.hostPath, this.staticPath, pagePath);
    for (const filePath of await fs.readdir(fullPath)) {
      const nextPagePath = path.join(pagePath, filePath);

      const isDirectory = (
        await fs.lstat(path.join(fullPath, filePath))
      ).isDirectory();

      if (!isDirectory) {
        const cachePath = path.join('/', this.staticPath, nextPagePath);
        this.assetsByPage[pagePath] ??= [];
        this.assetsByPage[pagePath].push(cachePath);

        this.staticPaths.add(cachePath);
        continue;
      }

      // At this point the cachePath is either a directory or not something we
      // want to cache.
      try {
        await this.populateFilenameCache(nextPagePath);
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

  public async getContent(relativePath: string): Promise<Buffer> {
    return await fs.readFile(path.join(this.hostPath, relativePath));
  }

  /**
   * Expose static paths as a copy
   */
  public getStaticPaths(): Set<string> {
    return new Set(this.staticPaths);
  }
}
