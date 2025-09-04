import { createRequire } from 'node:module';
import { createRsbuild, loadConfig, logger } from '@rsbuild/core';
import fs from 'fs/promises';
import http from 'http';
import path from 'path';
import type {
  MiddlewareFunction,
  ServerRequest,
} from './types/serverRequest.ts';
import { htmlMiddleware } from './utils/htmlMiddleware.ts';
import { writeToText } from './utils/responseHelpers.ts';

class App {
  public readonly server = http.createServer();
  private middlewares: MiddlewareFunction[] = [];

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
        return res.end('You need to specify a url in your request');
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
          return res.end('We were unable to find the resource you requested');
        }

        // Create the next function that will call the next middleware
        const next = () => {
          dispatch(middlewareIndex + 1);
        };

        middleware(serverRequest, res, next);
      };
      dispatch(0);
    });
  }

  public listen(port: number | string, onListen: () => void) {
    this.onRequest();
    return this.server.listen(port, onListen);
  }
}

const startServer = async () => {
  const app = new App();

  if (process.env.NODE_ENV === 'development') {
    const { content } = await loadConfig({});

    // Init Rsbuild
    const rsbuild = await createRsbuild({
      rsbuildConfig: content,
    });

    // Create Rsbuild DevServer instance
    const rsbuildServer = await rsbuild.createDevServer();

    app.use(rsbuildServer.middlewares);
    app.use(
      htmlMiddleware({
        loadManifest: async () =>
          JSON.parse(await fs.readFile('./dist/manifest.json', 'utf-8')),
        loadRenderModule: () => {
          return rsbuildServer.environments.node.loadBundle('index');
        },
      }),
    );

    app.listen(rsbuildServer.port, () => {
      // Notify Rsbuild that the custom server has started
      rsbuildServer.afterListen();

      console.log(`Server started at http://localhost:${rsbuildServer.port}`);
    });

    rsbuildServer.connectWebSocket({ server: app.server });
  } else {
    const require = createRequire(import.meta.url);

    const port = process.env.PORT || 3007;

    // TODO only add this when testing prod build locally
    app.use(async (req, res, next) => {
      // check for static assets (only do this testing prod build locally)
      try {
        const content = await fs.readFile(path.join('./dist', req.url));
        writeToText(content, req.url, res);
      } catch {
        // Not a static file we have, move on
        next();
      }
    });
    app.use(
      htmlMiddleware({
        loadManifest: async () =>
          JSON.parse(await fs.readFile('./dist/manifest.json', 'utf-8')),
        loadRenderModule: () => {
          const remotesPath = path.join(
            process.cwd(),
            `./dist/server/index.js`,
          );
          return require(remotesPath);
        },
      }),
    );

    app.listen(port, () => {
      console.log(`Server started at http://localhost:${port}`);
    });
  }
};

void startServer();
