import { StaticFileService } from '../types/staticFileService.ts';
import { IncomingMessage, ServerResponse } from 'node:http';
import {
  RequestContext,
  RequestHandler,
  ServerRequest,
} from '../types/requestHandler.ts';
import { createStaticRoutes } from '../routes/static.ts';
import { routes } from '../routes/routes.tsx';

export class RequestService {
  private readonly routeHandlers: Record<string, RequestHandler> = {};
  private readonly staticFileService: StaticFileService;

  public constructor(staticFileService: StaticFileService) {
    this.staticFileService = staticFileService;
  }

  /**
   * Define each route path (key) and its corresponding handler (value) for the
   * entire server. We could probably just use a static object (e.g., routes),
   * but we need to dynamically create the static asset paths
   */
  public createRoutes(): void {
    const staticRoutes = createStaticRoutes(
      this.staticFileService.getStaticPaths(),
    );
    Object.assign(this.routeHandlers, staticRoutes, routes);
  }

  /**
   * Gatekeeper handler for all requests
   */
  public handleRequest = async (
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<ServerResponse> => {
    if (!req.url) {
      res.statusCode = 400;
      return res.end('You need to specify a url in your request');
    }

    const response = this.routeHandlers[req.url];

    if (!response) {
      // Fall through case
      res.statusCode = 404;
      return res.end('We were unable to find the resource you requested');
    }

    // TODO make a function to create server request
    const serverRequest: ServerRequest = {
      method: req.method,
      url: req.url,
    };

    // TODO make a function to create context
    const context: RequestContext = {
      staticFileService: this.staticFileService,
    };

    try {
      return response(serverRequest, res, context);
    } catch (e) {
      console.log(e);
      res.statusCode = 500;
      // based on the context request we could send back different response
      // types. For instance if they requested html we could send back a html
      // error page, or a json object if the request was for json data.
      return res.end(
        'We experienced an unexpected issue, please try again later',
      );
    }
  };
}
