import {
  TextractClient,
  type TextractClientResolvedConfig,
} from '@aws-sdk/client-textract';
import type { SelfManagedKafkaHandler } from 'aws-lambda';
import { stubbedAnalyzeOutput } from './data/whole-foods-receipt.ts';
import { RemoteBillProcessingService } from './services/RemoteBillProcessingService.ts';
import type { BillProcessingService } from './types/billProcessingService.ts';

// Only make an actual textract client in production. It costs money per
// request!
const NODE_ENV =
  process.env.LOCAL_DEV === 'true' ? 'development' : process.env.NODE_ENV;

const textractClient: TextractClient =
  NODE_ENV === 'production'
    ? new TextractClient({
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY ?? '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
        },
      })
    : // This object is a stub for development
      {
        send: async () => stubbedAnalyzeOutput,
        config: {} as TextractClientResolvedConfig,
        destroy: () => undefined,
        middlewareStack: {} as TextractClient['middlewareStack'],
      };

const billProcessingService: BillProcessingService =
  new RemoteBillProcessingService({
    bucketName: process.env.AWS_BILL_IMAGE_S3_BUCKET ?? '',
    textractClient,
  });

/**
 * Our AWS Lambda function responsible for processing an uploaded bill receipt
 */
export const handler: SelfManagedKafkaHandler = async (event) => {
  // Collect a list of processing promises from the event payload. The
  // processing is IO intensive so handling them asynchronously if we have more
  // than one is crucial.
  const topic = process.env.KAFKA_BILL_PROCESSING_TOPIC ?? '';
  const promises = event.records[topic].map(async (record) => {
    const payload = JSON.parse(record.value);

    return billProcessingService.process(payload);
  });
  const results = await Promise.allSettled(promises);

  // Do something with the results
  results.forEach((result) => {
    console.log(`event was ${result.status}`);
    if ('fulfilled' !== result.status) {
      console.log(`Because ${result.reason}`);
    }
  });
};
