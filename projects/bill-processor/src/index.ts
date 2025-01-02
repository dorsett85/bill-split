import { SelfManagedKafkaHandler } from 'aws-lambda';
import { RemoteBillProcessingService } from './services/RemoteBillProcessingService.ts';
import { BillProcessingService } from './types/billProcessingService.ts';
import { TextractClient } from '@aws-sdk/client-textract';

const billProcessingService: BillProcessingService =
  new RemoteBillProcessingService({
    bucketName: process.env.AWS_BILL_IMAGE_S3_BUCKET ?? '',
    textractClient: new TextractClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
      region: process.env.AWS_REGION ?? '',
    }),
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

    void billProcessingService.process(payload);
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
