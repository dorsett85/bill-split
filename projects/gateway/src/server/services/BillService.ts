import { PassThrough } from 'node:stream';
import formidable, { VolatileFile } from 'formidable';
import path from 'path';
import type { AccessTokenDao } from '../dao/AccessTokenDao.ts';
import type { BillDao } from '../dao/BillDao.ts';
import type { ParticipantDao } from '../dao/ParticipantDao.ts';
import {
  BillCreate,
  type BillReadDetailed,
  type BillUpdate,
} from '../dto/bill.ts';
import type { CountRecord } from '../dto/count.ts';
import { type IdRecord, intId } from '../dto/id.ts';
import type { FileStorageService } from '../types/fileStorageService.ts';
import type { ServerRequest } from '../types/serverRequest.ts';
import type { CryptoService } from './CryptoService.ts';
import type { KafkaProducerService } from './KafkaProducerService.ts';
import { S3FileStorageService } from './S3FileStorageService.ts';

/**
 * Used to build consistent text for hmac signing/verifying
 */
const makeHmacReadyBillText = (billId: number) => `bill/${billId}`;

interface BillServiceConstructor {
  accessTokenDao: AccessTokenDao;
  billDao: BillDao;
  participantDao: ParticipantDao;
  cryptoService: CryptoService;
  fileStorageService: FileStorageService;
  kafkaProducerService: KafkaProducerService;
}

export class BillService {
  private readonly accessTokenDao: AccessTokenDao;
  private readonly billDao: BillDao;
  private readonly participantDao: ParticipantDao;
  private readonly cryptoService: CryptoService;
  private readonly fileStorageService: FileStorageService;
  private readonly kafkaProducerService: KafkaProducerService;

  constructor({
    accessTokenDao,
    billDao,
    participantDao,
    cryptoService,
    fileStorageService,
    kafkaProducerService,
  }: BillServiceConstructor) {
    this.accessTokenDao = accessTokenDao;
    this.billDao = billDao;
    this.participantDao = participantDao;
    this.cryptoService = cryptoService;
    this.fileStorageService = fileStorageService;
    this.kafkaProducerService = kafkaProducerService;
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

    let newUploadPathPromise: Promise<string | undefined> | undefined =
      Promise.resolve(undefined);

    const form = formidable({
      keepExtensions: true,
      fileWriteStreamHandler: (file) => {
        const pass = new PassThrough();
        if (file instanceof VolatileFile) {
          newUploadPathPromise = this.fileStorageService.store(
            pass,
            file.newFilename,
          );
        }

        return pass;
      },
    });

    const [fields] = await form.parse(req);

    const parseNumPayeesResult = intId.safeParse(fields.numPayees?.[0]);

    if (!parseNumPayeesResult.success) {
      return undefined;
    }

    const storedFilePath = await newUploadPathPromise;

    if (!storedFilePath) {
      return undefined;
    }

    const { id } = await this.billDao.tx(async (client) => {
      const idRecord = await this.billDao.create(
        BillCreate.parse({
          imagePath: storedFilePath,
          imageStatus: 'parsing',
        }),
        client,
      );

      // TODO we can more efficiently prefill these participants in a single db
      //  call.
      for (let i = 1; i <= parseNumPayeesResult.data; i++) {
        await this.participantDao.create(
          {
            // This will come out as "Participant A", "Participant B", etc.
            name: `Participant ${String.fromCharCode(64 + i)}`,
            billId: idRecord.id,
          },
          client,
        );
      }

      return idRecord;
    });

    await this.kafkaProducerService.publishBill({
      billId: id,
      imageName: path.basename(storedFilePath),
    });

    // Create a hmac signature to allow sharing of the new bill url
    const signature = this.cryptoService.signHmac(makeHmacReadyBillText(id));

    return { id, signature };
  }

  public async read(billId: number): Promise<BillReadDetailed | undefined> {
    const bill = await this.billDao.readDetailed(billId);

    if (!bill) {
      return undefined;
    }

    if (this.fileStorageService instanceof S3FileStorageService) {
      bill.imagePath = await this.fileStorageService.getPresignedUrl(
        bill.imagePath,
      );
    }

    return bill;
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
  public async readBillPage(
    billId: number,
    signature?: string,
    sessionToken?: string,
  ): Promise<{ token?: string; bill: BillReadDetailed } | undefined> {
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

    const bill = await this.billDao.readDetailed(billId);

    if (!bill) {
      return undefined;
    }

    if (this.fileStorageService instanceof S3FileStorageService) {
      bill.imagePath = await this.fileStorageService.getPresignedUrl(
        bill.imagePath,
      );
    }

    return {
      bill,
      token,
    };
  }

  public async update(id: number, update: BillUpdate): Promise<CountRecord> {
    return await this.billDao.update(id, update);
  }

  public async signBillCreateToken(
    pin: string,
    sessionToken?: string,
  ): Promise<string | null> {
    const hashedToken = this.cryptoService.signHmac(pin);

    // Check that the pin is active and hasn't gone over its usage limit. If
    //  successful, then increase the no of uses.
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

  private hasBillAccess(billId: number, sessionToken: string) {
    const payload = this.cryptoService.verifySessionJwt(sessionToken);
    return payload?.isAdmin || payload?.billAccessIds?.includes(billId);
  }
}
