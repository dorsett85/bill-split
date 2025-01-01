import { BillProcessingService } from '../types/billProcessingService';
import {
  AnalyzeExpenseCommand,
  TextractClient,
} from '@aws-sdk/client-textract';
import { BillProcessingEventValue } from '../types/billProcessingEventValue.ts';

export class RemoteBillProcessingService implements BillProcessingService {
  private readonly textractClient = new TextractClient();

  async process({ image_path }: BillProcessingEventValue) {
    const command = new AnalyzeExpenseCommand({
      Document: {
        S3Object: {
          Bucket: 'bill-split-images',
          Name: image_path,
        },
      },
    });
    const result = this.textractClient.send(command);

    // TODO Save result to db
    console.log(result);
  }
}
