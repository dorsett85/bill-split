import { logger } from '@rsbuild/core';
import path from 'path';
import type { MiddlewareFunction } from '../types/serverRequest.ts';

/**
 * Request logging functionality. Eventually could accept different options for
 * what to log.
 */
export const loggingMiddleware: MiddlewareFunction = (req, _, next) => {
  // Log a request if it doesn't have a file extension
  if (!path.extname(req.url)) {
    logger.info(`${req.method} ${req.url}`);
  }

  return next();
};
