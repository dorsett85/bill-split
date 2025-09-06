import { createRequire } from 'node:module';
import { createRsbuild, loadConfig, logger } from '@rsbuild/core';
import path from 'path';
import { App } from './App.ts';
import type { LoadRenderModuleFunction } from './services/HtmlService.ts';
import { htmlMiddleware } from './utils/htmlMiddleware.ts';
import { writeToHtml } from './utils/responseHelpers.ts';
import { staticMiddleware } from './utils/staticMiddleware.ts';

const startServer = async () => {
  const app = new App();
  const assetPath = 'dist';

  if (process.env.NODE_ENV === 'development') {
    const { content } = await loadConfig({});

    // Init Rsbuild
    const rsbuild = await createRsbuild({
      rsbuildConfig: content,
    });

    // Create Rsbuild DevServer instance
    const rsbuildServer = await rsbuild.createDevServer();
    const getHtmlMiddleware = () => {
      const loadRenderModule: LoadRenderModuleFunction = ({ resolvedRoute }) =>
        rsbuildServer.environments.node.loadBundle(resolvedRoute);
      return htmlMiddleware({
        path: assetPath,
        loadRenderModule,
      });
    };

    app.use(rsbuildServer.middlewares);
    app.get('/', getHtmlMiddleware());
    app.get('/bill/:id', getHtmlMiddleware());

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
    const getHtmlMiddleware = () => {
      const loadRenderModule: LoadRenderModuleFunction = ({ serverJs }) => {
        const renderModule = path.join(process.cwd(), 'dist/server', serverJs);
        return require(renderModule);
      };
      return htmlMiddleware({
        path: assetPath,
        loadRenderModule,
      });
    };

    app.use(staticMiddleware(assetPath));
    app.get('/', getHtmlMiddleware());
    app.get('/bill/:id', getHtmlMiddleware());

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
