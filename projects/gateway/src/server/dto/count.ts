import { z } from 'zod';

export const count = z.number();

export const CountRecord = z.object({
  count,
});

export type CountRecord = z.infer<typeof CountRecord>;
