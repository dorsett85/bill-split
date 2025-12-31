import type { Pool, PoolClient } from 'pg';
import type { CountRecord } from '../dto/count.ts';
import type { IdRecord } from '../dto/id.ts';
import {
  type ParticipantLineItemCreate,
  type ParticipantLineItemRead,
  type ParticipantLineItemUpdate,
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
    _data: ParticipantLineItemCreate,
    _client?: PoolClient,
  ): Promise<IdRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async read(
    _id: number,
    _client?: PoolClient,
  ): Promise<ParticipantLineItemRead | undefined> {
    // TODO
    throw new Error('Not implemented');
  }

  public async update(
    _id: number,
    _updates: ParticipantLineItemUpdate,
    _client?: PoolClient,
  ): Promise<CountRecord> {
    // TODO
    throw new Error('Not implemented');
  }

  public async updateBySearch(
    search: { participantId: number; lineItemId: number },
    update: ParticipantLineItemUpdate,
    client?: PoolClient,
  ): Promise<CountRecord> {
    const toUpdate = toParticipantLineItemStorage(update);
    return this.updateRecordBySearch(
      {
        participant_id: search.participantId,
        line_item_id: search.lineItemId,
      },
      toUpdate,
      client,
    );
  }

  public async search(
    _searchParams: Record<string, number | string>,
    _client?: PoolClient,
  ): Promise<ParticipantLineItemRead[]> {
    // TODO
    throw new Error('Not implemented');
  }

  /**
   * For a given participant and bill, redistributes pct_owes and deletes the
   * participant from ALL associated line items.
   */
  public async deleteByParticipantIdAndRebalance(
    participantId: number,
    billId: number,
    client?: PoolClient,
  ): Promise<CountRecord> {
    const result = await (client ?? this.db).query(
      `
      WITH target_line_items AS (
          SELECT li.id
          FROM line_item li
          JOIN participant_line_item pli ON li.id = pli.line_item_id
          WHERE li.bill_id = $2 AND pli.participant_id = $1
      ),
      remaining_counts AS (
          SELECT pli.line_item_id, COUNT(*) - 1 as total_remaining
          FROM participant_line_item pli
          JOIN target_line_items tli ON pli.line_item_id = tli.id
          GROUP BY pli.line_item_id
          HAVING COUNT(*) > 1
      ),
      update_remaining AS (
          UPDATE participant_line_item pli
          SET pct_owes = 100.0 / rc.total_remaining
          FROM remaining_counts rc
          WHERE pli.line_item_id = rc.line_item_id
            AND pli.participant_id != $1
          RETURNING pli.line_item_id
      )
      DELETE FROM participant_line_item pli
      WHERE pli.participant_id = $1
        AND EXISTS (
          SELECT 1 FROM target_line_items tli
          WHERE tli.id = pli.line_item_id
        )
      `,
      [participantId, billId],
    );

    return { count: result.rowCount ?? 0 };
  }

  /**
   * Adds a participant to a line item and rebalances everyone's pct_owes to
   * be equal (100 / total_participants).
   */
  public async createByLineItemIdAndRebalance(
    participantId: number,
    lineItemId: number,
    client?: PoolClient,
  ): Promise<CountRecord> {
    // 1. Count existing participants
    // 2. Insert new participant with correct pct_owes
    // 3. Update existing participants with correct pct_owes
    const result = await (client ?? this.db).query(
      `
      WITH count_existing AS (
          SELECT COUNT(*) as existing_count
          FROM ${this.tableName}
          WHERE line_item_id = $2
      ),
      update_existing AS (
          UPDATE ${this.tableName} pli
          SET pct_owes = 100.0 / (ce.existing_count + 1)
          FROM count_existing ce
          WHERE pli.line_item_id = $2
          RETURNING pli.id
      )
      INSERT INTO ${this.tableName} (participant_id, line_item_id, pct_owes)
      SELECT $1, $2, 100.0 / (ce.existing_count + 1)
      FROM count_existing ce
      `,
      [participantId, lineItemId],
    );

    return { count: result.rowCount ?? 0 };
  }

  /**
   * Redistributes pct_owes from a participant being removed to the remaining
   * participants for the SPECIFIED line item, and then deletes the participant
   * from those line items.
   */
  public async deleteByLineItemIdsAndRebalance(
    participantId: number,
    lineItemIds: number[],
    client?: PoolClient,
  ): Promise<CountRecord> {
    const result = await (client ?? this.db).query(
      `
      WITH remaining_counts AS (
          SELECT line_item_id, COUNT(*) - 1 as total_remaining
          FROM participant_line_item
          WHERE line_item_id = ANY($2)
          GROUP BY line_item_id
          HAVING COUNT(*) > 1
      ),
      update_remaining AS (
          UPDATE participant_line_item pli
          SET pct_owes = 100.0 / rc.total_remaining
          FROM remaining_counts rc
          WHERE pli.line_item_id = rc.line_item_id
            AND pli.participant_id != $1
          RETURNING pli.line_item_id
      )
      DELETE FROM participant_line_item
      WHERE participant_id = $1 AND line_item_id = ANY($2)
      `,
      [participantId, lineItemIds],
    );

    return { count: result.rowCount ?? 0 };
  }
}
