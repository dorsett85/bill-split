import type { IncomingMessage, ServerResponse } from 'node:http';
import http from 'http';
import type {
  MiddlewareFunction,
  ServerRequest,
} from './types/serverRequest.ts';
import { resolveRoute } from './utils/resolveRoute.ts';
import { resolveRouteParams } from './utils/resolveRouteParams.ts';
import {
  jsonBadRequestResponse,
  jsonNotFoundResponse,
  writeToHtml,
} from './utils/responseHelpers.ts';

const reqAcceptsJson = (req: IncomingMessage) =>
  !!req.headers.accept?.includes('application/json');

export class App {
  public readonly server = http.createServer();
  private middlewares: {
    handles: MiddlewareFunction[];
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    route?: string;
  }[] = [];
  /**
   * Handles errors originating during a request only, not other server errors
   * like EADDRINUSE if the server can't start.
   */
  private handleRequestError: (
    req: ServerRequest,
    res: ServerResponse,
    err: Error,
  ) => ServerResponse = (_, res) =>
    res.end('We experienced an unexpected issue, please try again later');

  public constructor() {
    //
  }

  public use(middleware: MiddlewareFunction): App {
    this.middlewares.push({ handles: [middleware] });
    return this;
  }

  public get(route: string, ...middlewares: MiddlewareFunction[]): App {
    this.middlewares.push({ handles: middlewares, route, method: 'GET' });
    return this;
  }

  public patch(route: string, ...middlewares: MiddlewareFunction[]): App {
    this.middlewares.push({ handles: middlewares, route, method: 'PATCH' });
    return this;
  }

  public post(route: string, ...middlewares: MiddlewareFunction[]): App {
    this.middlewares.push({ handles: middlewares, route, method: 'POST' });
    return this;
  }

  public delete(route: string, ...middlewares: MiddlewareFunction[]): App {
    this.middlewares.push({ handles: middlewares, route, method: 'DELETE' });
    return this;
  }

  private onRequest() {
    this.server.on('request', async (req, res) => {
      if (!req.url) {
        res.statusCode = 400;
        const message = 'You need to specify a url in your request';
        return reqAcceptsJson(req)
          ? jsonBadRequestResponse(res, message)
          : writeToHtml(message, res);
      }

      const route = resolveRoute(
        req.url,
        this.middlewares
          .map((middleware) => middleware.route)
          .filter((url) => url !== undefined),
      );

      const [pathname, queryString] = req.url.split('?');

      const serverRequest: ServerRequest = Object.assign(req, {
        params: resolveRouteParams(pathname, route ?? ''),
        queryParams: Object.fromEntries<string | undefined>(
          new URLSearchParams(queryString),
        ),
        route: route ?? pathname,
        url: req.url,
      });

      // Run all the middleware starting at the beginning
      const dispatch = async (middlewareIndex: number) => {
        const middleware = this.middlewares[middlewareIndex];

        // Check if there's no more middleware to run
        if (!middleware) {
          res.statusCode = 404;
          const message = 'We were unable to find the resource you requested';
          return reqAcceptsJson(req)
            ? jsonNotFoundResponse(res, message)
            : writeToHtml(message, res);
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
          // Loop through all the inner route handlers
          const routeDispatch = (handlerIndex: number) => {
            const handler = middleware.handles[handlerIndex];
            if (!handler) {
              return next();
            }
            const routeNext = () => {
              routeDispatch(handlerIndex + 1);
            };
            return handler(serverRequest, res, routeNext);
          };
          await routeDispatch(0);
        } catch (err) {
          const caughtErr =
            err instanceof Error
              ? err
              : new Error(
                  'We experienced an unexpected issue, please try again later',
                );
          return this.handleRequestError(serverRequest, res, caughtErr);
        }
      };
      await dispatch(0);
    });
  }

  public onRequestError(
    onRequestError: (
      req: ServerRequest,
      res: ServerResponse,
      err: Error,
    ) => ServerResponse,
  ) {
    this.handleRequestError = onRequestError;
  }

  public listen(port: number | string, onListen: () => void) {
    this.onRequest();
    return this.server.listen(port, onListen);
  }
}
