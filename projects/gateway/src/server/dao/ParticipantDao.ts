import type { Pool, PoolClient } from 'pg';
import type { IdRecord } from '../dto/id.ts';
import {
  type ParticipantCreate,
  type ParticipantRead,
  type ParticipantUpdate,
  toParticipantStorage,
} from '../dto/participant.ts';
import { BaseDao } from '../types/baseDao.ts';

export class ParticipantDao extends BaseDao<
  ParticipantCreate,
  ParticipantRead,
  {}
> {
  public constructor(db: Pool) {
    super(db, 'participant');
  }

  public async create(
    participant: ParticipantCreate,
    client?: PoolClient,
  ): Promise<IdRecord> {
    const insertItem = toParticipantStorage(participant);
    return this.createRecord(insertItem, client);
  }

  public async read(): Promise<ParticipantRead> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(
    id: number,
    update: ParticipantUpdate,
  ): Promise<IdRecord> {
    const dbUpdates = toParticipantStorage(update);
    return this.updateRecord(id, dbUpdates);
  }

  public async search(): Promise<ParticipantRead[]> {
    // TODO
    throw new Error('Not implemented');
  }

  public async nameAlreadyExistsByBillId(
    billId: number,
    name: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const { rowCount } = await (client ?? this.db).query(
      `
      SELECT ${this.tableName}.id
      FROM ${this.tableName}
      INNER JOIN bill_participant bp ON ${this.tableName}.id = bp.participant_id
      WHERE bp.bill_id = $1 and ${this.tableName}.name = $2
    `,
      [billId, name],
    );

    return !!rowCount;
  }
}
