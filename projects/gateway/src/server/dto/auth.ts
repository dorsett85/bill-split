import { z } from 'zod';

export const VerifyAccessRequest = z.object({
  accessPin: z.string(),
});
