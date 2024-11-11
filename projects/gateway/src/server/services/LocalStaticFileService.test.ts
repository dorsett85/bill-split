import { describe, expect, it } from 'vitest';
import { LocalStaticFileService } from './LocalStaticFileService.ts';

describe('test LocalStaticFileService', () => {
  it('creates a new instance without paths', () => {
    const staticFileService = new LocalStaticFileService({
      staticDir: 'static',
    });
    expect(staticFileService.getStaticPaths().length).toBe(0);
  });
});
