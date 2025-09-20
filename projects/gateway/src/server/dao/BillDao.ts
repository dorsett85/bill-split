import type { Pool, PoolClient } from 'pg';
import {
  type BillCreate,
  type BillRead,
  BillReadStorage,
  type BillUpdate,
  toBillRead,
  toBillStorage,
} from '../dto/bill.ts';
import type { IdRecord } from '../dto/id.ts';
import { BaseDao } from '../types/baseDao.ts';

export class BillDao extends BaseDao<BillCreate, BillRead, BillUpdate> {
  public constructor(db: Pool) {
    super(db, 'bill');
  }

  public async create(bill: BillCreate): Promise<IdRecord> {
    const billToInsert = toBillStorage(bill);
    return this.createRecord(billToInsert);
  }

  public async read(id: number, client?: PoolClient): Promise<BillRead> {
    const billCols = BillReadStorage.keyof().options.join(',');

    const billResult = await (client ?? this.db).query(
      `
      SELECT ${billCols}
      FROM ${this.tableName}
      WHERE id = $1
      `,
      [id],
    );

    return BillReadStorage.transform((bill) => toBillRead(bill)).parse(
      billResult.rows[0],
    );
  }

  public async update(id: number, billUpdates: BillUpdate): Promise<IdRecord> {
    const billToUpdate = toBillStorage(billUpdates);
    return this.updateRecord(id, billToUpdate);
  }

  public async search(): Promise<BillRead[]> {
    // TODO
    throw new Error('Not implemented');
  }
}
