import { createRsbuild, loadConfig, logger } from '@rsbuild/core';
import path from 'path';
import { App } from './App.ts';
import { env, isProd } from './config.ts';
import {
  deleteAccessToken,
  deleteBillParticipant,
  deleteBillParticipantLineItem,
  getAccessTokens,
  getBill,
  patchAccessToken,
  patchBill,
  patchBillParticipant,
  postAccessToken,
  postBill,
  postBillCreateAccess,
  postBillParticipant,
  postBillParticipantLineItem,
  subscribeBillRecalculate,
} from './controllers/apiControllers.ts';
import {
  getAdminPage,
  getBillPage,
  getHomePage,
  postAdminPage,
} from './controllers/htmlControllers.ts';
import { HtmlService } from './services/HtmlService.ts';
import { LocalStaticFileService } from './services/LocalStaticFileService.ts';
import type { MiddlewareFunction } from './types/serverRequest.ts';
import { loggingMiddleware } from './utils/loggingMiddleware.ts';
import {
  jsonServerErrorResponse,
  writeToHtml,
} from './utils/responseHelpers.ts';
import { staticMiddleware } from './utils/staticMiddleware.ts';
import { withAdminAuthMiddleware } from './utils/withAdminAuthMiddleware.ts';
import { withBillAuthMiddleware } from './utils/withBillAuthMiddleware.ts';

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

  // Html routes
  app.get('/', getHomePage({ htmlService }));
  app.get('/admin', getAdminPage({ htmlService }));
  app.post('/admin', postAdminPage({ htmlService }));
  app.get('/bills/:id', getBillPage({ htmlService }));

  // Api routes
  const accessTokenApiPath = '/api/access-tokens';
  app.get(accessTokenApiPath, withAdminAuthMiddleware(getAccessTokens));
  app.post(accessTokenApiPath, withAdminAuthMiddleware(postAccessToken));
  app.patch(
    `${accessTokenApiPath}/:pin`,
    withAdminAuthMiddleware(patchAccessToken),
  );
  app.delete(
    `${accessTokenApiPath}/:pin`,
    withAdminAuthMiddleware(deleteAccessToken),
  );

  const billApiPath = '/api/bills';
  app.post(billApiPath, postBill);
  app.post(`${billApiPath}:create-access`, postBillCreateAccess);
  app.get(`${billApiPath}/:billId`, withBillAuthMiddleware(getBill));
  app.patch(`${billApiPath}/:billId`, withBillAuthMiddleware(patchBill));
  app.get(
    `${billApiPath}/:billId/recalculate/subscribe`,
    withBillAuthMiddleware(subscribeBillRecalculate),
  );

  app.post(
    `${billApiPath}/:billId/participants`,
    withBillAuthMiddleware(postBillParticipant),
  );
  app.patch(
    `${billApiPath}/:billId/participants/:participantId`,
    withBillAuthMiddleware(patchBillParticipant),
  );
  app.delete(
    `${billApiPath}/:billId/participants/:participantId`,
    withBillAuthMiddleware(deleteBillParticipant),
  );

  // NEW participant/line-items intent url
  app.post(
    `${billApiPath}/:billId/participants/:participantId/line-items/:lineItemId`,
    withBillAuthMiddleware(postBillParticipantLineItem),
  );
  app.delete(
    `${billApiPath}/:billId/participants/:participantId/line-items/:lineItemId`,
    withBillAuthMiddleware(deleteBillParticipantLineItem),
  );

  app.listen(port, () => {
    handleEnvListen();

    logger.start(`Server started at http://localhost:${port}`);
  });

  app.onRequestError((req, res, err) => {
    logger.error(err);
    res.statusCode = 500;

    // TODO check for errors that we've already handled and set those as the
    //  error message.
    const message =
      'We experienced an unexpected issue, please try again later';
    if (req.headers.accept === 'application/json') {
      return jsonServerErrorResponse(res, isProd() ? message : err.message);
    }
    return writeToHtml(isProd() ? message : (err.stack ?? err.message), res);
  });
};

void startServer();
