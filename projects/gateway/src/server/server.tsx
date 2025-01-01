import http from 'http';
import { LocalStaticFileService } from './services/LocalStaticFileService.ts';
import { RequestService } from './services/RequestService.ts';
import { S3FileStorageService } from './services/S3FileStorageService.ts';
import { startDevelopmentConsumer } from './services/KafkaService.ts';

const startServer = async () => {
  // Initialize static file service
  const staticFileService = new LocalStaticFileService({
    hostPath: __dirname,
    staticPath: 'static',
  });
  await staticFileService.populateFilenameCache();

  // Initialize file storage service
  const fileStorageService = new S3FileStorageService({
    bucketName: process.env.AWS_S3_BILL_SPLIT_BUCKET ?? '',
    accessKeyId: process.env.AWS_S3_BILL_SPLIT_ACCESS_KEY ?? '',
    secretAccessKey: process.env.AWS_S3_BILL_SPLIT_SECRET_ACCESS_KEY ?? '',
    region: process.env.AWS_REGION ?? '',
  });

  // Initialize request service
  const requestService = new RequestService({
    fileStorageService,
    staticFileService,
  });

  // Initialize a kafka consumer only when developing
  if (process.env.NODE_ENV !== 'production') {
    void startDevelopmentConsumer();
  }

  const app = http.createServer(requestService.handleRequest);

  app.listen(8080, () => {
    console.log('Server running on http://localhost:8080');
  });
};

void startServer();
