export interface StaticFileService {
  /**
   * Get content of a static asset
   */
  getContent(path: string): Promise<Buffer>;
  /**
   * Check if a static asset is available
   */
  hasAsset(path: string): boolean;
}
