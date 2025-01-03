import { describe, expect, it, vi } from 'vitest';
import { RemoteBillProcessingService } from './RemoteBillProcessingService.ts';
import {
  AnalyzeExpenseCommandOutput,
  TextractClient,
} from '@aws-sdk/client-textract';

describe('Test RemoteBillProcessingService', () => {
  it('processes image', async () => {
    // Arrange
    const textractClient = new TextractClient({ region: 'us-west-1' });
    const result: AnalyzeExpenseCommandOutput = {
      $metadata: {},
    };

    // Ignoring this be the textract send method's return value is based on its
    // input, which is not reachable here.
    // @ts-ignore
    const sendSpy = vi.spyOn(textractClient, 'send').mockResolvedValue(result);
    const bucketName = 'SOME_BUCKET';
    const imageName = 'IMAGE_PATH';

    const remoteBillProcessService = new RemoteBillProcessingService({
      bucketName,
      textractClient,
    });

    // Act
    void remoteBillProcessService.process({ imageName });

    // Assert
    expect(sendSpy).toHaveBeenCalledOnce();
    expect(sendSpy).toHaveBeenCalledWith(
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
