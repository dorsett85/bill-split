import type { Pool } from 'pg';
import type { IdRecord } from '../dto/id.ts';
import type {
  LineItemCreate,
  LineItemRead,
  LineItemUpdate,
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

  public async create(): Promise<IdRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async read(): Promise<LineItemRead | undefined> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(): Promise<IdRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async search(): Promise<LineItemRead[]> {
    // TODO
    throw new Error('Not implemented');
  }
}
