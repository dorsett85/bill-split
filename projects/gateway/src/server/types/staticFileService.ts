export interface StaticFileService {
  /**
   * Get content of a static asset
   */
  getContent(path: string): Promise<Buffer>;
  /**
   * Get all static asset filenames for a give page
   */
  getPageAssetFilenames(path: string): string[];
  /**
   * Get a list of paths for all of our static assets
   */
  getStaticPaths(): string[];
}
