import {
  AnalyzeExpenseCommand,
  TextractClient,
} from '@aws-sdk/client-textract';
import { type BillProcessingEventValue } from '../types/billProcessingEventValue.ts';
import { BillProcessingService } from '../types/billProcessingService';

interface RemoteBillProcessingConstructorInput {
  bucketName: string;
  textractClient: TextractClient;
}

export class RemoteBillProcessingService implements BillProcessingService {
  private readonly bucketName: string;
  private readonly textractClient: TextractClient;

  public constructor({
    bucketName,
    textractClient,
  }: RemoteBillProcessingConstructorInput) {
    this.bucketName = bucketName;
    this.textractClient = textractClient;
  }

  /**
   * Given an image path, this method will take an image through a full
   * processing cycle which includes:
   *   1. Expense analysis via textract
   *   2. Storing results in the db
   */
  async process({ imageName }: BillProcessingEventValue) {
    const command = new AnalyzeExpenseCommand({
      Document: {
        S3Object: {
          Bucket: this.bucketName,
          Name: imageName,
        },
      },
    });

    const result = await this.textractClient.send(command);

    // TODO Save result to db
    console.log(result);
  }
}
