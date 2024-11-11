import { IncomingMessage, ServerResponse } from 'node:http';
import { StaticFileService } from './staticFileService.ts';

/**
 * Any request information we need to fulfill a request
 */
export interface ServerRequest extends Pick<IncomingMessage, 'method'> {
  /**
   * Url of the request
   */
  url: string;
}

/**
 * Added context for each request (e.g., different services, user, etc)
 */
export interface RequestContext {
  staticFileService: StaticFileService;
}

/**
 * Our standard request handler function the includes added request context
 */
export type RequestHandler = (
  req: ServerRequest,
  res: ServerResponse,
  context: RequestContext,
) => ServerResponse | Promise<ServerResponse>;
