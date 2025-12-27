import type { Pool, PoolClient } from 'pg';
import type { CountRecord } from '../dto/count.ts';
import { IdRecord } from '../dto/id.ts';
import {
  type ParticipantLineItemCreate,
  type ParticipantLineItemRead,
  ParticipantLineItemReadStorage,
  type ParticipantLineItemSearch,
  type ParticipantLineItemUpdate,
  toParticipantLineItemRead,
  toParticipantLineItemStorage,
} from '../dto/participantLineItem.ts';
import { BaseDao } from '../types/baseDao.ts';

export class ParticipantLineItemDao extends BaseDao<
  ParticipantLineItemCreate,
  ParticipantLineItemRead,
  ParticipantLineItemUpdate
> {
  public constructor(db: Pool) {
    super(db, 'participant_line_item');
  }

  public async create(
    data: ParticipantLineItemCreate,
    client?: PoolClient,
  ): Promise<IdRecord> {
    const insertItem = toParticipantLineItemStorage(data);
    return this.createRecord(insertItem, client);
  }

  public async read(): Promise<ParticipantLineItemRead> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(): Promise<IdRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async search(
    searchParams: ParticipantLineItemSearch,
    client?: PoolClient,
  ): Promise<ParticipantLineItemRead[]> {
    const cols = ParticipantLineItemReadStorage.keyof().options;
    const lineItemSearch = toParticipantLineItemStorage(searchParams);

    const { rows } = await this.searchRecords(lineItemSearch, cols, client);
    return rows.map((row) =>
      ParticipantLineItemReadStorage.transform(toParticipantLineItemRead).parse(
        row,
      ),
    );
  }

  /**
   * This query gets all the records with a line item id that are associated
   * with a given line item id and participant id.
   */
  public async searchByRelatedLineItemIds(
    participantId: number,
    lineItemId: number,
    client?: PoolClient,
  ): Promise<ParticipantLineItemRead[]> {
    const { rows } = await (client ?? this.db).query(
      `
      SELECT pli2.*
      FROM ${this.tableName} pli
      JOIN participant_line_item pli2 ON pli.line_item_id = pli2.line_item_id
      WHERE pli.participant_id = $1 AND pli.line_item_id = $2
      `,
      [participantId, lineItemId],
    );

    return rows.map((row) =>
      ParticipantLineItemReadStorage.transform(toParticipantLineItemRead).parse(
        row,
      ),
    );
  }

  /**
   * Use this method to add a split amount to each record for a given list of
   * ids.
   */
  public async addOwesByIds(
    pct: number,
    ids: number[],
    client?: PoolClient,
  ): Promise<CountRecord> {
    const { rowCount } = await (client ?? this.db).query(
      `
      UPDATE participant_line_item pli SET pct_owes = pct_owes + $1
      WHERE pli.id = ANY ($2)
      `,
      [pct, ids],
    );

    return { count: rowCount ?? 0 };
  }

  /**
   * Update pct_owes for a given list of ids
   */
  public async updateOwesByIds(
    pct: number,
    ids: number[],
    client?: PoolClient,
  ): Promise<CountRecord> {
    const { rowCount } = await (client ?? this.db).query(
      `
        UPDATE participant_line_item pli SET pct_owes = $1
        WHERE pli.id = ANY ($2)
      `,
      [pct, ids],
    );

    return { count: rowCount ?? 0 };
  }

  /**
   * For a given bill id and participant id, find all the records of a line item
   * id that was matched by the bill and participant ids.
   */
  public async searchByLineItemIdUsingBillAndParticipant(
    billId: number,
    participantId: number,
    client?: PoolClient,
  ): Promise<ParticipantLineItemRead[]> {
    const { rows } = await (client ?? this.db).query(
      `
      SELECT pli2.* 
      FROM ${this.tableName} pli
      JOIN participant_line_item pli2 ON pli.line_item_id = pli2.line_item_id
      JOIN line_item li ON pli.line_item_id = li.id 
      JOIN bill b ON li.bill_id = b.id
      WHERE pli.participant_id = $1 AND b.id = $2
      `,
      [participantId, billId],
    );

    return rows.map((row) =>
      ParticipantLineItemReadStorage.transform(toParticipantLineItemRead).parse(
        row,
      ),
    );
  }

  public async deleteByParticipantAndLineItemIds(
    participantId: number,
    lineItemId: number,
    client?: PoolClient,
  ): Promise<IdRecord> {
    const { rows } = await (client ?? this.db).query(
      `
      DELETE FROM ${this.tableName}
      WHERE participant_id = $1 AND line_item_id = $2
      RETURNING id
      `,
      [participantId, lineItemId],
    );

    return IdRecord.parse(rows[0]);
  }
}
