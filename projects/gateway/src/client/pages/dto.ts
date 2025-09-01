import { z } from 'zod';

export const CreateBillResponse = z.object({
  data: z.object({
    id: z.number(),
  }),
});
