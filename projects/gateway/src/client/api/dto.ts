import { z } from 'zod';

export const IdResponse = z.object({
  data: z.object({
    id: z.number(),
  }),
});

export const SuccessResponse = z.object({
  data: z.object({
    success: z.boolean(),
  }),
});

export const ErrorResponse = z.object({
  error: z.object({
    message: z.string(),
  }),
});

export type SuccessResponse = z.infer<typeof SuccessResponse>;
export type IdResponse = z.infer<typeof IdResponse>;
