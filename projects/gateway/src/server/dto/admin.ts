import { z } from 'zod';

export const AdminPagePostRequest = z.object({
  authenticationCode: z.string(),
});
