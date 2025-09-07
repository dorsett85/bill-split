import type { ManifestData } from '@rsbuild/core';
import fs from 'fs/promises';
import path from 'path';
import type { StaticAssets } from '../types/staticAssets.ts';
import type { StaticFileService } from '../types/staticFileService.ts';

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
   * Get the build manifests that contains our static assets
   */
  private async getManifests(): Promise<{
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
   * Get all static assets for a page
   */
  public async getAssets(route: string): Promise<{
    static: StaticAssets;
    serverJs: string;
  }> {
    const manifest = await this.getManifests();

    const serverAssets = manifest.server.entries[route].initial?.js ?? [];
    const { initial } = manifest.static.entries[route];

    return {
      serverJs: serverAssets[0],
      static: {
        css: initial?.css ?? [],
        js: initial?.js ?? [],
      },
    };
  }
}
