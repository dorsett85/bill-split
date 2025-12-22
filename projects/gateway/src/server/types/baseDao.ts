import type { Pool, PoolClient, QueryResult } from 'pg';
import { IdRecord } from '../dto/id.ts';

type StorageValue = string | null | number | boolean;

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
  abstract create(data: C, client?: PoolClient): Promise<IdRecord>;

  abstract read(id: number, client?: PoolClient): Promise<R>;

  abstract update(id: number, updates: U): Promise<IdRecord>;

  public async delete(id: number, client?: PoolClient): Promise<IdRecord> {
    const { rows } = await (client ?? this.db).query(
      `
      DELETE FROM ${this.tableName}
      WHERE id = $1
      RETURNING id
      `,
      [id],
    );

    return IdRecord.parse(rows[0]);
  }

  abstract search(
    searchParams: Record<string, number | string>,
    client?: PoolClient,
  ): Promise<R[]>;

  /**
   * Use this method for all transactions. Any queries inside the transaction
   * callback MUST use the client arg passed to the callback!
   */
  public async tx<TReturn>(
    transaction: (client: PoolClient) => Promise<TReturn> | TReturn,
  ): Promise<TReturn> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const res = await transaction(client);
      await client.query('COMMIT');
      return res;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Call this method inside the derived base class's create method to remove
   * undefined values and insert the remaining values into the table.
   */
  protected async createRecord(
    data: StorageRecordWithUndefined,
    client?: PoolClient,
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

    const { rows } = await (client ?? this.db).query(
      `
      INSERT INTO ${this.tableName} (${keys.join(',')})
      VALUES (${params.join(',')})
      RETURNING id
      `,
      values,
    );

    return IdRecord.parse(rows[0]);
  }

  protected async updateRecord(
    id: number,
    data: StorageRecordWithUndefined,
    client?: PoolClient,
  ): Promise<IdRecord> {
    const dbData = this.stripUndefined(data);

    const keys: string[] = [];
    const values: StorageValue[] = [];
    let paramCount = 1;
    for (const [key, value] of Object.entries(dbData)) {
      keys.push(`${key} = $${paramCount++}`);
      values.push(value);
    }

    const result = await (client ?? this.db).query(
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
    searchParams: Record<string, string | number | boolean | undefined>,
    cols: string[],
    client?: PoolClient,
  ): Promise<QueryResult> {
    const dbParams = this.stripUndefined(searchParams);
    const values = Object.values(dbParams);
    const params = Object.keys(dbParams)
      .map((param, i) => `${param} = $${i + 1}`)
      .join(' AND ');

    return await (client ?? this.db).query(
      `
      SELECT ${cols.join(',')}
      FROM ${this.tableName}
      ${params.length ? `WHERE ${params}` : ''}
      `,
      values,
    );
  }

  /**
   * Utility to filter out all values from an object that are undefined since
   * undefined will get stored in the data as null, but we don't want to treat
   * missing data as the user wanting to override an existing value.
   */
  protected stripUndefined(data: StorageRecordWithUndefined): StorageRecord {
    const values: StorageRecord = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      values[key] = value;
    }
    return values;
  }
}
