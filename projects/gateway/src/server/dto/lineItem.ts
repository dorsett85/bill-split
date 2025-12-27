import { z } from 'zod';
import type { IdRecord } from './id.ts';

export const LineItemCreate = z.object({
  billId: z.number(),
  name: z.string(),
  price: z.number(),
});

export const LineItemUpdate = LineItemCreate.pick({
  name: true,
  price: true,
});

export type LineItemCreate = z.infer<typeof LineItemCreate>;
export type LineItemRead = {
  [K in keyof LineItemCreate]: Exclude<LineItemCreate[K], null>;
} & IdRecord;
export type LineItemUpdate = z.infer<typeof LineItemUpdate>;
