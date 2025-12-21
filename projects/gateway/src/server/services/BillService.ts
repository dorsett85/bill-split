import path from 'path';
import type { BillDao } from '../dao/BillDao.ts';
import type { LineItemDao } from '../dao/LineItemDao.ts';
import type { LineItemParticipantDao } from '../dao/LineItemParticipantDao.ts';
import type { ParticipantDao } from '../dao/ParticipantDao.ts';
import { BillCreate, type BillResponse, type BillUpdate } from '../dto/bill.ts';
import type { IdRecord } from '../dto/id.ts';
import type { LineItemCreate, LineItemUpdate } from '../dto/lineItem.ts';
import type { FileStorageService } from '../types/fileStorageService.ts';
import type { ServerRequest } from '../types/serverRequest.ts';
import type { AuthService } from './AuthService.ts';
import type { KafkaService } from './KafkaService.ts';
import { S3FileStorageService } from './S3FileStorageService.ts';

interface BillServiceConstructor {
  billDao: BillDao;
  lineItemDao: LineItemDao;
  lineItemParticipantDao: LineItemParticipantDao;
  participantDao: ParticipantDao;
  authService: AuthService;
  fileStorageService: FileStorageService;
  kafkaService: KafkaService;
}

export class BillService {
  private billDao: BillDao;
  private lineItemDao: LineItemDao;
  private lineItemParticipantDao: LineItemParticipantDao;
  private participantDao: ParticipantDao;
  private readonly authService: AuthService;
  private readonly fileStorageService: FileStorageService;
  private kafkaService: KafkaService;

  constructor({
    billDao,
    lineItemDao,
    lineItemParticipantDao,
    participantDao,
    authService,
    fileStorageService,
    kafkaService,
  }: BillServiceConstructor) {
    this.billDao = billDao;
    this.lineItemDao = lineItemDao;
    this.lineItemParticipantDao = lineItemParticipantDao;
    this.participantDao = participantDao;
    this.authService = authService;
    this.fileStorageService = fileStorageService;
    this.kafkaService = kafkaService;
  }

  /**
   * This method is a little unusual. Normally we wouldn't use the request
   * object at this layer, but it's required for our file storage service. So
   * we're both storing the bills image here and creating a new bills record in
   * our db.
   */
  public async create(
    req: ServerRequest,
  ): Promise<IdRecord & { signature: string }> {
    const storedFiles = await this.fileStorageService.store(req);
    const { id } = await this.billDao.create(
      BillCreate.parse({
        imagePath: storedFiles[0].path,
        imageStatus: 'parsing',
      }),
    );

    await this.kafkaService.publishBill({
      billId: id,
      imageName: path.basename(storedFiles[0].path),
    });

    // Create a hmac signature to allow sharing of the new bill url
    const signature = this.authService.signBillAccessHmac(id);

    return { id, signature };
  }

  public async read(id: number): Promise<BillResponse> {
    const res: BillResponse = await this.billDao.tx(async (client) => {
      const bill = await this.billDao.read(id, client);
      const lineItems = await this.lineItemDao.search(
        { billId: bill.id },
        client,
      );
      const lineItemParticipants =
        await this.lineItemParticipantDao.searchByBillId(bill.id, client);
      const participants = await this.participantDao.searchByBillId(
        bill.id,
        client,
      );

      return {
        ...bill,
        lineItems,
        participants: participants.map((participant) => ({
          id: participant.id,
          name: participant.name,
          lineItems: lineItemParticipants
            .filter((lip) => lip.participantId === participant.id)
            .map((lip) => ({
              id: lip.id,
              lineItemId: lip.lineItemId,
              pctOwes: lip.pctOwes,
            })),
        })),
      };
    });

    // Get a presigned image URL so the FE can fetch the image from a private
    // repo.
    if (this.fileStorageService instanceof S3FileStorageService) {
      res.imagePath = await this.fileStorageService.getPresignedUrl(
        res.imagePath,
      );
    }

    return res;
  }

  public async update(id: number, bill: BillUpdate): Promise<IdRecord> {
    return await this.billDao.update(id, bill);
  }

  public async createLineItem(lineItem: LineItemCreate): Promise<IdRecord> {
    return await this.lineItemDao.create(lineItem);
  }

  public async updateLineItem(
    id: number,
    update: LineItemUpdate,
  ): Promise<IdRecord> {
    return await this.lineItemDao.update(id, update);
  }
}
