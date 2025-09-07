import type { Pool } from 'pg';
import {
  type BillCreate,
  type BillRead,
  BillReadStorage,
  mapToBillCreateStorage,
  mapToBillRead,
} from '../dto/bill.ts';
import { IdRecord } from '../dto/id.ts';
import { LineItemReadStorage, mapToLineItemRead } from '../dto/lineItem.ts';
import type { BaseDao } from '../types/baseDao.ts';

export class BillDao implements BaseDao<BillRead> {
  private db: Pool;

  constructor(pool: Pool) {
    this.db = pool;
  }

  public async create(bill: BillCreate): Promise<IdRecord> {
    const billToInsert = mapToBillCreateStorage(bill);
    const keys: string[] = [];
    const values: (string | number | null)[] = [];
    const params: string[] = [];
    Object.entries(billToInsert).forEach(([key, value], i) => {
      keys.push(key);
      values.push(value);
      params.push(`$${i + 1}`);
    });

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

    return mapToBillRead({
      ...billResult.rows[0],
      lineItems: lineItemsResult.rows.map(mapToLineItemRead),
    });
  }
}
