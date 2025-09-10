import type { Pool } from 'pg';
import {
  type BillCreate,
  BillCreateStorage,
  type BillRead,
  BillReadStorage,
  type BillUpdate,
  BillUpdateStorage,
  toBillRead,
} from '../dto/bill.ts';
import { IdRecord } from '../dto/id.ts';
import { LineItemReadStorage } from '../dto/lineItem.ts';
import type { BaseDao } from '../types/baseDao.ts';

export class BillDao implements BaseDao<BillCreate, BillRead> {
  private db: Pool;

  constructor(pool: Pool) {
    this.db = pool;
  }

  public async create(bill: BillCreate): Promise<IdRecord> {
    const billToInsert = BillCreateStorage.parse(bill);
    const keys: string[] = [];
    const values: (string | number | null)[] = [];
    const params: string[] = [];
    let paramCount = 1;
    for (const [key, value] of Object.entries(billToInsert)) {
      if (value === undefined) continue;
      keys.push(key);
      values.push(value);
      params.push(`$${paramCount++}`);
    }

    const result = await this.db.query(
      `
      INSERT INTO bill (${keys.join(',')})
      VALUES (${params.join(',')})
      RETURNING id
      `,
      values,
    );

    return IdRecord.parse(result.rows[0]);
  }

  public async read(id: string): Promise<BillRead> {
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
    const billToUpdate = BillUpdateStorage.parse(billUpdates);
    const keys: string[] = [];
    const values: (string | number | null)[] = [];
    let paramCount = 1;
    for (const [key, value] of Object.entries(billToUpdate)) {
      if (value === undefined) continue;
      keys.push(`${key} = $${paramCount++}`);
      values.push(value);
    }

    const result = await this.db.query(
      `
      UPDATE bill set ${keys.join(',')}
      WHERE id = $${paramCount++}
      RETURNING id
      `,
      [...values, id],
    );

    return IdRecord.parse(result.rows[0]);
  }
}
