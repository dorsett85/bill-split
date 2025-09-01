import { z } from 'zod';

export const id = z.number();

export const IdRecord = z.object({
  id,
});

export type IdRecord = z.infer<typeof IdRecord>;
