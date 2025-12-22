import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { AccessTokenDao } from '../dao/AccessTokenDao.ts';
import {
  AccessTokenCreate,
  type AccessTokenResponse,
} from '../dto/accessToken.ts';
import type { IdRecord } from '../dto/id.ts';

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
  accessTokenDao: AccessTokenDao;
  /** Password required to gain admin access */
  adminPassword: string;
  /** Secret key to sign tokens */
  secretKey: string;
}

export class AuthService {
  private readonly accessTokenDao: AccessTokenDao;
  private readonly adminPassword: string;
  private readonly secretKey: string;
  /**
   * Access expiration in milliseconds
   */
  private accessExpiration = 24 * 60 * 60 * 1000;

  public constructor({
    accessTokenDao,
    adminPassword,
    secretKey,
  }: AuthServiceConstructor) {
    if (!secretKey) {
      throw new Error('Secret key must not be empty');
    }
    this.accessTokenDao = accessTokenDao;
    this.adminPassword = adminPassword;
    this.secretKey = secretKey;
  }

  /**
   * Only admins can create pins
   */
  public async createAccessToken(
    pin: string,
    sessionToken?: string,
  ): Promise<IdRecord | undefined> {
    if (!sessionToken || !this.verifyAdminToken(sessionToken)) {
      return undefined;
    }

    // Create encrypted hash
    const hashedToken = this.signHmac(pin);
    const iv = randomBytes(16); // Directly use Buffer returned by randomBytes
    const cipher = createCipheriv(
      'aes-256-cbc',
      // key must be 32 characters
      Buffer.from(hashedToken.substring(0, 32)),
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(pin, 'utf8'),
      cipher.final(),
    ]);

    return this.accessTokenDao.create(
      AccessTokenCreate.parse({
        hashedToken,
        encryptedToken: encrypted.toString('hex'),
        initializationVector: iv.toString('hex'),
        active: true,
        noOfUses: 0,
      }),
    );
  }

  public async readAllAccessTokens(
    sessionToken: string,
  ): Promise<AccessTokenResponse[] | undefined> {
    if (!this.verifyAdminToken(sessionToken)) {
      return undefined;
    }
    const accessTokens = await this.accessTokenDao.search({});

    return accessTokens.map((token) => {
      const encryptedText = Buffer.from(token.encryptedToken, 'hex');
      const decipher = createDecipheriv(
        'aes-256-cbc',
        Buffer.from(token.hashedToken.substring(0, 32)),
        Buffer.from(token.initializationVector, 'hex'),
      );
      const decrypted = Buffer.concat([
        decipher.update(encryptedText),
        decipher.final(),
      ]);

      return {
        pin: decrypted.toString(),
        active: token.active,
        noOfUses: token.noOfUses,
      };
    });
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

  public signAdminToken(code: string, sessionToken?: string): string | null {
    if (code !== this.adminPassword) {
      return null;
    }

    const payload = sessionToken ? this.verifyToken(sessionToken) : null;

    // Seven day expiration
    return this.signToken({ ...payload, admin: true }, 60 * 60 * 24 * 7);
  }

  public async signCreateBillToken(
    pin: string,
    sessionToken?: string,
  ): Promise<string | null> {
    const hashedToken = this.signHmac(pin);

    // Check that the pin is active and hasn't gone over its usage limit. If
    // successful then increase the no of uses.
    const result = await this.accessTokenDao.tx(async (client) => {
      const [accessToken] = await this.accessTokenDao.search(
        { hashedToken },
        client,
      );
      if (!accessToken || accessToken.active || accessToken.noOfUses <= 10) {
        return null;
      }

      return this.accessTokenDao.update(accessToken.id, {
        noOfUses: accessToken.noOfUses + 1,
      });
    });

    if (!result) {
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
