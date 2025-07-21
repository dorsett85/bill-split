import {
  AnalyzeExpenseCommand,
  TextractClient,
} from '@aws-sdk/client-textract';
import { type BillProcessingEventValue } from '../types/billProcessingEventValue.ts';
import { BillProcessingService } from '../types/billProcessingService';
import { ProcessedExpense } from '../types/processedExpense.ts';
import {
  createBillItems,
  transformTextractToProcessedBill,
  updateBill,
} from './RemoteBillProcessingService.utils.ts';

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
  async process({ billId, imageName }: BillProcessingEventValue) {
    const command = new AnalyzeExpenseCommand({
      Document: {
        S3Object: {
          Bucket: this.bucketName,
          Name: imageName,
        },
      },
    });

    const processedExpense: ProcessedExpense = transformTextractToProcessedBill(
      await this.textractClient.send(command),
    );

    await updateBill(billId, {
      business_location: processedExpense.business_location,
      business_name: processedExpense.business_name,
      tax: processedExpense.tax,
      gratuity: processedExpense.gratuity,
    });
    await createBillItems(billId, processedExpense.items);
  }
}
