import type { Pool, PoolClient } from 'pg';
import type { IdRecord } from '../dto/id.ts';
import {
  type LineItemCreate,
  type LineItemRead,
  LineItemReadStorage,
  type LineItemSearch,
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

  public async read(): Promise<LineItemRead> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(
    id: number,
    lineItemUpdates: LineItemUpdate,
  ): Promise<IdRecord> {
    const updates = toLineItemStorage(lineItemUpdates);
    return this.updateRecord(id, updates);
  }

  public async search(
    searchParams: LineItemSearch,
    client?: PoolClient,
  ): Promise<LineItemRead[]> {
    const cols = LineItemReadStorage.keyof().options;

    const dbParams = toLineItemStorage(searchParams);
    const { rows } = await this.searchRecords(dbParams, cols, client);

    return rows.map((rows) =>
      LineItemReadStorage.transform(toLineItemRead).parse(rows),
    );
  }
}
