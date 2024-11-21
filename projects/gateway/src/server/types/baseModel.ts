import { QueryResult } from 'pg';

/**
 * Base model for entity persistence layer
 */
export interface BaseModel<T> {
  save(data: T): Promise<QueryResult>;
}
