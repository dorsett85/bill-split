import { z } from 'zod';

export const AccessToken = z.object({
  pin: z.string(),
  active: z.boolean(),
  noOfUses: z.number(),
  createdAt: z.coerce.date(),
});

export const AccessTokenResponse = z.object({
  data: z.object({
    accessTokens: z.array(AccessToken).optional(),
  }),
});

export const AdminData = z.object({
  accessTokens: z.array(AccessToken).optional(),
  authenticationCode: z.string().optional(),
  authenticationError: z.string().optional(),
});

export type AccessToken = z.infer<typeof AccessToken>;
export type AccessTokenResponse = z.infer<typeof AccessTokenResponse>;
export type AdminData = z.infer<typeof AdminData>;
