import { describe, it, vi, expect } from 'vitest';
import { handleKafkaRecords } from './index.ts';
import { type SelfManagedKafkaRecord } from 'aws-lambda';
import { BillProcessingService } from './types/billProcessingService.ts';

const kafkaRecordFactory = (): SelfManagedKafkaRecord => {
  return {
    topic: 'test-topic',
    partition: 1,
    offset: 1,
    timestamp: 12345,
    timestampType: 'CREATE_TIME',
    key: '',
    value: JSON.stringify({
      image_path: '/app/dist/uploads/b49061fe31cb6e57521ce4a01.png',
    }),
    headers: [],
  };
};

describe('Test handleKafkaRecord', () => {
  it('successfully processes a record', async () => {
    const record = kafkaRecordFactory();
    const mockProcess = vi.fn();
    const billProcessingService: BillProcessingService = {
      process: mockProcess,
    };
    await handleKafkaRecords([record], billProcessingService);

    expect(mockProcess).toHaveBeenCalledOnce();
    expect(mockProcess).toHaveBeenCalledWith(JSON.parse(record.value));
    expect(mockProcess).toHaveReturnedWith(undefined);
  });
});
