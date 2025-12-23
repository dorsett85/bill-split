import { z } from 'zod';

export const ErrorPageData = z.object({
  statusCode: z.number(),
  message: z.string(),
});

export type ErrorPageData = z.infer<typeof ErrorPageData>;
