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
        await this.lineItemParticipantDao.searchByBillAndParticipant(
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
    lineItemId: number,
    lineItemParticipant: LineItemParticipantCreate,
  ): Promise<IdRecord> {
    return await this.lineItemParticipantDao.tx(async (client) => {
      const lineItemParticipants = await this.lineItemParticipantDao.search(
        {
          lineItemId,
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
    lineItemId: number,
    participantId: number,
    update: LineItemParticipantUpdate,
  ): Promise<IdRecord> {
    return await this.lineItemParticipantDao.tx(async (client) => {
      const lineItemParticipants = await this.lineItemParticipantDao.search(
        { lineItemId },
        client,
      );
      const total = lineItemParticipants
        .filter((item) => item.participantId !== participantId)
        .reduce((total, item) => item.pctOwes + total, update.pctOwes);

      if (total > 100) {
        throw new Error('Total percentage owed cannot be greater than 100');
      }

      const [lineItemParticipant] = lineItemParticipants.filter(
        (item) => item.participantId === participantId,
      );
      return await this.lineItemParticipantDao.update(
        lineItemParticipant.id,
        update,
        client,
      );
    });
  }

  public async deleteLineItemParticipant(
    lineItemId: number,
    participantId: number,
  ): Promise<IdRecord> {
    return await this.lineItemParticipantDao.tx(async (client) => {
      const lineItemParticipants = await this.lineItemParticipantDao.search(
        { lineItemId },
        client,
      );

      const result = calculateRemainingPctOwes(
        participantId,
        lineItemParticipants,
      );

      for (const { owes, ids } of result) {
        await this.lineItemParticipantDao.addOwesAcrossIds(owes, ids, client);
      }

      const [lineItemParticipant] = lineItemParticipants.filter(
        (item) => item.participantId === participantId,
      );
      return await this.lineItemParticipantDao.delete(
        lineItemParticipant.id,
        client,
      );
    });
  }
}
