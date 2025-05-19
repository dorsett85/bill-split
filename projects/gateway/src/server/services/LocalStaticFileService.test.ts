import fs from 'fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStaticFileService } from './LocalStaticFileService.ts';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('test LocalStaticFileService', () => {
  it('gets a static file', async () => {
    // Arrange
    const expectedString = 'static file contents';
    const readFileSpy = vi
      .spyOn(fs, 'readFile')
      .mockResolvedValue(Buffer.from(expectedString));
    const staticFileService = new LocalStaticFileService({
      hostPath: 'host',
      staticPath: 'static',
    });

    // Act
    const buffer = await staticFileService.getAsset('/static-asset.jpg');

    // Assert
    expect(buffer.toString()).toBe(expectedString);
    expect(readFileSpy).toHaveBeenCalledOnce();
    expect(readFileSpy).toHaveBeenCalledWith('host/static-asset.jpg');
  });

  it('creates a new instance without paths', () => {
    const staticFileService = new LocalStaticFileService({
      hostPath: 'host',
      staticPath: 'static',
    });
    expect(staticFileService.has('static/asset.js')).toBe(false);
  });
});
