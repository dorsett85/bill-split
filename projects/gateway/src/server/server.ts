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
  getVerifyAccess,
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
import { authMiddleware } from './utils/authMiddleware.ts';
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

  // VerifyAccess routes
  app.get('/admin', getAdminPage({ htmlService }));
  app.post('/admin', postAdminPage({ htmlService }));
  app.get('/verify-access', getVerifyAccess({ htmlService }));
  app.post('/verify-access', postVerifyAccess({ htmlService }));

  // Auth middleware goes before all other routes
  app.use(authMiddleware);

  // Html routes
  app.get('/', getHomePage({ htmlService }));
  app.get('/bills/:id', getBillPage({ htmlService }));

  // Api routes
  app.post('/api/bills', postBill);
  app.patch('/api/bills/:id', patchBill);
  app.get('/api/bills/:id', getBill);
  app.get('/api/bills/:billId/participants', getBillParticipants);
  app.post('/api/bills/:billId/participants', postBillParticipant);
  app.delete('/api/bills/:billId/participants/:id', deleteBillParticipant);

  app.patch('/api/line-items/:id', patchLineItem);
  app.post('/api/line-items', postLineItem);

  app.post('/api/line-item-participants', postLineItemParticipant);
  app.delete('/api/line-item-participants/:id', deleteLineItemParticipant);

  app.patch('/api/participants/:id', patchParticipant);

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
