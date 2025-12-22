import { z } from 'zod';

export const AdminRequest = z.object({
  authenticationCode: z.string(),
});
