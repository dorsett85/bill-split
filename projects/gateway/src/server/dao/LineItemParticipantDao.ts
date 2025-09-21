import type { Pool, PoolClient } from 'pg';
import type { CountRecord } from '../dto/count.ts';
import type { IdRecord } from '../dto/id.ts';
import {
  type LineItemParticipantCreate,
  type LineItemParticipantRead,
  LineItemParticipantReadStorage,
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
  ): Promise<IdRecord> {
    const itemsToInsert = toLineItemParticipantStorage(updates);
    return await this.updateRecord(id, itemsToInsert);
  }

  public async search(): Promise<LineItemParticipantRead[]> {
    // TODO
    throw new Error('Not implemented');
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

  public async searchByBillAndParticipant(
    billId: number,
    participantId: number,
    client?: PoolClient,
  ): Promise<LineItemParticipantRead[]> {
    const { rows } = await (client ?? this.db).query(
      `
      WITH line_item_ids AS (
        SELECT lip.line_item_id
        FROM line_item_participant lip
        WHERE lip.participant_id = $1
      )
      SELECT lip.* 
      FROM line_item_participant lip
      JOIN line_item li ON lip.line_item_id = li.id 
      JOIN bill b ON li.bill_id = b.id
      JOIN line_item_ids lii ON lip.line_item_id = lii.line_item_id 
      WHERE b.id = $2
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
