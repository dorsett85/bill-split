import { createRsbuild, loadConfig, logger } from '@rsbuild/core';
import path from 'path';
import { App } from './App.ts';
import {
  deleteBillParticipant,
  deleteLineItemParticipant,
  getAdminPage,
  getBill,
  getBillPage,
  getBillParticipants,
  getHomePage,
  patchBill,
  patchLineItem,
  patchParticipant,
  postAdminPage,
  postBill,
  postBillParticipant,
  postLineItem,
  postLineItemParticipant,
  postVerifyAccess,
} from './controllers/controllers.ts';
import { HtmlService } from './services/HtmlService.ts';
import { LocalStaticFileService } from './services/LocalStaticFileService.ts';
import type { MiddlewareFunction } from './types/serverRequest.ts';
import { billApiAccessMiddleware } from './utils/billApiAccessMiddleware.ts';
import { writeToHtml } from './utils/responseHelpers.ts';
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

    port = process.env.GATEWAY_PORT ?? 3002;
    envMiddleware = staticMiddleware(staticPath);
  }

  app.use(envMiddleware);

  // Admin routes
  app.get('/admin', getAdminPage({ htmlService }));
  app.post('/admin', postAdminPage({ htmlService }));

  // Html routes
  app.get('/', getHomePage({ htmlService }));
  app.get('/bills/:id', getBillPage({ htmlService }));

  // Api routes
  app.post('/api/verify-access', postVerifyAccess);

  const billApiPath = '/api/bills';
  app.post(billApiPath, postBill);
  app.patch(`${billApiPath}/:billId`, billApiAccessMiddleware(patchBill));
  app.get(`${billApiPath}/:billId`, billApiAccessMiddleware(getBill));

  app.get(
    `${billApiPath}/:billId/participants`,
    billApiAccessMiddleware(getBillParticipants),
  );
  app.post(
    `${billApiPath}/:billId/participants`,
    billApiAccessMiddleware(postBillParticipant),
  );
  app.delete(
    `${billApiPath}/:billId/participants/:id`,
    billApiAccessMiddleware(deleteBillParticipant),
  );
  app.patch(`${billApiPath}/:billId/participants/:id`, patchParticipant);

  app.patch(
    `${billApiPath}/:billId/line-items/:id`,
    billApiAccessMiddleware(patchLineItem),
  );
  app.post(
    `${billApiPath}/:billId/line-items`,
    billApiAccessMiddleware(postLineItem),
  );

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
