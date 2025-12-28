import type { Pool, PoolClient } from 'pg';
import type { CountRecord } from '../dto/count.ts';
import type { IdRecord } from '../dto/id.ts';
import {
  type LineItemCreate,
  type LineItemRead,
  toLineItemStorage,
} from '../dto/lineItem.ts';
import { BaseDao } from '../types/baseDao.ts';

export class LineItemDao extends BaseDao<LineItemCreate, LineItemRead, {}> {
  public constructor(db: Pool) {
    super(db, 'line_item');
  }

  public async create(
    data: LineItemCreate,
    client?: PoolClient,
  ): Promise<IdRecord> {
    const insertItem = toLineItemStorage(data);
    return this.createRecord(insertItem, client);
  }

  public async read(
    _id: number,
    _client?: PoolClient,
  ): Promise<LineItemRead | undefined> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(
    _id: number,
    _updates: {},
    _client?: PoolClient,
  ): Promise<CountRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async search(
    _searchParams: Record<string, number | string>,
    _client?: PoolClient,
  ): Promise<LineItemRead[]> {
    // TODO
    throw new Error('Not implemented');
  }
}
