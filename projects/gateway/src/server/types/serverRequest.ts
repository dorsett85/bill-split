import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ServerRequest extends Omit<IncomingMessage, 'url'> {
  /**
   * Any dynamic route values parsed from the url
   */
  params: Record<string, string>;
  /**
   * A url pattern resolved from the request url that matches our available
   * routes (e.g., /book/:id)
   */
  route: string;
  /**
   * Url of the request
   */
  url: string;
}

export type NextFunction = () => void;

export type MiddlewareFunction = (
  req: ServerRequest,
  res: ServerResponse,
  next: NextFunction,
) => Promise<unknown> | unknown;
