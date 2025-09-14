import type { ServerResponse } from 'node:http';
import http from 'http';
import type {
  MiddlewareFunction,
  ServerRequest,
} from './types/serverRequest.ts';
import { resolveRoute } from './utils/resolveRoute.ts';
import { resolveRouteParams } from './utils/resolveRouteParams.ts';
import { writeToHtml } from './utils/responseHelpers.ts';

export class App {
  public readonly server = http.createServer();
  private middlewares: {
    handle: MiddlewareFunction;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    route?: string;
  }[] = [];
  /**
   * Handles errors originating during a request only, not other server errors
   * like EADDRINUSE if the server can't start.
   */
  private handleRequestError:
    | ((req: ServerRequest, res: ServerResponse, err: unknown) => void)
    | undefined = undefined;

  public constructor() {
    //
  }

  public use(middleware: MiddlewareFunction): App {
    this.middlewares.push({ handle: middleware });
    return this;
  }

  public get(route: string, middleware: MiddlewareFunction): App {
    this.middlewares.push({ handle: middleware, route, method: 'GET' });
    return this;
  }

  public patch(route: string, middleware: MiddlewareFunction): App {
    this.middlewares.push({ handle: middleware, route, method: 'PATCH' });
    return this;
  }

  public post(route: string, middleware: MiddlewareFunction): App {
    this.middlewares.push({ handle: middleware, route, method: 'POST' });
    return this;
  }

  public delete(route: string, middleware: MiddlewareFunction): App {
    this.middlewares.push({ handle: middleware, route, method: 'DELETE' });
    return this;
  }

  private onRequest() {
    this.server.on('request', async (req, res) => {
      if (!req.url) {
        res.statusCode = 400;
        return writeToHtml('You need to specify a url in your request', res);
      }

      const route = resolveRoute(
        req.url,
        this.middlewares
          .map((middleware) => middleware.route)
          .filter((url) => url !== undefined),
      );

      const serverRequest: ServerRequest = Object.assign(req, {
        params: resolveRouteParams(req.url, route ?? ''),
        queryParams: Object.fromEntries(new URLSearchParams(req.url)),
        route: route ?? req.url.split('?')[0],
        url: req.url,
      });

      // Run all the middleware starting at the beginning
      const dispatch = async (middlewareIndex: number) => {
        const middleware = this.middlewares[middlewareIndex];

        // Check if there's no more middleware to run
        if (!middleware) {
          res.statusCode = 404;
          return writeToHtml(
            'We were unable to find the resource you requested',
            res,
          );
        }

        // Create the next function that will call the next middleware
        const next = () => {
          dispatch(middlewareIndex + 1);
        };

        // If route and method are defined for the middleware then make sure
        // they match the request.
        if (
          (middleware.route && middleware.route !== serverRequest.route) ||
          (middleware.method && middleware.method !== serverRequest.method)
        ) {
          return next();
        }

        try {
          await middleware.handle(serverRequest, res, next);
        } catch (err) {
          // TODO maybe add a fallback handler in case one is not defined
          this.handleRequestError?.(serverRequest, res, err);
        }
      };
      await dispatch(0);
    });
  }

  public onRequestError(
    onRequestError: (
      req: ServerRequest,
      res: ServerResponse,
      err: unknown,
    ) => void,
  ) {
    this.handleRequestError = onRequestError;
  }

  public listen(port: number | string, onListen: () => void) {
    this.onRequest();
    return this.server.listen(port, onListen);
  }
}
