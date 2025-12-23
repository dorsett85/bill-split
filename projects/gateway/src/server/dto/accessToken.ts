import { z } from 'zod';
import { type IdRecord, id } from './id.ts';

export const pin = z
  .string()
  .length(5)
  .regex(/^\d+$/, 'pin must be all numbers');

export const AccessTokenCreate = z.object({
  hashedToken: z.string(),
  encryptedToken: z.string(),
  initializationVector: z.string(),
  active: z.boolean(),
  noOfUses: z.number(),
});

export const AccessTokenReadStorage = z
  .object({
    id,
    hashed_token: AccessTokenCreate.shape.hashedToken,
    encrypted_token: AccessTokenCreate.shape.encryptedToken,
    initialization_vector: AccessTokenCreate.shape.initializationVector,
    active: AccessTokenCreate.shape.active,
    no_of_uses: AccessTokenCreate.shape.noOfUses,
    created_at: z.date(),
  })
  .strict();

export const AccessTokenUpdate = z.object({
  active: AccessTokenCreate.shape.active.optional(),
  noOfUses: AccessTokenCreate.shape.noOfUses.optional(),
});

export const AccessTokenSearch = z.object({
  hashedToken: z.string().optional(),
});

export const AccessTokenCreateRequest = z.object({
  pin,
});

export type AccessTokenCreate = z.infer<typeof AccessTokenCreate>;
export type AccessTokenRead = {
  [K in keyof AccessTokenCreate]: Exclude<AccessTokenCreate[K], null>;
} & IdRecord & { createdAt: Date };
export type AccessTokenUpdate = z.infer<typeof AccessTokenUpdate>;
export type AccessTokenSearch = z.infer<typeof AccessTokenSearch>;
export type AccessTokenCreateRequest = z.infer<typeof AccessTokenCreateRequest>;
export type AccessTokenReadStorage = z.infer<typeof AccessTokenReadStorage>;
export type AccessTokenResponse = Pick<
  AccessTokenRead,
  'active' | 'noOfUses' | 'createdAt'
> & {
  pin: string;
};

export const toAccessTokenStorage = (
  accessToken: AccessTokenCreate | AccessTokenUpdate | AccessTokenSearch,
) => ({
  hashed_token:
    'hashedToken' in accessToken ? accessToken.hashedToken : undefined,
  encrypted_token:
    'encryptedToken' in accessToken ? accessToken.encryptedToken : undefined,
  initialization_vector:
    'initializationVector' in accessToken
      ? accessToken.initializationVector
      : undefined,
  active: 'active' in accessToken ? accessToken.active : undefined,
  no_of_uses: 'noOfUses' in accessToken ? accessToken.noOfUses : undefined,
});

export const toAccessTokenRead = (
  accessToken: AccessTokenReadStorage,
): AccessTokenRead => ({
  id: accessToken.id,
  hashedToken: accessToken.hashed_token,
  encryptedToken: accessToken.encrypted_token,
  initializationVector: accessToken.initialization_vector,
  active: accessToken.active,
  noOfUses: accessToken.no_of_uses,
  createdAt: accessToken.created_at,
});
