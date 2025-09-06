import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ServerRequest extends Omit<IncomingMessage, 'url'> {
  /**
   * Url of the request
   */
  url: string;
  /**
   * A url pattern resolved from the request url that matches our available
   * routes (e.g., /book/:id)
   */
  route: string;
}

export type NextFunction = () => void;

export type MiddlewareFunction = (
  req: ServerRequest,
  res: ServerResponse,
  next: NextFunction,
) => Promise<unknown> | unknown;
