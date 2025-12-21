import { createHmac, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const AuthTokenPayload = z.object({
  admin: z.boolean().optional(),
  /**
   * Whether the token can create a new bill
   */
  createBill: z.boolean().optional(),
  /**
   * The bill ids that the token has access to
   */
  billAccessIds: z.array(z.number()).optional(),
});

type AuthTokenPayload = z.infer<typeof AuthTokenPayload>;

export interface AuthServiceConstructor {
  /** Password required to gain admin access */
  adminPassword: string;
  /** Secret key to sign tokens */
  secretKey: string;
}

export class AuthService {
  /**
   * Key/value pairs with keys as the pin and values as the expiration
   * TODO create persistent storage for these.
   */
  private static accessPins: Record<string, Date> = {};
  private readonly adminPassword: string;
  private readonly secretKey: string;
  /**
   * Access expiration in milliseconds
   */
  private accessExpiration = 24 * 60 * 60 * 1000;

  public constructor({ adminPassword, secretKey }: AuthServiceConstructor) {
    if (!secretKey) {
      throw new Error('Secret key must not be empty');
    }
    this.adminPassword = adminPassword;
    this.secretKey = secretKey;
  }

  private signToken<K extends keyof AuthTokenPayload>(
    payload: Pick<AuthTokenPayload, K>,
    // expiresIn expressed in seconds
    expiresIn = this.accessExpiration / 1000,
  ): string {
    const authTokenPayload: AuthTokenPayload = {
      billAccessIds: [],
      ...payload,
    };
    return jwt.sign(authTokenPayload, this.secretKey, {
      expiresIn,
    });
  }

  private verifyToken(token: string): null | AuthTokenPayload {
    try {
      const payload = jwt.verify(token, this.secretKey);
      return typeof payload === 'string'
        ? null
        : AuthTokenPayload.parse(payload);
    } catch {
      return null;
    }
  }

  public verifyAdminToken(token: string): boolean {
    const payload = this.verifyToken(token);
    return !!payload?.admin;
  }

  public verifyCreateBillToken(token: string): boolean {
    const payload = this.verifyToken(token);
    return !!payload?.createBill || !!payload?.admin;
  }

  public verifyBillAccessToken(token: string, billId: number): boolean {
    const payload = this.verifyToken(token);
    return !!payload?.billAccessIds?.includes(billId) || !payload?.admin;
  }

  /**
   * Only admins can generate pins
   */
  public generatePin(pin: string, sessionToken?: string): boolean {
    if (!sessionToken || !this.verifyAdminToken(sessionToken)) {
      return false;
    }

    const pinExpirationDate = new Date();
    // We'll expire the pin in 10 minutes
    pinExpirationDate.setMinutes(pinExpirationDate.getMinutes() + 10);

    AuthService.accessPins[pin] = pinExpirationDate;

    return true;
  }

  public signAdminToken(code: string, sessionToken?: string): string | null {
    if (code !== this.adminPassword) {
      return null;
    }

    const payload = sessionToken ? this.verifyToken(sessionToken) : null;

    // Seven day expiration
    return this.signToken({ ...payload, admin: true }, 60 * 60 * 24 * 7);
  }

  public signCreateBillToken(pin: string, sessionToken?: string) {
    // Check if there's an access pin or if it has expired
    const existingPin = AuthService.accessPins[pin];
    if (!existingPin || new Date() > existingPin) {
      return null;
    }

    const payload = sessionToken ? this.verifyToken(sessionToken) : null;

    return this.signToken({ ...payload, createBill: true });
  }

  public signBillAccessToken(billId: number, sessionToken?: string) {
    const payload = sessionToken ? this.verifyToken(sessionToken) : null;

    return this.signToken({
      ...payload,
      billAccessIds: (payload?.billAccessIds ?? []).concat(billId),
    });
  }

  private signHmac(key: string): string {
    return createHmac('sha256', this.secretKey).update(key).digest('hex');
  }

  private verifyHmac(hmac: string, key: string): boolean {
    const expectedHmac = this.signHmac(key);
    try {
      return timingSafeEqual(
        Buffer.from(hmac, 'hex'),
        Buffer.from(expectedHmac, 'hex'),
      );
    } catch {
      return false;
    }
  }

  public signBillAccessHmac(id: number): string {
    return this.signHmac(`bills/${id}`);
  }

  public verifyBillAccessHmac(hmac: string, id: number): boolean {
    return this.verifyHmac(hmac, `bills/${id}`);
  }
}
