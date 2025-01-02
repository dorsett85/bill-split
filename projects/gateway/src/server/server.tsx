import http from 'http';
import { LocalStaticFileService } from './services/LocalStaticFileService.ts';
import { RequestService } from './services/RequestService.ts';
import { S3FileStorageService } from './services/S3FileStorageService.ts';
import { startDevelopmentConsumer } from './services/KafkaService.ts';
import { S3Client } from '@aws-sdk/client-s3';

const startServer = async () => {
  // Initialize static file service
  const staticFileService = new LocalStaticFileService({
    hostPath: __dirname,
    staticPath: 'static',
  });
  await staticFileService.populateFilenameCache();

  // Initialize file storage service
  const fileStorageService = new S3FileStorageService({
    bucketName: process.env.AWS_BILL_IMAGE_S3_BUCKET ?? '',
    s3Client: new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
      region: process.env.AWS_REGION ?? '',
    }),
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
