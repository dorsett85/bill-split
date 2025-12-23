import type { AccessTokenDao } from '../dao/AccessTokenDao.ts';
import {
  AccessTokenCreate,
  type AccessTokenResponse,
} from '../dto/accessToken.ts';
import type { IdRecord } from '../dto/id.ts';
import type { CryptoService } from './CryptoService.ts';

interface AdminServiceConstructor {
  accessTokenDao: AccessTokenDao;
  adminPassword: string;
  cryptoService: CryptoService;
}

export class AdminService {
  private readonly accessTokenDao: AccessTokenDao;
  private readonly adminPassword: string;
  private readonly cryptoService: CryptoService;

  constructor({
    accessTokenDao,
    adminPassword,
    cryptoService,
  }: AdminServiceConstructor) {
    this.accessTokenDao = accessTokenDao;
    this.adminPassword = adminPassword;
    this.cryptoService = cryptoService;
  }

  public async signAdminToken(
    password: string,
    sessionToken?: string,
  ): Promise<{
    token?: string;
    accessTokens?: AccessTokenResponse[];
    authenticationError?: string;
  }> {
    if (password !== this.adminPassword) {
      return { authenticationError: 'We could not verify your code' };
    }

    const payload = sessionToken
      ? this.cryptoService.verifySessionJwt(sessionToken)
      : undefined;

    // Seven day expiration
    const token = this.cryptoService.signSessionJwt(
      { ...payload, isAdmin: true },
      60 * 60 * 24 * 7,
    );

    return {
      token,
      accessTokens: await this.readAllAccessTokens(token),
    };
  }

  public async createAccessToken(
    pin: string,
    sessionToken?: string,
  ): Promise<IdRecord | undefined> {
    if (
      !sessionToken ||
      !this.cryptoService.verifySessionJwt(sessionToken)?.isAdmin
    ) {
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
    if (!this.cryptoService.verifySessionJwt(sessionToken)?.isAdmin) {
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
        createdAt: token.createdAt,
      };
    });
  }
}
