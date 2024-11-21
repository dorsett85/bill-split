import { IncomingMessage, ServerResponse } from 'node:http';
import { StaticFileService } from './staticFileService.ts';
import { BillService } from '../services/BillService.ts';

/**
 * We'll make love easy and assume we know the url is a string
 */
export interface ServerRequest extends Omit<IncomingMessage, 'url'> {
  /**
   * Url of the request
   */
  url: string;
}

/**
 * Added context for each request (e.g., different services, user, etc)
 */
export interface RequestContext {
  billService: BillService;
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
