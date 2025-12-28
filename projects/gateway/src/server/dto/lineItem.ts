import { z } from 'zod';
import type { IdRecord } from './id.ts';

export const LineItemCreate = z.object({
  billId: z.number(),
  name: z.string(),
  price: z.number(),
});

export type LineItemCreate = z.infer<typeof LineItemCreate>;
export type LineItemRead = {
  [K in keyof LineItemCreate]: Exclude<LineItemCreate[K], null>;
} & IdRecord;

export const toLineItemStorage = (data: LineItemCreate) => ({
  bill_id: 'billId' in data ? data.billId : undefined,
  name: data.name,
  price: data.price,
});
