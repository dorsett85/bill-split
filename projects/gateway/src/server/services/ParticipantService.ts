import type { BillDao } from '../dao/BillDao.ts';
import type { BillParticipantDao } from '../dao/BillParticipantDao.ts';
import type { ParticipantDao } from '../dao/ParticipantDao.ts';
import type { ParticipantLineItemDao } from '../dao/ParticipantLineItemDao.ts';
import type { BillReadDetailed } from '../dto/bill.ts';
import type { IdRecord } from '../dto/id.ts';
import type {
  ParticipantCreate,
  ParticipantUpdate,
} from '../dto/participant.ts';
import { calculateRemainingPctOwes } from '../utils/calculateRemainingPctOwes.ts';
import type { CryptoService } from './CryptoService.ts';
import type { KafkaProducerService } from './KafkaProducerService.ts';

interface ParticipantServiceConstructor {
  billDao: BillDao;
  billParticipantDao: BillParticipantDao;
  participantLineItemDao: ParticipantLineItemDao;
  participantDao: ParticipantDao;
  cryptoService: CryptoService;
  kafkaProducerService: KafkaProducerService;
}

export class ParticipantService {
  private readonly billDao: BillDao;
  private readonly billParticipantDao: BillParticipantDao;
  private readonly participantLineItemDao: ParticipantLineItemDao;
  private readonly participantDao: ParticipantDao;
  private readonly cryptoService: CryptoService;
  private readonly kafkaProducerService: KafkaProducerService;

  constructor({
    billDao,
    billParticipantDao,
    participantLineItemDao,
    participantDao,
    cryptoService,
    kafkaProducerService,
  }: ParticipantServiceConstructor) {
    this.billDao = billDao;
    this.billParticipantDao = billParticipantDao;
    this.participantLineItemDao = participantLineItemDao;
    this.participantDao = participantDao;
    this.cryptoService = cryptoService;
    this.kafkaProducerService = kafkaProducerService;
  }

  /**
   * Create a participant that will be associated with a bill
   */
  public async createBillParticipant(
    billId: number,
    participant: ParticipantCreate,
    sessionToken: string,
  ): Promise<BillReadDetailed | undefined> {
    if (!this.hasBillAccess(billId, sessionToken)) {
      return undefined;
    }

    return await this.participantDao.tx(async (client) => {
      // Check if the name already exists for a bill
      const exists = await this.participantDao.nameAlreadyExistsByBillId(
        billId,
        participant.name,
        client,
      );

      if (exists) {
        throw new Error(`Participant '${participant.name}' already exists`);
      }

      // Create both the participant and the bill_participant
      const detailed = await this.billParticipantDao.tx(async (client) => {
        const idRecord = await this.participantDao.create(participant, client);
        await this.billParticipantDao.create(
          {
            billId,
            participantId: idRecord.id,
          },
          client,
        );

        // TODO this is heavy handed for creating a new user, but we need other
        //  users to see this change and this is the only object our SSE topic
        //  supports at the moment.
        return this.billDao.readDetailed(billId, client);
      });

      if (!detailed) {
        return;
      }

      void this.publishRecalculatedBill(detailed, sessionToken);

      return detailed;
    });
  }

  public async updateBillParticipant(
    participantId: number,
    billId: number,
    update: ParticipantUpdate,
    sessionToken: string,
  ): Promise<IdRecord | undefined> {
    if (!this.hasBillAccess(billId, sessionToken)) {
      return undefined;
    }

    return await this.participantDao.update(participantId, update);
  }

