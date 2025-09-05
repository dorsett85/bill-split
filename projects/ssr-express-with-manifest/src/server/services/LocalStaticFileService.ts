import { type ManifestData } from '@rsbuild/core';
import fs from 'fs/promises';
import path from 'path';
import { type StaticAssets } from '../types/staticAssets.ts';
import { type StaticFileService } from '../types/staticFileService.ts';
import { resolveRoute } from '../utils/resolveRoute.ts';

interface StaticFileServiceConstructorInput {
  /**
   * Path to our static assets
   */
  path: string;
}

export class LocalStaticFileService implements StaticFileService {
  private readonly path: string;

  public constructor({ path }: StaticFileServiceConstructorInput) {
    this.path = path;
  }

  /**
   * Get the build manifest that contains our static assets
   */
  private async getManifest(): Promise<{
    static: ManifestData;
    server: ManifestData;
  }> {
    const [staticManifest, serverManifest] = await Promise.all([
      fs.readFile(path.join(this.path, 'manifest.json'), 'utf-8'),
      fs.readFile(path.join(this.path, 'server', 'manifest.json'), 'utf-8'),
    ]);

    // TODO we should cache these in production
    return {
      static: JSON.parse(staticManifest),
      server: JSON.parse(serverManifest),
    };
  }

  /**
   * Get all resources required to render a html page. This also returns a
   * resolved route key which is used internally as a key to get static assets.
   * For instance if the url is /bill/1, the resolved key will be /bill/:id
   *
   * If there's no resource for the passed in url then we return null.
   */
  public async getPageResources(url: string): Promise<{
    static: StaticAssets;
    server: { js: string };
    resolvedKey: string;
  } | null> {
    const manifest = await this.getManifest();
    const resolvedKey = resolveRoute(url, Object.keys(manifest.static.entries));

    if (!resolvedKey) {
      return null;
    }

    const serverAssets = manifest.server.entries[resolvedKey].initial?.js ?? [];
    const { initial } = manifest.static.entries[resolvedKey];

    return {
      resolvedKey,
      server: { js: serverAssets[0] },
      static: {
        css: initial?.css ?? [],
        js: initial?.js ?? [],
      },
    };
  }
}
