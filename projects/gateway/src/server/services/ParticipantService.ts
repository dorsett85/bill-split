import { DatabaseError } from 'pg';
import type { BillDao } from '../dao/BillDao.ts';
import type { ParticipantDao } from '../dao/ParticipantDao.ts';
import type { ParticipantLineItemDao } from '../dao/ParticipantLineItemDao.ts';
import type { BillReadDetailed } from '../dto/bill.ts';
import type { CountRecord } from '../dto/count.ts';
import type { IdRecord } from '../dto/id.ts';
import type {
  ParticipantCreateRequest,
  ParticipantUpdateRequest,
} from '../dto/participant.ts';
import type { ParticipantLineItemUpdateRequest } from '../dto/participantLineItem.ts';
import type { KafkaProducerService } from './KafkaProducerService.ts';

interface ParticipantServiceConstructor {
  billDao: BillDao;
  participantLineItemDao: ParticipantLineItemDao;
  participantDao: ParticipantDao;
  kafkaProducerService: KafkaProducerService;
}

export class ParticipantService {
  private readonly billDao: BillDao;
  private readonly participantLineItemDao: ParticipantLineItemDao;
  private readonly participantDao: ParticipantDao;
  private readonly kafkaProducerService: KafkaProducerService;

  constructor({
    billDao,
    participantLineItemDao,
    participantDao,
    kafkaProducerService,
  }: ParticipantServiceConstructor) {
    this.billDao = billDao;
    this.participantLineItemDao = participantLineItemDao;
    this.participantDao = participantDao;
    this.kafkaProducerService = kafkaProducerService;
  }

  /**
   * Create a participant that will be associated with a bill
   */
  public async createBillParticipant(
    billId: number,
    participant: ParticipantCreateRequest,
    sessionToken: string,
  ): Promise<IdRecord> {
    return await this.participantDao.tx(async (client) => {
      try {
        const idRecord = await this.participantDao.create(
          { billId, name: participant.name },
          client,
        );

        // TODO this is heavy handed for creating a new user, but we need other
        //  users to see this change and this is the only object our SSE topic
        //  supports at the moment.
        const detailedBill = await this.billDao.readDetailed(billId, client);
        if (detailedBill) {
          void this.publishRecalculatedBill(detailedBill, sessionToken);
        }
        return idRecord;
      } catch (e) {
        if (e instanceof DatabaseError && e.code === '23505') {
          throw new Error(`Participant '${participant.name}' already exists`);
        } else {
          throw new Error('Something went wrong creating participant');
        }
      }
    });
  }

  public async updateBillParticipant(
    billId: number,
    participantId: number,
    update: ParticipantUpdateRequest,
    sessionToken: string,
  ): Promise<CountRecord> {
    return await this.participantDao.tx(async (client) => {
      const countRecord = await this.participantDao.update(participantId, {
        billId,
        name: update.name,
      });

      // TODO this is heavy handed for creating a new user, but we need other
      //  users to see this change and this is the only object our SSE topic
      //  supports at the moment.
      const detailedBill = await this.billDao.readDetailed(billId, client);
      if (detailedBill) {
        void this.publishRecalculatedBill(detailedBill, sessionToken);
      }

      return countRecord;
    });
  }

  /**
   * Deletes a participant and recalculates participant payments for that bill
   */
  public async deleteBillParticipant(
    billId: number,
    participantId: number,
    sessionToken: string,
  ): Promise<BillReadDetailed | undefined> {
    const detailed = await this.participantDao.tx(async (client) => {
      // Balance what the remaining participants owe and delete the line items
      await this.participantLineItemDao.deleteByParticipantIdAndRebalance(
        participantId,
        billId,
        client,
      );

      // And finally delete the bill participant
      await this.participantDao.deleteBillParticipant(
        participantId,
        billId,
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

  public async createParticipantLineItem(
    billId: number,
    participantId: number,
    lineItemId: number,
    sessionToken: string,
  ): Promise<BillReadDetailed | undefined> {
    const detailed = await this.participantLineItemDao.tx(async (client) => {
      await this.participantLineItemDao.createByLineItemIdAndRebalance(
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

  public async deleteParticipantLineItem(
    billId: number,
    participantId: number,
    lineItemId: number,
    sessionToken: string,
  ): Promise<BillReadDetailed | undefined> {
    const detailed = await this.participantLineItemDao.tx(async (client) => {
      await this.participantLineItemDao.deleteByLineItemIdsAndRebalance(
        participantId,
        [lineItemId],
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

  public async updateManyBillParticipantLineItems(
    billId: number,
    lineItemId: number,
    update: ParticipantLineItemUpdateRequest,
    sessionToken: string,
  ): Promise<BillReadDetailed | undefined> {
    // New pct owns must equal 100!
    const sum = update.participants.reduce((total, p) => total + p.pctOwes, 0);
    if (sum < 100) {
      return undefined;
    }

    const detailed = await this.participantLineItemDao.tx(async (client) => {
      for (const p of update.participants) {
        await this.participantLineItemDao.updateBySearch(
          { participantId: p.id, lineItemId },
          { pctOwes: p.pctOwes },
          client,
        );
      }

      return this.billDao.readDetailed(billId, client);
    });

    if (!detailed) {
      return;
    }

    void this.publishRecalculatedBill(detailed, sessionToken);

    return detailed;
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
