import * as z from 'zod';
import { IdRecord } from '../api/dto.ts';

export const BillCreateData = IdRecord.extend({
  signature: z.string(),
});

export const BillCreateResponse = z.object({
  data: BillCreateData,
});

export type BillCreateData = z.infer<typeof BillCreateData>;
export type BillCreateResponse = z.infer<typeof BillCreateResponse>;
