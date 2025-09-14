import type { Pool } from 'pg';
import {
  type BillCreate,
  type BillRead,
  BillReadStorage,
  type BillUpdate,
  toBillRead,
  toBillStorage,
} from '../dto/bill.ts';
import type { IdRecord } from '../dto/id.ts';
import { LineItemReadStorage } from '../dto/lineItem.ts';
import { BaseDao } from '../types/baseDao.ts';

export class BillDao extends BaseDao<BillCreate, BillRead, BillUpdate> {
  public constructor(db: Pool) {
    super(db, 'bill');
  }

  public async create(bill: BillCreate): Promise<IdRecord> {
    const billToInsert = toBillStorage(bill);
    return this.createRecord(billToInsert);
  }

  public async read(id: number): Promise<BillRead> {
    const billCols = BillReadStorage.keyof().options.join(',');
    const lineItemCols = LineItemReadStorage.keyof().options.join(',');

    const billResult = await this.db.query(
      `
      SELECT ${billCols}
      FROM bill
      WHERE id = $1
      `,
      [id],
    );
    const lineItemsResult = await this.db.query(
      `
      SELECT ${lineItemCols}
      FROM line_item
      where bill_id = $1
      `,
      [id],
    );

    return BillReadStorage.transform((bill) =>
      toBillRead(
        bill,
        lineItemsResult.rows.map((row) => LineItemReadStorage.parse(row)),
      ),
    ).parse(billResult.rows[0]);
  }

  public async update(id: number, billUpdates: BillUpdate): Promise<IdRecord> {
    const billToUpdate = toBillStorage(billUpdates);
    return this.updateRecord(id, billToUpdate);
  }
}
