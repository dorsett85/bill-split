import type { Pool } from 'pg';
import type { IdRecord } from '../dto/id.ts';
import {
  type LineItemCreate,
  type LineItemRead,
  LineItemReadStorage,
  type LineItemUpdate,
  toLineItemRead,
  toLineItemStorage,
} from '../dto/lineItem.ts';
import { BaseDao } from '../types/baseDao.ts';

export class LineItemDao extends BaseDao<
  LineItemCreate,
  LineItemRead,
  LineItemUpdate
> {
  public constructor(db: Pool) {
    super(db, 'line_item');
  }

  public async create(lineItem: LineItemCreate): Promise<IdRecord> {
    const lineItemToInsert = toLineItemStorage(lineItem);
    return this.createRecord(lineItemToInsert);
  }

  public async read(id: number): Promise<LineItemRead> {
    const lineItemCols = LineItemReadStorage.keyof().options.join(',');

    const lineItemsResult = await this.db.query(
      `
      SELECT ${lineItemCols}
      FROM ${this.tableName}
      where id = $1
      `,
      [id],
    );

    return toLineItemRead(LineItemReadStorage.parse(lineItemsResult));
  }

  public async update(
    id: number,
    lineItemUpdates: LineItemUpdate,
  ): Promise<IdRecord> {
    const updates = toLineItemStorage(lineItemUpdates);
    return this.updateRecord(id, updates);
  }

  public async search(): Promise<LineItemRead[]> {
    // TODO
    throw new Error('Not implemented');
  }
}
