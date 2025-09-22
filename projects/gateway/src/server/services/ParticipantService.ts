import type { BillParticipantDao } from '../dao/BillParticipantDao.ts';
import type { LineItemParticipantDao } from '../dao/LineItemParticipantDao.ts';
import type { ParticipantDao } from '../dao/ParticipantDao.ts';
import type { IdRecord } from '../dto/id.ts';
import type {
  LineItemParticipantCreate,
  LineItemParticipantUpdate,
} from '../dto/lineItemParticipant.ts';
import type { ParticipantCreate } from '../dto/participant.ts';
import { calculateRemainingPctOwes } from '../utils/calculateRemainingPctOwes.ts';

interface ParticipantServiceConstructor {
  billParticipantDao: BillParticipantDao;
  lineItemParticipantDao: LineItemParticipantDao;
  participantDao: ParticipantDao;
}

export class ParticipantService {
  private billParticipantDao: BillParticipantDao;
  private lineItemParticipantDao: LineItemParticipantDao;
  private participantDao: ParticipantDao;

  constructor({
    billParticipantDao,
    lineItemParticipantDao,
    participantDao,
  }: ParticipantServiceConstructor) {
    this.billParticipantDao = billParticipantDao;
    this.lineItemParticipantDao = lineItemParticipantDao;
    this.participantDao = participantDao;
  }

  /**
   * Create a participant that will be associated with a bill
   */
  public async createBillParticipant(
    billId: number,
    participant: ParticipantCreate,
  ): Promise<IdRecord> {
    return await this.participantDao.tx(async (client) => {
      // Check if the name already exists for a bill
      const exists = await this.participantDao.nameAlreadyExistsByBillId(
        billId,
        participant.name,
      );

      if (exists) {
        throw new Error(`Participant '${participant.name}' already exists`);
      }

      // Create both the participant and the bill_participant
      const res = await this.participantDao.create(participant, client);
      await this.billParticipantDao.create(
        {
          billId,
          participantId: res.id,
        },
        client,
      );
      return res;
    });
  }

  /**
   * Deletes a participant and recalculates participant payments for that bill
   */
  public async deleteBillParticipant(
    billId: number,
    participantId: number,
  ): Promise<IdRecord> {
    return await this.participantDao.tx(async (client) => {
      const lineItemParticipants =
        await this.lineItemParticipantDao.searchByLineItemIdUsingBillAndParticipant(
          billId,
          participantId,
        );

      const result = calculateRemainingPctOwes(
        participantId,
        lineItemParticipants,
      );

      for (const { owes, ids } of result) {
        await this.lineItemParticipantDao.addOwesAcrossIds(owes, ids, client);
      }

      // Now that we've balanced what the remaining participants owe we can
      // finally delete the selected bill participant.
      const [billParticipant] = await this.billParticipantDao.search(
        { billId, participantId },
        client,
      );
      return await this.billParticipantDao.delete(billParticipant.id, client);
    });
  }

  public async createLineItemParticipant(
    lineItemParticipant: LineItemParticipantCreate,
  ): Promise<IdRecord> {
    return await this.lineItemParticipantDao.tx(async (client) => {
      const lineItemParticipants = await this.lineItemParticipantDao.search(
        {
          lineItemId: lineItemParticipant.lineItemId,
        },
        client,
      );
      const total = lineItemParticipants.reduce(
        (total, item) => item.pctOwes + total,
        lineItemParticipant.pctOwes,
      );

      if (total > 100) {
        throw new Error('Total percentage owed cannot be greater than 100');
      }

      return await this.lineItemParticipantDao.create(
        lineItemParticipant,
        client,
      );
    });
  }

  public async updateLineItemParticipant(
    id: number,
    update: LineItemParticipantUpdate,
  ): Promise<IdRecord> {
    return await this.lineItemParticipantDao.tx(async (client) => {
      const lineItemParticipants =
        await this.lineItemParticipantDao.searchByLineItemIdAssociatedWithPk(
          id,
          client,
        );

      // Add up the other line item participants with the new pct owes amount
      const total = lineItemParticipants.reduce(
        (total, item) => (item.id !== id ? item : update).pctOwes + total,
        0,
      );

      if (total > 100) {
        throw new Error('Total percentage owed cannot be greater than 100');
      }

      return await this.lineItemParticipantDao.update(id, update, client);
    });
  }

  public async deleteLineItemParticipant(id: number): Promise<IdRecord> {
    return await this.lineItemParticipantDao.tx(async (client) => {
      const lineItemParticipants =
        await this.lineItemParticipantDao.searchByLineItemIdAssociatedWithPk(
          id,
          client,
        );

      const result = calculateRemainingPctOwes(
        lineItemParticipants.filter((lip) => lip.id === id)[0].participantId,
        lineItemParticipants,
      );

      for (const { owes, ids } of result) {
        await this.lineItemParticipantDao.addOwesAcrossIds(owes, ids, client);
      }

      return await this.lineItemParticipantDao.delete(id, client);
    });
  }
}
