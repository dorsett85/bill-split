import { z } from 'zod';
import { type IdRecord, id } from './id.ts';

export const LineItemCreate = z.object({
  billId: z.number(),
  name: z.string(),
  price: z.number(),
});

export const LineItemReadStorage = z
  .object({
    id,
    bill_id: LineItemCreate.shape.billId,
    name: LineItemCreate.shape.name,
    price: LineItemCreate.shape.price,
  })
  .strict();

export const LineItemUpdate = LineItemCreate.pick({
  name: true,
  price: true,
});

export const LineItemSearch = z.object({
  billId: z.preprocess((val) => Number(val), z.number()),
});

export type LineItemCreate = z.infer<typeof LineItemCreate>;
export type LineItemRead = {
  [K in keyof LineItemCreate]: Exclude<LineItemCreate[K], null>;
} & IdRecord;
export type LineItemReadStorage = z.infer<typeof LineItemReadStorage>;
export type LineItemUpdate = z.infer<typeof LineItemUpdate>;
export type LineItemSearch = z.infer<typeof LineItemSearch>;

export const toLineItemStorage = (
  lineItem: LineItemCreate | LineItemUpdate | LineItemSearch,
) => ({
  bill_id: 'billId' in lineItem ? lineItem.billId : undefined,
  name: 'name' in lineItem ? lineItem.name : undefined,
  price: 'price' in lineItem ? lineItem.price : undefined,
});

export const toLineItemRead = (
  lineItem: LineItemReadStorage,
): LineItemRead => ({
  id: lineItem.id,
  billId: lineItem.bill_id,
  name: lineItem.name,
  price: lineItem.price,
});
