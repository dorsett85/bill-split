import { QueryResult, QueryResultRow } from 'pg';

/**
 * Base model for entity persistence layer
 */
export interface BaseModel<R extends QueryResultRow> {
  /**
   * The data param should include all the data required to create a new record
   * which does not include the id as it gets assigned by the db.
   */
  create(data: Omit<R, 'id'>): Promise<QueryResult<{ id: number }>>;
  read(id: string): Promise<QueryResult<R>>;
}
