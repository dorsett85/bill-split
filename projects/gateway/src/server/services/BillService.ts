import path from 'path';
import { BillDao } from '../dao/BillDao.ts';
import { BillCreate, BillRead } from '../dto/bill.ts';
import { IdRecord } from '../dto/id.ts';
import { FileStorageService } from '../types/fileStorageService.ts';
import { ServerRequest } from '../types/requestHandler.ts';
import { KafkaService } from './KafkaService.ts';
import { S3FileStorageService } from './S3FileStorageService.ts';

interface BillServiceConstructor {
  billModel: BillDao;
  fileStorageService: FileStorageService;
  kafkaService: KafkaService;
}

export class BillService {
  private billModel: BillDao;
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

  /**
   * This method is a little unusual. Normally we wouldn't use the request
   * object at this layer, but it's required for our file storage service. So
   * we're both storing the bills image here and creating a new bills record in
   * our db.
   */
  public async create(req: ServerRequest): Promise<IdRecord> {
    const storedFiles = await this.fileStorageService.store(req);
    const idRecord = await this.billModel.create(
      BillCreate.parse({
        imagePath: storedFiles[0].path,
        imageStatus: 'parsing',
      }),
    );

    await this.kafkaService.publish(
      process.env.KAFKA_BILL_PROCESSING_TOPIC ?? '',
      {
        billId: idRecord.id,
        imageName: path.basename(storedFiles[0].path),
      },
    );

    return idRecord;
  }

  public async read(id: string): Promise<BillRead> {
    const bill = await this.billModel.read(id);

    // Get a presigned image URL so the FE can fetch the image from a private
    // repo.
    if (this.fileStorageService instanceof S3FileStorageService) {
      bill.imagePath = await this.fileStorageService.getPresignedUrl(
        bill.imagePath,
      );
    }

    return bill;
  }
}
