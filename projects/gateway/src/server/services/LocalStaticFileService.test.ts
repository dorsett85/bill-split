import type { ManifestData } from '@rsbuild/core';
import fs from 'fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStaticFileService } from './LocalStaticFileService.ts';

beforeEach(() => {
  vi.restoreAllMocks();
});

const stubServerManifest: ManifestData = {
  allFiles: [
    '/index_0c9017043a6cb1a8.js',
    '/index_d2eb40c92588d937.js',
    '/index_0c9017043a6cb1a8.js.map',
    '/index_d2eb40c92588d937.js.map',
  ],
  entries: {
    '/bills/:id': {
      assets: ['index_0c9017043a6cb1a8.js.map'],
      initial: {
        js: ['/index_0c9017043a6cb1a8.js'],
      },
    },
    '/': {
      assets: ['index_d2eb40c92588d937.js.map'],
      initial: {
        js: ['/index_d2eb40c92588d937.js'],
      },
    },
  },
  integrity: {},
};

const stubClientManifest: ManifestData = {
  allFiles: [
    '/static/js/chunk_33e071f143292d2a.js',
    '/static/js/chunk_0437b221017200e1.js',
    '/static/js/chunk_544515b3f82c8e2b.js',
    '/static/js/chunk_20b9cfb1f9f8bf8f.js',
    '/static/js/chunk_2a1c051ec4f4e0dc.js',
    '/static/js/chunk_c18044a7b9add364.js',
    '/static/js/chunk_33e071f143292d2a.js.map',
    '/static/js/chunk_0437b221017200e1.js.map',
    '/static/js/chunk_544515b3f82c8e2b.js.map',
    '/static/js/chunk_20b9cfb1f9f8bf8f.js.map',
    '/static/js/chunk_2a1c051ec4f4e0dc.js.map',
    '/static/js/chunk_c18044a7b9add364.js.map',
  ],
  entries: {
    '/bills/:id': {
      assets: [
        'static/js/chunk_2a1c051ec4f4e0dc.js.map',
        'static/js/chunk_20b9cfb1f9f8bf8f.js.map',
        'static/js/chunk_544515b3f82c8e2b.js.map',
        'static/js/chunk_33e071f143292d2a.js.map',
      ],
      initial: {
        js: [
          '/static/js/chunk_2a1c051ec4f4e0dc.js',
          '/static/js/chunk_20b9cfb1f9f8bf8f.js',
          '/static/js/chunk_544515b3f82c8e2b.js',
          '/static/js/chunk_33e071f143292d2a.js',
        ],
      },
    },
    '/': {
      assets: [
        'static/js/chunk_c18044a7b9add364.js.map',
        'static/js/chunk_20b9cfb1f9f8bf8f.js.map',
        'static/js/chunk_544515b3f82c8e2b.js.map',
        'static/js/chunk_0437b221017200e1.js.map',
      ],
      initial: {
        js: [
          '/static/js/chunk_c18044a7b9add364.js',
          '/static/js/chunk_20b9cfb1f9f8bf8f.js',
          '/static/js/chunk_544515b3f82c8e2b.js',
          '/static/js/chunk_0437b221017200e1.js',
        ],
      },
    },
  },
  integrity: {},
};

describe('test LocalStaticFileService', () => {
  it('get assets for a page', async () => {
    const staticFileService = new LocalStaticFileService({
      path: 'dist',
      ssrModulePath: 'dist/server',
    });

    const readFileSpy = vi
      .spyOn(fs, 'readFile')
      .mockImplementation(async (path) => {
        return Buffer.from(
          JSON.stringify(
            path === 'dist/manifest.json'
              ? stubClientManifest
              : stubServerManifest,
          ),
        );
      });

    const assets = await staticFileService.getAssets('/');

    expect(assets).toStrictEqual({
      ssrJs: '/index_d2eb40c92588d937.js',
      static: { css: [], js: stubClientManifest.entries['/'].initial?.js },
    });
    expect(readFileSpy).toHaveBeenCalledTimes(2);
    expect(readFileSpy).toHaveBeenCalledWith('dist/manifest.json', 'utf-8');
    expect(readFileSpy).toHaveBeenCalledWith(
      'dist/server/manifest.json',
      'utf-8',
    );
  });
});
