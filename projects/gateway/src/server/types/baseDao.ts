import type { IdRecord } from '../dto/id.ts';

/**
 * Base data access object
 */
export interface BaseDao<R extends IdRecord> {
  /**
   * The data param should include all the data required to create a new record
   * which does not include the id as it gets assigned by the db.
   */
  create(data: Omit<R, 'id'>): Promise<IdRecord>;
  read(id: string): Promise<R>;
}
