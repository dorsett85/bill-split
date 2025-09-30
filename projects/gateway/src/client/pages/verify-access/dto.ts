import { z } from 'zod';

export const VerifyAccessData = z.object({
  error: z.string().optional(),
});

export type VerifyAccessData = z.infer<typeof VerifyAccessData>;
