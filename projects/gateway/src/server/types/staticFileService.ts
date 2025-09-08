import type { StaticAssets } from './staticAssets.ts';

export interface StaticFileService {
  /**
   * Get all the static resources required to render a page
   */
  getAssets(url: string): Promise<{
    static: StaticAssets;
    ssrJs: string;
  }>;
}
