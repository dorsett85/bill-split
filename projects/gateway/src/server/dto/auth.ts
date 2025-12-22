import { z } from 'zod';

export const VerifyAccessRequest = z.object({
  pin: z.string(),
});
