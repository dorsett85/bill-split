import path from 'path';
import type { AccessTokenDao } from '../dao/AccessTokenDao.ts';
import type { BillDao } from '../dao/BillDao.ts';
import type { LineItemDao } from '../dao/LineItemDao.ts';
import type { LineItemParticipantDao } from '../dao/LineItemParticipantDao.ts';
import type { ParticipantDao } from '../dao/ParticipantDao.ts';
import { BillCreate, type BillResponse, type BillUpdate } from '../dto/bill.ts';
import type { IdRecord } from '../dto/id.ts';
import type { LineItemCreate, LineItemUpdate } from '../dto/lineItem.ts';
import type { FileStorageService } from '../types/fileStorageService.ts';
import type { ServerRequest } from '../types/serverRequest.ts';
import type { CryptoService } from './CryptoService.ts';
import type { KafkaService } from './KafkaService.ts';
import { S3FileStorageService } from './S3FileStorageService.ts';

/**
 * Used to build consistent text for hmac signing/verifying
 */
const makeHmacReadyBillText = (billId: number) => `bill/${billId}`;

interface BillServiceConstructor {
  accessTokenDao: AccessTokenDao;
  billDao: BillDao;
  lineItemDao: LineItemDao;
  lineItemParticipantDao: LineItemParticipantDao;
  participantDao: ParticipantDao;
  cryptoService: CryptoService;
  fileStorageService: FileStorageService;
  kafkaService: KafkaService;
}

export class BillService {
  private readonly accessTokenDao: AccessTokenDao;
  private readonly billDao: BillDao;
  private readonly lineItemDao: LineItemDao;
  private readonly lineItemParticipantDao: LineItemParticipantDao;
  private readonly participantDao: ParticipantDao;
  private readonly cryptoService: CryptoService;
  private readonly fileStorageService: FileStorageService;
  private readonly kafkaService: KafkaService;

  constructor({
    accessTokenDao,
    billDao,
    lineItemDao,
    lineItemParticipantDao,
    participantDao,
    cryptoService,
    fileStorageService,
    kafkaService,
  }: BillServiceConstructor) {
    this.accessTokenDao = accessTokenDao;
    this.billDao = billDao;
    this.lineItemDao = lineItemDao;
    this.lineItemParticipantDao = lineItemParticipantDao;
    this.participantDao = participantDao;
    this.cryptoService = cryptoService;
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
    sessionToken: string,
  ): Promise<(IdRecord & { signature: string }) | undefined> {
    const payload = this.cryptoService.verifySessionJwt(sessionToken);
    if (!payload?.isAdmin && !payload?.createBill) {
      return undefined;
    }

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
    const signature = this.cryptoService.signHmac(makeHmacReadyBillText(id));

    return { id, signature };
  }

  public async read(
    id: number,
    sessionToken?: string,
  ): Promise<BillResponse | undefined> {
    if (sessionToken) {
      if (!this.hasBillAccess(id, sessionToken)) {
        return undefined;
      }
    }

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

  public async update(
    id: number,
    update: BillUpdate,
    sessionToken: string,
  ): Promise<IdRecord | undefined> {
    if (!this.hasBillAccess(id, sessionToken)) {
      return undefined;
    }

    return await this.billDao.update(id, update);
  }

  public async createLineItem(
    billId: number,
    lineItem: LineItemCreate,
    sessionToken: string,
  ): Promise<IdRecord | undefined> {
    if (!this.hasBillAccess(billId, sessionToken)) {
      return undefined;
    }

    return await this.lineItemDao.create(lineItem);
  }

  public async updateLineItem(
    id: number,
    billId: number,
    update: LineItemUpdate,
    sessionToken: string,
  ): Promise<IdRecord | undefined> {
    if (!this.hasBillAccess(billId, sessionToken)) {
      return undefined;
    }

    return await this.lineItemDao.update(id, update);
  }

  public async signBillCreateToken(
    pin: string,
    sessionToken?: string,
  ): Promise<string | null> {
    const hashedToken = this.cryptoService.signHmac(pin);

    // Check that the pin is active and hasn't gone over its usage limit. If
    // successful then increase the no of uses.
    const result = await this.accessTokenDao.tx(async (client) => {
      const [accessToken] = await this.accessTokenDao.search(
        { hashedToken },
        client,
      );
      if (!accessToken || !accessToken.active || accessToken.noOfUses >= 10) {
        return null;
      }

      return this.accessTokenDao.update(
        accessToken.id,
        {
          noOfUses: accessToken.noOfUses + 1,
        },
        client,
      );
    });

    if (!result) {
      return null;
    }

    const payload = sessionToken
      ? this.cryptoService.verifySessionJwt(sessionToken)
      : null;

    return this.cryptoService.signSessionJwt({ ...payload, createBill: true });
  }

  /**
   * A more complicated method. Accessing the bill page requires either a
   * sessionToken with admin or bill access permission, or a hmac signature
   * query param. This allows the page to be shareable with people that don't
   * have a session token.
   *
   * Once The page is accessed with a signature hmac, the response will then set
   * the sessionToken with bill access permission.
   */
  public async prepareBillPage(
    billId: number,
    signature?: string,
    sessionToken?: string,
  ): Promise<{ token?: string; bill: BillResponse } | undefined> {
    const hasBillAccess =
      !!sessionToken && this.hasBillAccess(billId, sessionToken);

    const addBillTokenAccess =
      !hasBillAccess &&
      !!signature &&
      this.cryptoService.verifyHmac(signature, makeHmacReadyBillText(billId));

    // This check reveals if the user can access the page
    if (!hasBillAccess && !addBillTokenAccess) {
      return undefined;
    }

    let token: string | undefined = undefined;
    if (addBillTokenAccess) {
      const payload = sessionToken
        ? this.cryptoService.verifySessionJwt(sessionToken)
        : null;

      token = this.cryptoService.signSessionJwt({
        ...payload,
        billAccessIds: (payload?.billAccessIds ?? []).concat(billId),
      });
    }

    const bill = await this.read(billId);

    if (!bill) {
      return undefined;
    }

    return {
      bill,
      token,
    };
  }

  private hasBillAccess(billId: number, sessionToken: string) {
    const payload = this.cryptoService.verifySessionJwt(sessionToken);
    return payload?.isAdmin || payload?.billAccessIds?.includes(billId);
  }
}
