import { z } from 'zod';

export const AdminData = z.object({
  authorized: z.boolean(),
  authenticationCode: z.string().optional(),
  authenticationError: z.string().optional(),
  pin: z.string().optional(),
  pinGenerated: z.boolean().optional(),
});

export type AdminData = z.infer<typeof AdminData>;
