import {
  AnalyzeExpenseCommandOutput,
  TextractClient,
  TextractClientResolvedConfig,
} from '@aws-sdk/client-textract';
import { describe, expect, it, vi } from 'vitest';
import { RemoteBillProcessingService } from './RemoteBillProcessingService.ts';

describe('Test RemoteBillProcessingService', () => {
  it('processes image', async () => {
    // Arrange
    const result: AnalyzeExpenseCommandOutput = {
      $metadata: {},
    };

    const textractClient: TextractClient = {
      send: vi.fn().mockResolvedValue(result),
      config: {} as TextractClientResolvedConfig,
      destroy: vi.fn(),
      middlewareStack: {} as TextractClient['middlewareStack'],
    };

    // Ignoring this be the textract send method's return value is based on its
    // input, which is not reachable here.
    // @ts-ignore
    const bucketName = 'SOME_BUCKET';
    const imageName = 'IMAGE_PATH';

    const remoteBillProcessService = new RemoteBillProcessingService({
      bucketName,
      textractClient,
    });

    // Act
    void remoteBillProcessService.process({ imageName });

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
  });
});
