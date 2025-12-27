import type { Pool, PoolClient } from 'pg';
import type { CountRecord } from '../dto/count.ts';
import { IdRecord } from '../dto/id.ts';
import {
  type LineItemParticipantCreate,
  type LineItemParticipantRead,
  LineItemParticipantReadStorage,
  type LineItemParticipantSearch,
  type LineItemParticipantUpdate,
  toLineItemParticipantRead,
  toLineItemParticipantStorage,
} from '../dto/lineItemParticipant.ts';
import { BaseDao } from '../types/baseDao.ts';

export class LineItemParticipantDao extends BaseDao<
  LineItemParticipantCreate,
  LineItemParticipantRead,
  LineItemParticipantUpdate
> {
  public constructor(db: Pool) {
    super(db, 'line_item_participant');
  }

  public async create(
    data: LineItemParticipantCreate,
    client?: PoolClient,
  ): Promise<IdRecord> {
    const insertItem = toLineItemParticipantStorage(data);
    return this.createRecord(insertItem, client);
  }

  public async read(): Promise<LineItemParticipantRead> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(): Promise<IdRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async search(
    searchParams: LineItemParticipantSearch,
    client?: PoolClient,
  ): Promise<LineItemParticipantRead[]> {
    const cols = LineItemParticipantReadStorage.keyof().options;
    const lineItemSearch = toLineItemParticipantStorage(searchParams);

    const { rows } = await this.searchRecords(lineItemSearch, cols, client);
    return rows.map((row) =>
      LineItemParticipantReadStorage.transform(toLineItemParticipantRead).parse(
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
  ): Promise<LineItemParticipantRead[]> {
    const { rows } = await (client ?? this.db).query(
      `
      SELECT lip2.*
      FROM ${this.tableName} lip
      JOIN line_item_participant lip2 ON lip.line_item_id = lip2.line_item_id
      WHERE lip.participant_id = $1 AND lip.line_item_id = $2
      `,
      [participantId, lineItemId],
    );

    return rows.map((row) =>
      LineItemParticipantReadStorage.transform(toLineItemParticipantRead).parse(
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
      UPDATE line_item_participant lip SET pct_owes = pct_owes + $1
      WHERE lip.id = ANY ($2)
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
        UPDATE line_item_participant lip SET pct_owes = $1
        WHERE lip.id = ANY ($2)
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
  ): Promise<LineItemParticipantRead[]> {
    const { rows } = await (client ?? this.db).query(
      `
      SELECT lip2.* 
      FROM ${this.tableName} lip
      JOIN line_item_participant lip2 ON lip.line_item_id = lip2.line_item_id
      JOIN line_item li ON lip.line_item_id = li.id 
      JOIN bill b ON li.bill_id = b.id
      WHERE lip.participant_id = $1 AND b.id = $2
      `,
      [participantId, billId],
    );

    return rows.map((row) =>
      LineItemParticipantReadStorage.transform(toLineItemParticipantRead).parse(
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
