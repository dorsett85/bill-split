import { createRequire } from 'node:module';
import { createRsbuild, loadConfig, logger } from '@rsbuild/core';
import path from 'path';
import { App } from './App.ts';
import { LocalStaticFileService } from './services/LocalStaticFileService.ts';
import { type RenderHtmlModule } from './types/serverRequest.ts';
import { htmlMiddleware } from './utils/htmlMiddleware.ts';
import { writeToHtml } from './utils/responseHelpers.ts';
import { staticMiddleware } from './utils/staticMiddleware.ts';

const startServer = async () => {
  const app = new App();

  const staticFileService = new LocalStaticFileService({
    path: 'dist',
  });

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
        renderHtml: async (url) => {
          const resources = await staticFileService.getPageResources(url);
          if (!resources) {
            return null;
          }

          const { render }: RenderHtmlModule =
            await rsbuildServer.environments.node.loadBundle(
              resources.resolvedKey,
            );
          return render({ staticAssets: resources.static });
        },
      }),
    );

    app.listen(rsbuildServer.port, () => {
      // Notify Rsbuild that the custom server has started
      rsbuildServer.afterListen();

      logger.start(`Server started at http://localhost:${rsbuildServer.port}`);
    });

    rsbuildServer.connectWebSocket({ server: app.server });
  } else {
    const require = createRequire(import.meta.url);

    // TODO only add this when testing prod build locally, we'll hopefully have
    //  our static files on a cdn.
    app.use(staticMiddleware('dist'));
    app.use(
      htmlMiddleware({
        renderHtml: async (url) => {
          const resources = await staticFileService.getPageResources(url);
          if (!resources) {
            return null;
          }

          const remotesPath = path.join(
            process.cwd(),
            'dist/server',
            resources.server.js,
          );
          const { render }: RenderHtmlModule = require(remotesPath);
          return render({ staticAssets: resources.static });
        },
      }),
    );

    const port = 3001;

    app.listen(port, () => {
      logger.start(`Server started at http://localhost:${port}`);
    });
  }

  app.onRequestError((_, res, err) => {
    logger.error(err);
    res.statusCode = 500;
    // based on the context request we could send back different response
    // types. For instance if they requested html we could send back a html
    // error page, or a json object if the request was for json data.
    return writeToHtml(
      'We experienced an unexpected issue, please try again later',
      res,
    );
  });
};

void startServer();
