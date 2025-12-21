import { describe, expect, it } from 'vitest';
import { AuthService, type AuthServiceConstructor } from './AuthService.ts';

const getAuthService = <K extends keyof AuthServiceConstructor>(
  args?: Pick<AuthServiceConstructor, K>,
) => {
  const SECRET_KEY = 'SECRET_KEY';
  return new AuthService({
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

  it('signs/verifies create bill token', async () => {
    const ADMIN_PASSWORD = 'password';
    const PIN = '11111';
    const authService = getAuthService({ adminPassword: ADMIN_PASSWORD });
    const token = authService.signAdminToken(ADMIN_PASSWORD);
    authService.generatePin(PIN, token ?? '');
    const createBillToken = authService.signCreateBillToken(PIN);

    expect(authService.verifyCreateBillToken(createBillToken ?? '')).toBe(true);
  });

  it('generates a pin', async () => {
    const ADMIN_PASSWORD = 'password';
    const PIN = '11111';
    const authService = getAuthService({ adminPassword: ADMIN_PASSWORD });
    const token = authService.signAdminToken(ADMIN_PASSWORD);

    expect(authService.generatePin(PIN, token ?? '')).toBe(true);
  });

  it('signs/verifies bill access hmac', () => {
    const billId = 1;
    const authService = getAuthService();

    const hmac = authService.signBillAccessHmac(billId);

    expect(authService.verifyBillAccessHmac(hmac, billId)).toBe(true);
  });
});
