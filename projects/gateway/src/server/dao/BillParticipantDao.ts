import type { Pool, PoolClient } from 'pg';
import {
  type BillParticipantCreate,
  type BillParticipantRead,
  BillParticipantReadStorage,
  type BillParticipantSearch,
  toBillParticipantRead,
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

  public async create(
    data: BillParticipantCreate,
    client?: PoolClient,
  ): Promise<IdRecord> {
    const insertItem = toBillParticipantStorage(data);
    return this.createRecord(insertItem, client);
  }

  public async read(): Promise<BillParticipantRead> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(): Promise<IdRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async search(
    searchParams: BillParticipantSearch,
    client?: PoolClient,
  ): Promise<BillParticipantRead[]> {
    const cols = BillParticipantReadStorage.keyof().options;
    const lineItemSearch = toBillParticipantStorage(searchParams);

    const { rows } = await this.searchRecords(lineItemSearch, cols, client);
    return rows.map((row) =>
      BillParticipantReadStorage.transform(toBillParticipantRead).parse(row),
    );
  }
}
