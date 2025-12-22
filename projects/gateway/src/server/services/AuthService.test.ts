import type { Pool } from 'pg';
import { describe, expect, it } from 'vitest';
import { AccessTokenDao } from '../dao/AccessTokenDao.ts';
import { AuthService, type AuthServiceConstructor } from './AuthService.ts';

const getAuthService = <K extends keyof AuthServiceConstructor>(
  args?: Pick<AuthServiceConstructor, K>,
) => {
  const SECRET_KEY = 'SECRET_KEY';
  return new AuthService({
    accessTokenDao: new AccessTokenDao({} as Pool),
    adminPassword: '',
    secretKey: SECRET_KEY,
    ...args,
  });
};

describe('AuthService', () => {
  it('signs/verifies admin token', async () => {
    const ADMIN_PASSWORD = 'password';
    const authService = getAuthService({ adminPassword: ADMIN_PASSWORD });
    const token = authService.signAdminToken(ADMIN_PASSWORD);

    expect(authService.verifyAdminToken(token ?? '')).toBe(true);
  });

  it('signs/verifies bill access token', async () => {
    const BILL_ID = 11111;
    const authService = getAuthService();
    const billAccessToken = authService.signBillAccessToken(BILL_ID);

    expect(authService.verifyBillAccessToken(billAccessToken, BILL_ID)).toBe(
      true,
    );
  });

  it('signs/verifies bill access hmac', () => {
    const billId = 1;
    const authService = getAuthService();

    const hmac = authService.signBillAccessHmac(billId);

    expect(authService.verifyBillAccessHmac(hmac, billId)).toBe(true);
  });
});
