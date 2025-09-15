import type { Pool } from 'pg';
import type { IdRecord } from '../dto/id.ts';
import {
  type ParticipantCreate,
  type ParticipantRead,
  ParticipantReadStorage,
  type ParticipantSearch,
  toParticipantRead,
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

  public async create(participant: ParticipantCreate): Promise<IdRecord> {
    const insertItem = toParticipantStorage(participant);
    return this.createRecord(insertItem);
  }

  public async read(): Promise<ParticipantRead> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(): Promise<IdRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async search(
    searchParams: ParticipantSearch,
  ): Promise<ParticipantRead[]> {
    const dbParams = toParticipantStorage(searchParams);
    const cols = ParticipantReadStorage.keyof().options;
    const { rows } = await this.searchRecords(dbParams, cols);

    return rows.map((row) =>
      toParticipantRead(ParticipantReadStorage.parse(row)),
    );
  }
}
