import type { BillParticipantDao } from '../dao/BillParticipantDao.ts';
import type { LineItemParticipantDao } from '../dao/LineItemParticipantDao.ts';
import type { ParticipantDao } from '../dao/ParticipantDao.ts';
import type { IdRecord } from '../dto/id.ts';
import type { LineItemParticipantCreateRequest } from '../dto/lineItemParticipant.ts';
import type {
  ParticipantCreate,
  ParticipantResponse,
  ParticipantUpdate,
} from '../dto/participant.ts';
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
        client,
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

  public async readBillParticipants(
    billId: number,
  ): Promise<ParticipantResponse> {
    return await this.participantDao.tx(async (client) => {
      const lineItemParticipants =
        await this.lineItemParticipantDao.searchByBillId(billId, client);
      const participants = await this.participantDao.searchByBillId(
        billId,
        client,
      );

      return participants.map((participant) => ({
        id: participant.id,
        name: participant.name,
        lineItems: lineItemParticipants
          .filter((lip) => lip.participantId === participant.id)
          .map((lip) => ({
            id: lip.id,
            lineItemId: lip.lineItemId,
            pctOwes: lip.pctOwes,
          })),
      }));
    });
  }

  public async updateBillParticipant(
    participantId: number,
    update: ParticipantUpdate,
  ): Promise<IdRecord> {
    return await this.participantDao.update(participantId, update);
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
          client,
        );

      const result = calculateRemainingPctOwes(
        participantId,
        lineItemParticipants,
      );

      for (const { owes, ids } of result) {
        await this.lineItemParticipantDao.addOwesByIds(owes, ids, client);
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
    lineItemParticipant: LineItemParticipantCreateRequest,
  ): Promise<IdRecord> {
    return await this.lineItemParticipantDao.tx(async (client) => {
      const lineItemParticipants = await this.lineItemParticipantDao.search(
        {
          lineItemId: lineItemParticipant.lineItemId,
        },
        client,
      );
      // Evenly split the percent owes across all line item participants
      const newPctOwes = 100 / (lineItemParticipants.length + 1);

      if (lineItemParticipants.length > 0) {
        await this.lineItemParticipantDao.updateOwesByIds(
          newPctOwes,
          lineItemParticipants.map((lip) => lip.id),
          client,
        );
      }

      return await this.lineItemParticipantDao.create(
        { ...lineItemParticipant, pctOwes: newPctOwes },
        client,
      );
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
        await this.lineItemParticipantDao.addOwesByIds(owes, ids, client);
      }

      return await this.lineItemParticipantDao.delete(id, client);
    });
  }
}
