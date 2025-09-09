import { z } from 'zod';
import { id } from './id.ts';

const LineItemCreate = z.object({
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

export type LineItemReadStorage = z.infer<typeof LineItemReadStorage>;
