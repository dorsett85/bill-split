import { createRsbuild, loadConfig, logger } from '@rsbuild/core';
import path from 'path';
import { App } from './App.ts';
import {
  deleteParticipant,
  getBill,
  getBillPage,
  getHomePage,
  getParticipants,
  patchBill,
  patchLineItem,
  postBill,
  postLineItem,
  postParticipant,
} from './controllers/controllers.ts';
import { HtmlService } from './services/HtmlService.ts';
import { startDevelopmentConsumer } from './services/KafkaService.ts';
import { LocalStaticFileService } from './services/LocalStaticFileService.ts';
import type { MiddlewareFunction } from './types/serverRequest.ts';
import { writeToHtml } from './utils/responseHelpers.ts';
import { staticMiddleware } from './utils/staticMiddleware.ts';

const startServer = async () => {
  const { content } = await loadConfig({});
  const app = new App();
  const staticPath = content.environments?.web.output?.distPath?.root ?? 'dist';
  const staticServerPath =
    content.environments?.node.output?.distPath?.root ?? 'dist/server';

  const staticFileService = new LocalStaticFileService({
    path: staticPath,
    ssrModulePath: staticServerPath,
  });

  // declare variables that will be assigned based on the environment
  let envMiddleware: MiddlewareFunction;
  let htmlService: HtmlService;
  let handleEnvListen = () => undefined;
  let port: number;

  if (process.env.NODE_ENV === 'development') {
    // Init Rsbuild
    const rsbuild = await createRsbuild({
      rsbuildConfig: content,
    });

    // Create Rsbuild DevServer instance
    const rsbuildServer = await rsbuild.createDevServer();

    htmlService = new HtmlService({
      loadSSRModule: ({ route }) =>
        rsbuildServer.environments.node.loadBundle(route),
      staticFileService,
    });

    port = rsbuildServer.port;
    envMiddleware = rsbuildServer.middlewares;
    handleEnvListen = () => {
      rsbuildServer.afterListen();
    };

    rsbuildServer.connectWebSocket({ server: app.server });
  } else {
    htmlService = new HtmlService({
      loadSSRModule: ({ ssrJs }) => {
        const renderModule = path.join(process.cwd(), staticServerPath, ssrJs);
        return import(renderModule);
      },
      staticFileService,
    });

    port = 3001;
    envMiddleware = staticMiddleware(staticPath);
  }

  app.use(envMiddleware);

  // Html routes
  app.get('/', getHomePage({ htmlService }));
  app.get('/bills/:id', getBillPage({ htmlService }));

  // Api routes
  app.post('/api/bills', postBill);
  app.patch('/api/bills/:id', patchBill);
  app.get('/api/bills/:id', getBill);

  app.patch('/api/lineitem/:id', patchLineItem);
  app.post('/api/lineitem', postLineItem);

  app.get('/api/participants', getParticipants);
  app.post('/api/participants', postParticipant);
  app.delete('/api/participants/:id', deleteParticipant);

  app.listen(port, () => {
    handleEnvListen();

    logger.start(`Server started at http://localhost:${port}`);
  });

  app.onRequestError((_, res, err) => {
    logger.error(err);
    res.statusCode = 500;
    // Based on the request context we could send back different response types.
    // For instance if they requested html we could send back a html error page,
    // or a json object if the request was for json data.
    return writeToHtml(
      'We experienced an unexpected issue, please try again later',
      res,
    );
  });
};

void startServer();
