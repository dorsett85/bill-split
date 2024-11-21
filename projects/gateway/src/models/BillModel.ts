import { Pool } from 'pg';
import { BaseModel } from '../server/types/baseModel.ts';

export interface Bill {
  id: number;
  business_name?: string;
  business_location?: string;
  gratuity?: number;
  image_path?: string;
  name?: string;
  tax?: number;
}

export type BillSave = Omit<Bill, 'id'>;

export class BillModel implements BaseModel<Bill> {
  private db: Pool;

  constructor(pool: Pool) {
    this.db = pool;
  }

  public save(bill: BillSave) {
    return this.db.query(
      `
      INSERT INTO bill (business_name, business_location, gratuity, image_path, name, tax)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
      [
        bill.business_name,
        bill.business_location,
        bill.gratuity,
        bill.image_path,
        bill.name,
        bill.tax,
      ],
    );
  }
}
