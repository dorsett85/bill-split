import type { Pool } from 'pg';
import {
  type BillParticipantCreate,
  type BillParticipantRead,
  toBillParticipantStorage,
} from '../dto/billParticipant.ts';
import type { IdRecord } from '../dto/id.ts';
import { BaseDao } from '../types/baseDao.ts';

export class BillParticipantDao extends BaseDao<
  BillParticipantCreate,
  BillParticipantRead,
  {}
> {
  public constructor(db: Pool) {
    super(db, 'bill_participant');
  }

  public async create(data: BillParticipantCreate): Promise<IdRecord> {
    const insertItem = toBillParticipantStorage(data);
    return this.createRecord(insertItem);
  }

  public async read(): Promise<BillParticipantRead> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(): Promise<IdRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async search(): Promise<BillParticipantRead[]> {
    // TODO
    throw new Error('Not implemented');
  }
}
