import type { BillParticipantDao } from '../dao/BillParticipantDao.ts';
import type { ParticipantDao } from '../dao/ParticipantDao.ts';
import type { BillParticipantDelete } from '../dto/billParticipant.ts';
import type { IdRecord } from '../dto/id.ts';
import type { ParticipantCreate } from '../dto/participant.ts';

interface ParticipantServiceConstructor {
  billParticipantDao: BillParticipantDao;
  participantDao: ParticipantDao;
}

export class ParticipantService {
  private billParticipantDao: BillParticipantDao;
  private participantDao: ParticipantDao;

  constructor({
    billParticipantDao,
    participantDao,
  }: ParticipantServiceConstructor) {
    this.billParticipantDao = billParticipantDao;
    this.participantDao = participantDao;
  }

  /**
   * Create a participant that will be associated with a bill
   */
  public async createBillParticipant(
    billId: number,
    participant: ParticipantCreate,
  ): Promise<IdRecord> {
    // TODO this needs to be a transaction
    const idRecord = await this.participantDao.create(participant);
    await this.billParticipantDao.create({
      billId,
      participantId: idRecord.id,
    });

    return idRecord;
  }

  /**
   * Deletes a participant and recalculates participant payments for that bill
   */
  public async deleteBillParticipant({
    billId,
    participantId,
  }: BillParticipantDelete): Promise<IdRecord> {
    // TODO this needs to be a transaction
    const idRecord = await this.participantDao.delete(participantId);
    console.log('TODO Recalculate participant payment for bill id:', billId);
    return idRecord;
  }
}
