import type { Pool, PoolClient } from 'pg';
import type { IdRecord } from '../dto/id.ts';
import {
  type ParticipantCreate,
  type ParticipantRead,
  ParticipantReadStorage,
  toParticipantRead,
  toParticipantStorage,
} from '../dto/participant.ts';
import { BaseDao } from '../types/baseDao.ts';

export class ParticipantDao extends BaseDao<
  ParticipantCreate,
  ParticipantRead,
  {}
> {
  public constructor(db: Pool) {
    super(db, 'participant');
  }

  public async create(
    participant: ParticipantCreate,
    client?: PoolClient,
  ): Promise<IdRecord> {
    const insertItem = toParticipantStorage(participant);
    return this.createRecord(insertItem, client);
  }

  public async read(): Promise<ParticipantRead> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(): Promise<IdRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async search(): Promise<ParticipantRead[]> {
    // TODO
    throw new Error('Not implemented');
  }

  public async searchByBillId(
    billId: number,
    client?: PoolClient,
  ): Promise<ParticipantRead[]> {
    const cols = ParticipantReadStorage.keyof()
      .options.map((col) => `${this.tableName}.${col}`)
      .join(',');

    const { rows } = await (client ?? this.db).query(
      `
        SELECT ${cols}
        FROM ${this.tableName}
        INNER JOIN bill_participant bp ON ${this.tableName}.id = bp.participant_id 
        WHERE bp.bill_id = $1
      `,
      [billId],
    );

    return rows.map((row) =>
      ParticipantReadStorage.transform(toParticipantRead).parse(row),
    );
  }

  public async nameAlreadyExistsByBillId(
    billId: number,
    name: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const { rowCount } = await (client ?? this.db).query(
      `
      SELECT ${this.tableName}.id
      FROM ${this.tableName}
      INNER JOIN bill_participant bp ON ${this.tableName}.id = bp.participant_id
      WHERE bp.bill_id = $1 and ${this.tableName}.name = $2
    `,
      [billId, name],
    );

    return !!rowCount;
  }
}
