import type { Pool, PoolClient } from 'pg';
import type { CountRecord } from '../dto/count.ts';
import type { IdRecord } from '../dto/id.ts';
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

  public async update(
    id: number,
    updates: LineItemParticipantUpdate,
    client?: PoolClient,
  ): Promise<IdRecord> {
    const itemsToInsert = toLineItemParticipantStorage(updates);
    return await this.updateRecord(id, itemsToInsert, client);
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

  public async searchByBillId(
    billId: number,
    client?: PoolClient,
  ): Promise<LineItemParticipantRead[]> {
    const { rows } = await (client ?? this.db).query(
      `
      SELECT lip.*
      FROM ${this.tableName} lip
      JOIN line_item li ON lip.line_item_id = li.id
      WHERE li.bill_id = $1
      `,
      [billId],
    );

    return rows.map((row) =>
      LineItemParticipantReadStorage.transform(toLineItemParticipantRead).parse(
        row,
      ),
    );
  }

  /**
   * This query gets all the records from a line item id that are associated
   * with an id (pk).
   */
  public async searchByLineItemIdAssociatedWithPk(
    pk: number,
    client?: PoolClient,
  ): Promise<LineItemParticipantRead[]> {
    const { rows } = await (client ?? this.db).query(
      `
      SELECT lip.*
      FROM ${this.tableName} lip
      LEFT JOIN line_item li ON lip.line_item_id = li.id
      WHERE lip.id = $1
      `,
      [pk],
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
  public async addOwesAcrossIds(
    pct: number,
    ids: number[],
    client?: PoolClient,
  ): Promise<CountRecord> {
    // Divide the pct by the total number of ids to evenly distribute.
    const splitPct = pct / ids.length;
    const { rowCount } = await (client ?? this.db).query(
      `
      UPDATE line_item_participant lip SET pct_owes = pct_owes + $1
      WHERE lip.id in $2
      `,
      [splitPct, ids],
    );

    return { count: rowCount ?? 0 };
  }

  public async searchByLineItemIdUsingBillAndParticipant(
    billId: number,
    participantId: number,
    client?: PoolClient,
  ): Promise<LineItemParticipantRead[]> {
    const { rows } = await (client ?? this.db).query(
      `
      SELECT lip.* 
      FROM line_item_participant lip
      LEFT JOIN line_item li ON lip.line_item_id = li.id 
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
}
