import type { Pool, PoolClient } from 'pg';
import type { CountRecord } from '../dto/count.ts';
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
  ParticipantUpdate
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

  public async read(
    _id: number,
    _client?: PoolClient,
  ): Promise<ParticipantRead | undefined> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(
    id: number,
    update: ParticipantUpdate,
    client?: PoolClient,
  ): Promise<CountRecord> {
    const dbUpdates = toParticipantStorage(update);
    return this.updateRecord(id, dbUpdates, client);
  }

  public async search(
    _searchParams: Record<string, number | string>,
    _client?: PoolClient,
  ): Promise<ParticipantRead[]> {
    // TODO
    throw new Error('Not implemented');
  }

  public async delete(_id: number, _client?: PoolClient): Promise<CountRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async deleteBillParticipant(
    participantId: number,
    billId: number,
    client?: PoolClient,
  ): Promise<CountRecord> {
    const result = await (client ?? this.db).query(
      `
      DELETE FROM ${this.tableName}
      WHERE id = $1 AND bill_id = $2`,
      [participantId, billId],
    );
    return { count: result.rowCount ?? 0 };
  }
}
