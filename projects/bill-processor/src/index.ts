import { SelfManagedKafkaHandler, SelfManagedKafkaRecord } from 'aws-lambda';
import { RemoteBillProcessingService } from './services/RemoteBillProcessingService.ts';
import { BillProcessingService } from './types/billProcessingService.ts';

const billProcessingService: BillProcessingService =
  new RemoteBillProcessingService();

/**
 * Our AWS Lambda function responsible for processing an uploaded bill receipt
 */
export const handler: SelfManagedKafkaHandler = async (event) => {
  await handleKafkaRecords(event.records['bill'], billProcessingService);
};

export const handleKafkaRecords = async (
  records: SelfManagedKafkaRecord[],
  billProcessingService: BillProcessingService,
): Promise<void> => {
  console.log('HANDLING RECORDS:');

  const promises = records.map(async (record) => {
    const payload = JSON.parse(record.value);
    console.log('processing event with payload:', payload);
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
