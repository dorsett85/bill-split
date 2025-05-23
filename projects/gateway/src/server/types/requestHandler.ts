import { IncomingMessage, ServerResponse } from 'node:http';
import { BillService } from '../services/BillService.ts';
import { StaticFileService } from './staticFileService.ts';

/**
 * We'll make this easy and assume we know the url is a string
 */
export interface ServerRequest extends Omit<IncomingMessage, 'url'> {
  /**
   * Url of the request
   */
  url: string;
  /**
   * A url pattern for dynamic matching with the request url (e.g., /book/:id)
   */
  urlPattern: string;
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
