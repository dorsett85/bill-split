import { Pool, QueryResult } from 'pg';
import { BaseModel } from '../types/baseModel.ts';

export interface Bill {
  id: number;
  business_name?: string;
  business_location?: string;
  gratuity?: number;
  image_path: string;
  image_status: 'parsing' | 'ready' | 'error';
  name?: string;
  tax?: number;
}

export type BillCreate = Omit<Bill, 'id'>;

export class BillModel implements BaseModel<Bill> {
  private db: Pool;

  constructor(pool: Pool) {
    this.db = pool;
  }

  public create(bill: BillCreate) {
    return this.db.query(
      `
      INSERT INTO bill (business_name, business_location, gratuity, image_path, image_status, name, tax)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
      [
        bill.business_name,
        bill.business_location,
        bill.gratuity,
        bill.image_path,
        bill.image_status,
        bill.name,
        bill.tax,
      ],
    );
  }

  public read(id: string): Promise<QueryResult<Bill>> {
    return this.db.query(
      `
      SELECT
          id,
          business_name,
          business_location,
          gratuity,
          image_path,
          image_status,
          name,
          tax
      FROM bill
      WHERE id = $1
    `,
      [id],
    );
  }
}
