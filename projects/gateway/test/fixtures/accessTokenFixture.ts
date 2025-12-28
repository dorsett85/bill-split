import type { AccessTokenCreate } from '../../src/server/dto/accessToken.ts';

export const accessTokenCreateFixture = <T extends keyof AccessTokenCreate>(
  overrides?: Pick<AccessTokenCreate, T>,
): AccessTokenCreate => {
  const defaults: AccessTokenCreate = {
    hashedToken: 'hashed_token',
    encryptedToken: 'encrypted_token',
    initializationVector: 'iv',
    active: true,
    noOfUses: 0,
  };

  return { ...defaults, ...overrides };
};
