import fs from 'fs/promises';
import path from 'path';
import type { MiddlewareFunction } from '../types/serverRequest.ts';
import { writeToText } from './responseHelpers.ts';

/**
 * Middleware to get a static asset. We won't need this in production since our
 * resources should be on a cdn.
 */
export const staticMiddleware =
  (staticPath: string): MiddlewareFunction =>
  async (req, res, next) => {
    // check for static assets (only do this testing prod build locally)
    try {
      const content = await fs.readFile(path.join(staticPath, req.url));
      writeToText(content, req.url, res);
    } catch {
      // Not a static file we have, move on
      next();
    }
  };
