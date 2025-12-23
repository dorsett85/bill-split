import { createRsbuild, loadConfig, logger } from '@rsbuild/core';
import path from 'path';
import { App } from './App.ts';
import { env } from './config.ts';
import {
  deleteBillParticipant,
  deleteLineItemParticipant,
  getAccessTokens,
  getAdminPage,
  getBill,
  getBillPage,
  getBillParticipants,
  getHomePage,
  patchBill,
  patchLineItem,
  patchParticipant,
  postAccessToken,
  postAdminPage,
  postBill,
  postBillCreateAccess,
  postBillParticipant,
  postLineItem,
  postLineItemParticipant,
} from './controllers/controllers.ts';
import { HtmlService } from './services/HtmlService.ts';
import { LocalStaticFileService } from './services/LocalStaticFileService.ts';
import type { MiddlewareFunction } from './types/serverRequest.ts';
import { loggingMiddleware } from './utils/loggingMiddleware.ts';
import {
  jsonServerErrorResponse,
  writeToHtml,
} from './utils/responseHelpers.ts';
import { staticMiddleware } from './utils/staticMiddleware.ts';

const startServer = async () => {
  const { content } = await loadConfig({});
  const app = new App();
  const staticPath = ((distPath) => {
    if (distPath && typeof distPath !== 'string' && distPath.root) {
      return distPath.root;
    }
    return 'dist';
  })(content.environments?.web.output?.distPath);
  const staticServerPath = ((distPath) => {
    if (distPath && typeof distPath !== 'string' && distPath.root) {
      return distPath.root;
    }
    return 'dist/server';
  })(content.environments?.node.output?.distPath);

  const staticFileService = new LocalStaticFileService({
    path: staticPath,
    ssrModulePath: staticServerPath,
  });

  // declare variables that will be assigned based on the environment
  let envMiddleware: MiddlewareFunction;
  let htmlService: HtmlService;
  let handleEnvListen = () => undefined;
  let port: number | string;

  if (env.NODE_ENV === 'development') {
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

    port = env.GATEWAY_PORT;
    envMiddleware = staticMiddleware(staticPath);
  }

  app.use(envMiddleware);
  app.use(loggingMiddleware);

  // Admin routes
  app.get('/admin', getAdminPage({ htmlService }));
  app.post('/admin', postAdminPage({ htmlService }));

  // Html routes
  app.get('/', getHomePage({ htmlService }));
  app.get('/bills/:id', getBillPage({ htmlService }));

  // Api routes
  app.get('/api/access-tokens', getAccessTokens);
  app.post('/api/access-tokens', postAccessToken);
  app.post('/api/bills/create-access', postBillCreateAccess);

  const billApiPath = '/api/bills';
  app.post(billApiPath, postBill);
  app.patch(`${billApiPath}/:billId`, patchBill);
  app.get(`${billApiPath}/:billId`, getBill);

  app.get(`${billApiPath}/:billId/participants`, getBillParticipants);
  app.post(`${billApiPath}/:billId/participants`, postBillParticipant);
  app.delete(`${billApiPath}/:billId/participants/:id`, deleteBillParticipant);
  app.patch(`${billApiPath}/:billId/participants/:id`, patchParticipant);

  app.patch(`${billApiPath}/:billId/line-items/:id`, patchLineItem);
  app.post(`${billApiPath}/:billId/line-items`, postLineItem);

  app.post(
    `${billApiPath}/:billId/line-item-participants`,
    postLineItemParticipant,
  );
  app.delete(
    `${billApiPath}/:billId/line-item-participants/:id`,
    deleteLineItemParticipant,
  );

  app.listen(port, () => {
    handleEnvListen();

    logger.start(`Server started at http://localhost:${port}`);
  });

  app.onRequestError((req, res, err) => {
    logger.error(err);
    res.statusCode = 500;

    let message = 'We experienced an unexpected issue, please try again later';
    if (env.NODE_ENV !== 'production') {
      message = err.stack ?? err.message;
    }

    return req.headers.accept === 'application/json'
      ? jsonServerErrorResponse(res, message)
      : writeToHtml(message, res);
  });
};

void startServer();
