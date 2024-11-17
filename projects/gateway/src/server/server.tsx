import http from 'http';
import { LocalStaticFileService } from './services/LocalStaticFileService.ts';
import { RequestService } from './services/RequestService.ts';
import { LocalFileStorageService } from './services/LocalFileStorageService.ts';

const startServer = async () => {
  // Initialize static file service
  const staticFileService = new LocalStaticFileService({
    staticPath: `${__dirname}/static`,
  });
  await staticFileService.populateFilenameCache();

  // Initialize file storage service
  const fileStorageService = new LocalFileStorageService({
    storagePath: `${__dirname}/uploads`,
  });

  // Initialize request service
  const requestService = new RequestService({
    fileStorageService,
    staticFileService,
  });
  requestService.createRoutes();

  const app = http.createServer(requestService.handleRequest);

  app.listen(8080, () => {
    console.log('Server running on http://localhost:8080');
  });
};

void startServer();
