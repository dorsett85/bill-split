import { z } from 'zod';
import { id } from './id.ts';

const LineItemCreate = z.object({
  billId: z.number(),
  name: z.string(),
  price: z.number(),
});

export const LineItemRead = LineItemCreate.extend({ id });

const LineItemCreateStorage = LineItemCreate.omit({ billId: true }).extend({
  bill_id: z.number(),
});

export const LineItemReadStorage = LineItemCreateStorage.extend({ id });

type LineItemCreate = z.infer<typeof LineItemCreate>;
type LineItemRead = z.infer<typeof LineItemRead>;
type LineItemCreateStorage = z.infer<typeof LineItemCreateStorage>;
export type LineItemReadStorage = z.infer<typeof LineItemReadStorage>;

export const mapToLineItemCreateStorage = (
  lineItem: LineItemCreate,
): LineItemCreateStorage =>
  LineItemCreateStorage.parse({
    ...lineItem,
    bill_id: lineItem.billId,
  });

export const mapToLineItemRead = (
  lineItem: LineItemReadStorage,
): LineItemRead =>
  LineItemRead.parse({
    ...lineItem,
    billId: lineItem.bill_id,
  });
