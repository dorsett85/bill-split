import type { Pool, QueryResult } from 'pg';
import { IdRecord } from '../dto/id.ts';

type StorageValue = string | null | number;

type StorageRecord = Record<string, StorageValue>;

type StorageRecordWithUndefined = Record<string, StorageValue | undefined>;

/**
 * Base data access object
 */
export abstract class BaseDao<C, R extends IdRecord, U> {
  protected db: Pool;
  protected tableName: string;

  protected constructor(pool: Pool, tableName: string) {
    this.db = pool;
    this.tableName = tableName;
  }

  /**
   * The data param should include all the data required to create a new record
   * which does not include the id as it gets assigned by the db.
   */
  abstract create(data: C): Promise<IdRecord>;

  /**
   * Call this method inside the derived base class's create method to remove
   * undefined values and insert the remaining values into the table.
   */
  protected async createRecord(
    data: StorageRecordWithUndefined,
  ): Promise<IdRecord> {
    const storageData = this.stripUndefined(data);

    const keys: string[] = [];
    const values: StorageValue[] = [];
    const params: string[] = [];
    let paramCount = 1;
    for (const [key, value] of Object.entries(storageData)) {
      keys.push(key);
      values.push(value);
      params.push(`$${paramCount++}`);
    }

    const result = await this.db.query(
      `
      INSERT INTO ${this.tableName} (${keys.join(',')})
      VALUES (${params.join(',')})
      RETURNING id
      `,
      values,
    );

    return IdRecord.parse(result.rows[0]);
  }

  abstract read(id: number): Promise<R>;

  abstract update(id: number, updates: U): Promise<IdRecord>;

  abstract search(searchParams: Record<string, number | string>): Promise<R[]>;

  protected async updateRecord(
    id: number,
    data: StorageRecordWithUndefined,
  ): Promise<IdRecord> {
    const dbData = this.stripUndefined(data);

    const keys: string[] = [];
    const values: StorageValue[] = [];
    let paramCount = 1;
    for (const [key, value] of Object.entries(dbData)) {
      keys.push(`${key} = $${paramCount++}`);
      values.push(value);
    }

    const result = await this.db.query(
      `
      UPDATE ${this.tableName} set ${keys.join(',')}
      WHERE id = $${paramCount++}
      RETURNING id
      `,
      [...values, id],
    );

    return IdRecord.parse(result.rows[0]);
  }

  protected async searchRecords(
    searchParams: Record<string, string | number | undefined>,
    cols: string[],
  ): Promise<QueryResult> {
    const dbParams = this.stripUndefined(searchParams);
    const values = Object.values(dbParams);
    const params = Object.keys(dbParams)
      .map((param, i) => `${param} = $${i + 1}`)
      .join(' AND ');

    return await this.db.query(
      `
      SELECT ${cols.join(',')}
      FROM ${this.tableName}
      where ${params}
      `,
      [values],
    );
  }

  private stripUndefined(data: StorageRecordWithUndefined): StorageRecord {
    const values: StorageRecord = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      values[key] = value;
    }
    return values;
  }
}
