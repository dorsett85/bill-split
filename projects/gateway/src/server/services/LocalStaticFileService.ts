import path from 'path';
import fs from 'fs/promises';
import { type StaticFileService } from '../types/staticFileService.ts';

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
   * Map with a page url as key (e.g., `/` is the homepage) and a value of a
   * list of static assets for that page.
   */
  private assetsByPage: Record<string, string[]> = {};
  /**
   * Maps dynamic static file web path to our system file path, e.g.:
   * '/bills/:id'/index.js --> '/bills/[id]/index.js'
   */
  private staticPathMap: Record<string, string> = {};

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
   */
  async populateFilenameCache(): Promise<void> {
    const buffer = await fs.readFile(
      path.join(this.hostPath, this.staticPath, 'staticFileManifest.json'),
    );
    const staticFileManifest: {
      assetsByPage: Record<string, string[]>;
      assetMapping: Record<string, string>;
    } = JSON.parse(buffer.toString());

    this.assetsByPage = staticFileManifest.assetsByPage;
    this.staticPathMap = staticFileManifest.assetMapping;
  }

  /**
   * Get all static asset filenames for a give page
   */
  public getPageAssetFilenames(pattern: string): string[] {
    return this.assetsByPage[pattern] ?? [];
  }

  /**
   * Get the actual file asset
   */
  public async getAsset(file: string): Promise<Buffer> {
    const mappedFile = this.staticPathMap[file];
    return await fs.readFile(path.join(this.hostPath, mappedFile));
  }

  /**
   * Check if the request has a static asset
   */
  public has(url: string): boolean {
    return !!this.staticPathMap[url];
  }
}