  /**
   * Deletes a participant and recalculates participant payments for that bill
   */
  public async deleteBillParticipant(
    billId: number,
    participantId: number,
    sessionToken: string,
  ): Promise<BillReadDetailed | undefined> {
    if (!this.hasBillAccess(billId, sessionToken)) {
      return undefined;
    }

    const detailed = await this.participantDao.tx(async (client) => {
      const participantLineItems =
        await this.participantLineItemDao.searchByLineItemIdUsingBillAndParticipant(
          billId,
          participantId,
          client,
        );

      const result = calculateRemainingPctOwes(
        participantId,
        participantLineItems,
      );

      // Balance what the remaining participants owe
      for (const { owes, ids } of result) {
        await this.participantLineItemDao.addOwesByIds(owes, ids, client);
      }

      // Delete the line items associated with the participant
      for (const lineItem of participantLineItems) {
        if (lineItem.participantId === participantId) {
          await this.participantLineItemDao.delete(lineItem.id);
        }
      }

      // And finally delete the bill participant
      const [billParticipant] = await this.billParticipantDao.search(
        { billId, participantId },
        client,
      );

      await this.billParticipantDao.delete(billParticipant.id, client);

      return this.billDao.readDetailed(billId, client);
    });

    if (!detailed) {
      return;
    }

    void this.publishRecalculatedBill(detailed, sessionToken);

    return detailed;
  }

  public async createParticipantLineItem(
    billId: number,
    participantId: number,
    lineItemId: number,
    sessionToken: string,
  ): Promise<BillReadDetailed | undefined> {
    if (!this.hasBillAccess(billId, sessionToken)) {
      return undefined;
    }

    const detailed = await this.participantLineItemDao.tx(async (client) => {
      const participantLineItems = await this.participantLineItemDao.search(
        {
          lineItemId,
        },
        client,
      );
      // Evenly split the percent owes across all line item participants
      const newPctOwes = 100 / (participantLineItems.length + 1);

      if (participantLineItems.length > 0) {
        await this.participantLineItemDao.updateOwesByIds(
          newPctOwes,
          participantLineItems.map((pli) => pli.id),
          client,
        );
      }

      await this.participantLineItemDao.create(
        { lineItemId, participantId, pctOwes: newPctOwes },
        client,
      );

      return this.billDao.readDetailed(billId, client);
    });

    if (!detailed) {
      return;
    }

    void this.publishRecalculatedBill(detailed, sessionToken);

    return detailed;
  }

  public async deleteParticipantLineItem(
    billId: number,
    participantId: number,
    lineItemId: number,
    sessionToken: string,
  ): Promise<BillReadDetailed | undefined> {
    if (!this.hasBillAccess(billId, sessionToken)) {
      return undefined;
    }

    const detailed = await this.participantLineItemDao.tx(async (client) => {
      const participantLineItems =
        await this.participantLineItemDao.searchByRelatedLineItemIds(
          participantId,
          lineItemId,
          client,
        );

      const result = calculateRemainingPctOwes(
        participantLineItems.filter(
          (pli) =>
            pli.participantId === participantId &&
            pli.lineItemId === lineItemId,
        )[0].participantId,
        participantLineItems,
      );

      for (const { owes, ids } of result) {
        await this.participantLineItemDao.addOwesByIds(owes, ids, client);
      }

      await this.participantLineItemDao.deleteByParticipantAndLineItemIds(
        participantId,
        lineItemId,
        client,
      );

      return this.billDao.readDetailed(billId, client);
    });

    if (!detailed) {
      return;
    }

    void this.publishRecalculatedBill(detailed, sessionToken);

    return detailed;
  }

  private hasBillAccess(billId: number, sessionToken: string) {
    const payload = this.cryptoService.verifySessionJwt(sessionToken);
    return payload?.isAdmin || payload?.billAccessIds?.includes(billId);
  }

  private publishRecalculatedBill(
    bill: BillReadDetailed,
    sessionToken: string,
  ): void {
    void this.kafkaProducerService.publishBillRecalculate({
      billId: bill.id,
      sessionToken,
      recalculatedBill: {
        discount: bill.discount,
        subTotal: bill.subTotal,
        tax: bill.tax,
        gratuity: bill.gratuity,
        total: bill.total,
        lineItems: bill.lineItems,
        participants: bill.participants,
      },
    });
  }
}
