import type { AccessTokenDao } from '../dao/AccessTokenDao.ts';
import {
  AccessTokenCreate,
  type AccessTokenResponse,
} from '../dto/accessToken.ts';
import type { IdRecord } from '../dto/id.ts';
import type { CryptoService } from './CryptoService.ts';

export interface AuthServiceConstructor {
  accessTokenDao: AccessTokenDao;
  /** Password required to gain admin access */
  adminPassword: string;
  cryptoService: CryptoService;
}

export class AuthService {
  private readonly accessTokenDao: AccessTokenDao;
  private readonly adminPassword: string;
  private readonly cryptoService: CryptoService;

  public constructor({
    accessTokenDao,
    adminPassword,
    cryptoService,
  }: AuthServiceConstructor) {
    this.accessTokenDao = accessTokenDao;
    this.adminPassword = adminPassword;
    this.cryptoService = cryptoService;
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

    const { encryptedHex, ivHex } = this.cryptoService.encrypt(pin);

    return this.accessTokenDao.create(
      AccessTokenCreate.parse({
        hashedToken: this.cryptoService.signHmac(pin),
        encryptedToken: encryptedHex,
        initializationVector: ivHex,
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
      const pin = this.cryptoService.decrypt(
        token.encryptedToken,
        token.initializationVector,
      );

      return {
        pin,
        active: token.active,
        noOfUses: token.noOfUses,
      };
    });
  }

  public verifyAdminToken(token: string): boolean {
    const payload = this.cryptoService.verifySessionJwt(token);
    return !!payload?.isAdmin;
  }

  public verifyCreateBillToken(token: string): boolean {
    const payload = this.cryptoService.verifySessionJwt(token);
    return !!payload?.createBill || !!payload?.isAdmin;
  }

  public verifyBillAccessToken(token: string, billId: number): boolean {
    const payload = this.cryptoService.verifySessionJwt(token);
    return !!payload?.billAccessIds?.includes(billId) || !payload?.isAdmin;
  }

  public signAdminToken(code: string, sessionToken?: string): string | null {
    if (code !== this.adminPassword) {
      return null;
    }

    const payload = sessionToken
      ? this.cryptoService.verifySessionJwt(sessionToken)
      : null;

    // Seven day expiration
    return this.cryptoService.signSessionJwt(
      { ...payload, isAdmin: true },
      60 * 60 * 24 * 7,
    );
  }

  public async signCreateBillToken(
    pin: string,
    sessionToken?: string,
  ): Promise<string | null> {
    const hashedToken = this.cryptoService.signHmac(pin);

    // Check that the pin is active and hasn't gone over its usage limit. If
    // successful then increase the no of uses.
    const result = await this.accessTokenDao.tx(async (client) => {
      const [accessToken] = await this.accessTokenDao.search(
        { hashedToken },
        client,
      );
      if (!accessToken || !accessToken.active || accessToken.noOfUses >= 10) {
        return null;
      }

      return this.accessTokenDao.update(accessToken.id, {
        noOfUses: accessToken.noOfUses + 1,
      });
    });

    if (!result) {
      return null;
    }

    const payload = sessionToken
      ? this.cryptoService.verifySessionJwt(sessionToken)
      : null;

    return this.cryptoService.signSessionJwt({ ...payload, createBill: true });
  }

  public signBillAccessToken(billId: number, sessionToken?: string) {
    const payload = sessionToken
      ? this.cryptoService.verifySessionJwt(sessionToken)
      : null;

    return this.cryptoService.signSessionJwt({
      ...payload,
      billAccessIds: (payload?.billAccessIds ?? []).concat(billId),
    });
  }

  public signBillAccessHmac(id: number): string {
    return this.cryptoService.signHmac(`bills/${id}`);
  }

  public verifyBillAccessHmac(hmac: string, id: number): boolean {
    return this.cryptoService.verifyHmac(hmac, `bills/${id}`);
  }
}
