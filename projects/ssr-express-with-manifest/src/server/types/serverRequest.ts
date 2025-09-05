import { type IncomingMessage, type ServerResponse } from 'node:http';
import { type StaticAssets } from './staticAssets.ts';

/**
 * We'll make this easy and assume we know the url is a string
 */
export interface ServerRequest extends Omit<IncomingMessage, 'url'> {
  /**
   * Url of the request
   */
  url: string;
  // /**
  //  * A url pattern for dynamic matching with the request url (e.g., /book/:id)
  //  */
  // urlPattern: string;
}

export type NextFunction = () => void;

export type MiddlewareFunction = (
  req: ServerRequest,
  res: ServerResponse,
  next: NextFunction,
) => Promise<unknown> | unknown;

type RenderHtmlInput = {
  staticAssets: StaticAssets;
  data?: unknown;
};

export type RenderHtmlModule = {
  render: (input: RenderHtmlInput) => string;
};
