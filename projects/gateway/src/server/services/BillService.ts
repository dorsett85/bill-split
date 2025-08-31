import path from 'path';
import { Bill, BillModel } from '../models/BillModel.ts';
import { FileStorageService } from '../types/fileStorageService.ts';
import { ServerRequest } from '../types/requestHandler.ts';
import { KafkaService } from './KafkaService.ts';
import { S3FileStorageService } from './S3FileStorageService.ts';

interface BillServiceConstructor {
  billModel: BillModel;
  fileStorageService: FileStorageService;
  kafkaService: KafkaService;
}

export class BillService {
  private billModel: BillModel;
  private fileStorageService: FileStorageService;
  private kafkaService: KafkaService;

  constructor({
    billModel,
    fileStorageService,
    kafkaService,
  }: BillServiceConstructor) {
    this.billModel = billModel;
    this.fileStorageService = fileStorageService;
    this.kafkaService = kafkaService;
  }

  public async read(id: string): Promise<Bill> {
    const { rows } = await this.billModel.read(id);
    const bill = rows[0];

    // Get a presigned image URL so the FE can fetch the image from a private
    // repo.
    if (this.fileStorageService instanceof S3FileStorageService) {
      bill.image_path = await this.fileStorageService.getPresignedUrl(
        bill.image_path,
      );
    }

    return bill;
  }

  /**
   * This method is a little unusual. Normally we wouldn't use the request
   * object at this layer, but it's required for our file storage service. So
   * we're both storing the bills image here and creating a new bills record in
   * our db.
   */
  public async create(req: ServerRequest): Promise<Bill> {
    const storedFiles = await this.fileStorageService.store(req);
    const result = await this.billModel.create({
      image_path: storedFiles[0].path,
      image_status: 'parsing',
    });

    await this.kafkaService.publish(
      process.env.KAFKA_BILL_PROCESSING_TOPIC ?? '',
      {
        billId: result.rows[0].id,
        imageName: path.basename(storedFiles[0].path),
      },
    );

    return result.rows[0];
  }
}
