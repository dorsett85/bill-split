import type { Pool, PoolClient } from 'pg';
import {
  type BillCreate,
  type BillRead,
  type BillReadDetailed,
  BillReadDetailedStorage,
  BillReadStorage,
  type BillUpdate,
  toBillRead,
  toBillReadDetailed,
  toBillStorage,
} from '../dto/bill.ts';
import type { IdRecord } from '../dto/id.ts';
import { BaseDao } from '../types/baseDao.ts';

export class BillDao extends BaseDao<BillCreate, BillRead, BillUpdate> {
  public constructor(db: Pool) {
    super(db, 'bill');
  }

  public async create(bill: BillCreate): Promise<IdRecord> {
    const billToInsert = toBillStorage(bill);
    return this.createRecord(billToInsert);
  }

  public async read(
    id: number,
    client?: PoolClient,
  ): Promise<BillRead | undefined> {
    const cols = BillReadStorage.keyof().options.join(',');

    const result = await (client ?? this.db).query(
      `
      SELECT ${cols}
      FROM ${this.tableName}
      WHERE id = $1
      `,
      [id],
    );

    const record = result.rows[0];

    if (!record) {
      return undefined;
    }

    return BillReadStorage.transform(toBillRead).parse(record);
  }

  public async update(id: number, billUpdates: BillUpdate): Promise<IdRecord> {
    const billToUpdate = toBillStorage(billUpdates);
    return this.updateRecord(id, billToUpdate);
  }

  /**
   * Powerhouse query that calculates what all participants owe and which
   * participants are associated with each line item. This will get called
   * everytime there's a select/deselect of an item and when a participant is
   * removed. We'll want to keep track of this query performance.
   */
  public async readDetailed(
    id: number,
    client?: PoolClient,
  ): Promise<BillReadDetailed | undefined> {
    const { rows } = await (client ?? this.db).query(
      `
      WITH bill_stats AS (
        -- Step 1: Get base bill info and calculate total subtotal
        SELECT 
            b.*,
            COALESCE(SUM(li.price), 0) as raw_subtotal
        FROM bill b
        LEFT JOIN line_item li ON b.id = li.bill_id
        WHERE b.id = $1
        GROUP BY b.id
      ),
      participant_shares AS (
        -- Step 2: Calculate the individual subtotal for each participant
        -- We use bill_stats here to ensure we only look at items for this specific bill
        SELECT 
            p.id as participant_id,
            SUM(li.price * (lip.pct_owes / 100)) as individual_raw_subtotal
        FROM participant p
        JOIN bill_participant bp ON p.id = bp.participant_id
        LEFT JOIN line_item_participant lip ON p.id = lip.participant_id
        LEFT JOIN line_item li ON lip.line_item_id = li.id AND li.bill_id = bp.bill_id
        WHERE bp.bill_id = $1
        GROUP BY p.id
      )
      SELECT 
          bs.id,
          bs.business_location,
          bs.business_name,
          bs.gratuity,
          bs.image_path,
          bs.image_status,
          bs.name,
          bs.tax,
          bs.discount,
          bs.created_at,
          -- Calculate subtotal (after discount) and total
          (bs.raw_subtotal - COALESCE(bs.discount, 0)) as sub_total,
          (bs.raw_subtotal - COALESCE(bs.discount, 0) + COALESCE(bs.tax, 0) + COALESCE(bs.gratuity, 0)) as total,
          -- Aggregate line items with their participant claims
          (
              SELECT json_agg(li_with_claims)
              FROM (
                  SELECT 
                      li.*,
                      COALESCE(
                        (
                          SELECT json_agg(lip.participant_id)
                          FROM line_item_participant lip
                          WHERE lip.line_item_id = li.id
                        ),
                        '[]'::json
                      ) as participant_ids
                  FROM line_item li
                  WHERE li.bill_id = bs.id
                  ORDER BY li.id
              ) li_with_claims
          ) as line_items,
          -- Aggregate participants with their individual claims and calculated 'owes'
          (
              SELECT json_agg(p_final)
              FROM (
                  SELECT 
                      p.id,
                      p.name,
                      COALESCE(
                        (
                          SELECT json_agg(lip_nested)
                          FROM (
                            SELECT lip.id, lip.line_item_id
                            FROM line_item_participant lip
                            WHERE lip.participant_id = p.id
                            AND EXISTS (SELECT 1 FROM line_item li WHERE li.id = lip.line_item_id AND li.bill_id = bs.id)
                            ORDER BY lip.line_item_id
                          ) lip_nested
                        ),
                        '[]'::json
                      ) as line_item_participants,
                      -- Calculate 'owes' using the same logic as calculateBill.ts
                      COALESCE(
                        (
                          SELECT 
                            CASE 
                              WHEN bs.raw_subtotal > 0 THEN
                                -- (individual_raw_subtotal * (1 - discountPct)) + taxShare + gratuityShare
                                (ps.individual_raw_subtotal * (1 - (COALESCE(bs.discount, 0) / bs.raw_subtotal))) +
                                ((ps.individual_raw_subtotal / bs.raw_subtotal) * COALESCE(bs.tax, 0)) +
                                ((ps.individual_raw_subtotal / bs.raw_subtotal) * COALESCE(bs.gratuity, 0))
                              ELSE 0
                            END
                          FROM participant_shares ps
                          WHERE ps.participant_id = p.id
                        ),
                        0
                      ) as owes
                  FROM participant p
                  JOIN bill_participant bp ON p.id = bp.participant_id
                  WHERE bp.bill_id = bs.id
                  ORDER BY p.id
              ) p_final
          ) as participants
      FROM bill_stats bs;
      `,
      [id],
    );

    const record = rows[0];

    if (!record) {
      return undefined;
    }

    return BillReadDetailedStorage.transform(toBillReadDetailed).parse(record);
  }

  public async search(): Promise<BillRead[]> {
    // TODO
    throw new Error('Not implemented');
  }
}
