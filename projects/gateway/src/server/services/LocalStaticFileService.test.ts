import fs from 'fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStaticFileService } from './LocalStaticFileService.ts';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('test LocalStaticFileService', () => {
  it('creates a new instance without paths', () => {
    const staticFileService = new LocalStaticFileService({
      hostPath: 'host',
      staticPath: 'static',
    });
    expect(staticFileService.has('static/asset.js')).toBe(false);
  });

  it('gets assets by page', async () => {
    // Arrange
    const url = '/';
    const staticAsset = 'static-asset.jpg';
    const staticFileManifest = { assetsByPage: { [url]: [staticAsset] } };
    const readFileSpy = vi
      .spyOn(fs, 'readFile')
      .mockResolvedValueOnce(Buffer.from(JSON.stringify(staticFileManifest)));
    const staticFileService = new LocalStaticFileService({
      hostPath: 'host',
      staticPath: 'static',
    });
    await staticFileService.populateFilenameCache();

    // Act
    const assetsByPage = staticFileService.getPageAssetFilenames(url);

    // Assert
    expect(assetsByPage).toStrictEqual([staticAsset]);
    expect(readFileSpy).toHaveBeenCalledTimes(1);
    expect(readFileSpy).toHaveBeenCalledWith(
      'host/static/staticFileManifest.json',
    );
  });

  it('gets a static file', async () => {
    // Arrange
    const staticAsset = 'static-asset.jpg';
    const staticFileManifest = { assetMapping: { [staticAsset]: staticAsset } };
    const expectedString = 'static file contents';
    const readFileSpy = vi
      .spyOn(fs, 'readFile')
      .mockResolvedValueOnce(Buffer.from(JSON.stringify(staticFileManifest)))
      .mockResolvedValueOnce(Buffer.from(expectedString));
    const staticFileService = new LocalStaticFileService({
      hostPath: 'host',
      staticPath: 'static',
    });
    await staticFileService.populateFilenameCache();

    // Act
    const buffer = await staticFileService.getAsset(staticAsset);

    // Assert
    expect(buffer.toString()).toBe(expectedString);
    expect(readFileSpy).toHaveBeenCalledTimes(2);
    expect(readFileSpy).toHaveBeenCalledWith(
      'host/static/staticFileManifest.json',
    );
    expect(readFileSpy).toHaveBeenCalledWith('host/static-asset.jpg');
  });
});
