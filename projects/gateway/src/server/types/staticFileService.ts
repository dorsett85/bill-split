export interface StaticFileService {
  /**
   * Get a static asset
   */
  getAsset(path: string): Promise<Buffer>;
  /**
   * Get all static asset filenames for a give page
   */
  getPageAssetFilenames(path: string): string[];
  /**
   * Check if the request has a static asset
   */
  has(url: string): boolean;
}
