import { z } from 'zod';
import { createApiResponse } from '../../api/dto.ts';

export const AccessToken = z.object({
  pin: z.string(),
  active: z.boolean(),
  noOfUses: z.number(),
  createdAt: z.coerce.date(),
});

export const AccessTokenApiResponse = createApiResponse(
  z.object({
    accessTokens: z.array(AccessToken),
  }),
);

export const AdminData = z.object({
  accessTokens: z.array(AccessToken).optional(),
  authenticationCode: z.string().optional(),
  authenticationError: z.string().optional(),
});

export type AccessToken = z.infer<typeof AccessToken>;
export type AccessTokenApiResponse = z.infer<typeof AccessTokenApiResponse>;
export type AdminData = z.infer<typeof AdminData>;
