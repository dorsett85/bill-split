import fs from 'fs/promises';
import { StaticFileService } from './staticFileService.ts';

interface StaticFileServiceConstructorArgs {
  /**
   * Absolute path where static assets are located
   */
  staticDir: string;
}

export class LocalStaticFileService implements StaticFileService {
  private readonly staticDir: StaticFileServiceConstructorArgs['staticDir'];
  /**
   * Map with a filename key and hashed filename value
   */
  private readonly hashedFileNameMap: Record<string, string> = {};
  /**
   * Set of available hashed file paths for our static assets
   */
  private readonly hashedStaticPathSet = new Set<string>();
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
  async populateHashFileNameCache(dirPath = '') {
    const fullPath = `${this.staticDir}/${dirPath}`;
    for (const path of await fs.readdir(fullPath)) {
      const cachePath = (dirPath && `${dirPath}/`) + path;

      if (cachePath.endsWith('.js') || cachePath.endsWith('.css')) {
        // Remove the public prefix and the hyphen and hash
        const unHashedFile = cachePath.replace(/-\w+(\.[a-zA-Z]+)$/, '$1');

        this.hashedFileNameMap[unHashedFile] = cachePath;
        // Add a / to the prefix because the request url will have it
        this.hashedStaticPathSet.add('/' + cachePath);
        continue;
      }
      try {
        await this.populateHashFileNameCache(cachePath);
      } catch (e) {
        // no-op, not a dir
      }
    }
  }

  /**
   * Get the hashed filename from an unhashed filename
   */
  public getHashFileName(path: string): string {
    return this.hashedFileNameMap[path];
  }

  public hasAsset(path: string): boolean {
    return this.hashedStaticPathSet.has(path);
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
