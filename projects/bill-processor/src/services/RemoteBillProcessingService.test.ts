import type {
  AnalyzeExpenseCommandOutput,
  TextractClient,
  TextractClientResolvedConfig,
} from '@aws-sdk/client-textract';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoteBillProcessingService } from './RemoteBillProcessingService.ts';
import * as utilsMod from './RemoteBillProcessingService.utils.ts';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Test RemoteBillProcessingService', () => {
  it('processes image', async () => {
    // Arrange
    const updateBillMock = vi
      .spyOn(utilsMod, 'updateBill')
      .mockResolvedValue(1);
    const createBillItemsMock = vi
      .spyOn(utilsMod, 'createBillItems')
      .mockResolvedValue(1);

    const result: AnalyzeExpenseCommandOutput = {
      $metadata: {},
    };

    const textractClient: TextractClient = {
      send: vi.fn().mockResolvedValue(result),
      config: {} as TextractClientResolvedConfig,
      destroy: vi.fn(),
      middlewareStack: {} as TextractClient['middlewareStack'],
    };

    const bucketName = 'SOME_BUCKET';
    const imageName = 'IMAGE_PATH';
    const billId = 12435;

    const remoteBillProcessService = new RemoteBillProcessingService({
      bucketName,
      textractClient,
    });

    // Act
    await remoteBillProcessService.process({ billId, imageName });

    // Assert
    expect(textractClient.send).toHaveBeenCalledOnce();
    expect(textractClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Document: expect.objectContaining({
            S3Object: {
              Bucket: bucketName,
              Name: imageName,
            },
          }),
        }),
      }),
    );
    expect(updateBillMock).toHaveBeenCalledOnce();
    expect(updateBillMock).toHaveBeenCalledWith(12435, {
      business_location: undefined,
      business_name: undefined,
      gratuity: undefined,
      tax: undefined,
    });
    expect(createBillItemsMock).toHaveBeenCalledOnce();
    expect(createBillItemsMock).toHaveBeenCalledWith(12435, []);
  });
});
