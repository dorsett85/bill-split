import http from 'http';
import { LocalStaticFileService } from './services/LocalStaticFileService.ts';
import { RequestService } from './services/RequestService.tsx';

const startServer = async () => {
  // Initialize static file service
  const staticFileService = new LocalStaticFileService({
    staticDir: `${__dirname}/static`,
  });
  await staticFileService.populateFilenameCache();

  // Initialize request service
  const requestService = new RequestService(staticFileService);
  requestService.createRoutes();

  const app = http.createServer(requestService.handleRequest);

  app.listen(8080, () => {
    console.log('Server running on http://localhost:8080');
  });
};

void startServer();
