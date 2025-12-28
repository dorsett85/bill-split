import type { Pool, PoolClient } from 'pg';
import {
  type AccessTokenCreate,
  type AccessTokenRead,
  AccessTokenReadStorage,
  type AccessTokenSearch,
  type AccessTokenUpdate,
  toAccessTokenRead,
  toAccessTokenStorage,
} from '../dto/accessToken.ts';
import type { CountRecord } from '../dto/count.ts';
import type { IdRecord } from '../dto/id.ts';
import { BaseDao } from '../types/baseDao.ts';

export class AccessTokenDao extends BaseDao<
  AccessTokenCreate,
  AccessTokenRead,
  AccessTokenUpdate
> {
  public constructor(db: Pool) {
    super(db, 'access_token');
  }

  public async create(
    accessToken: AccessTokenCreate,
    client?: PoolClient,
  ): Promise<IdRecord> {
    const insertItem = toAccessTokenStorage(accessToken);
    return this.createRecord(insertItem, client);
  }

  public async read(
    _id: number,
    _client?: PoolClient,
  ): Promise<AccessTokenRead | undefined> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(
    id: number,
    update: AccessTokenUpdate,
    client?: PoolClient,
  ): Promise<CountRecord> {
    const dbUpdates = toAccessTokenStorage(update);
    return this.updateRecord(id, dbUpdates, client);
  }

  public async search(
    searchParams: AccessTokenSearch,
    client?: PoolClient,
  ): Promise<AccessTokenRead[]> {
    const cols = AccessTokenReadStorage.keyof().options;
    const search = toAccessTokenStorage(searchParams);

    const { rows } = await this.searchRecords(search, cols, client);
    return rows.map((row) =>
      AccessTokenReadStorage.transform(toAccessTokenRead).parse(row),
    );
  }
}
