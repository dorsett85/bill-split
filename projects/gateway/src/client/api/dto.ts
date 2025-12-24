import { z } from 'zod';

const ApiError = z.object({
  error: z.object({
    message: z.string(),
  }),
});

/**
 * Factory method for creating api response schemas
 */
export const createApiResponse = <T extends z.ZodObject>(dataSchema: T) => {
  const DataSchema = z.object({
    data: dataSchema,
  });

  return z.union([DataSchema, ApiError]);
};

const id = z.number();

export const IdRecord = z.object({
  id,
});

export const IdResponse = createApiResponse(IdRecord);

export const SuccessResponse = createApiResponse(
  z.object({
    success: z.boolean(),
  }),
);

export type SuccessResponse = z.infer<typeof SuccessResponse>;
export type IdResponse = z.infer<typeof IdResponse>;
