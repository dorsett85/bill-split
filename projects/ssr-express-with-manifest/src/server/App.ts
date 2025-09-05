import { ServerResponse } from 'node:http';
import http from 'http';
import type {
  MiddlewareFunction,
  ServerRequest,
} from './types/serverRequest.ts';
import { writeToHtml } from './utils/responseHelpers.ts';

export class App {
  public readonly server = http.createServer();
  private middlewares: MiddlewareFunction[] = [];
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

  public use(middleware: MiddlewareFunction) {
    this.middlewares.push(middleware);
  }

  private onRequest() {
    this.server.on('request', (req, res) => {
      if (!req.url) {
        res.statusCode = 400;
        return writeToHtml('You need to specify a url in your request', res);
      }

      const serverRequest: ServerRequest = Object.assign(req, {
        url: req.url,
      });

      // Run all the middleware starting at the beginning
      const dispatch = (middlewareIndex: number) => {
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

        try {
          middleware(serverRequest, res, next);
        } catch (err) {
          // TODO maybe add a fallback handler in case one is not defined
          this.handleRequestError?.(serverRequest, res, err);
        }
      };
      dispatch(0);
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
