import { type StaticAssets } from './staticAssets.ts';

export interface StaticFileService {
  /**
   * Get all the static resources required to render a page
   */
  getPageResources(url: string): Promise<{
    static: StaticAssets;
    server: { js: string };
    resolvedKey: string;
  } | null>;
}
