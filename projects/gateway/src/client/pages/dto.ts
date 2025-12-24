import * as z from 'zod';
import { createApiResponse, IdRecord } from '../api/dto.ts';

export const BillCreateResponse = createApiResponse(
  IdRecord.extend({
    signature: z.string(),
  }),
);

export type BillCreateResponse = z.infer<typeof BillCreateResponse>;
