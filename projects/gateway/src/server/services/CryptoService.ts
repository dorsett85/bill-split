import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const IV_LENGTH = 16;

const SessionJwtPayload = z.object({
  isAdmin: z.boolean().optional(),
  /**
   * Whether the token can create a new bill
   */
  createBill: z.boolean().optional(),
  /**
   * The bill ids that the token has access to
   */
  billAccessIds: z.array(z.number()).optional(),
});

type SessionJwtPayload = z.infer<typeof SessionJwtPayload>;

export interface CryptoServiceConstructor {
  /** Must be 32 characters long */
  key: string;
}

/**
 * Generic cryptographic functionality like signing/verification of jwts, hmacs, etc.
 */
export class CryptoService {
  private readonly key: string;

  public constructor({ key }: CryptoServiceConstructor) {
    if (key.length < 32) {
      throw new Error('CryptoService key must be at least 32');
    }

    this.key = key;
  }

  public signSessionJwt(
    payload: SessionJwtPayload,
    // expiresIn expressed in seconds, default to 1 day
    expiresIn = 60 * 60 * 24,
  ): string {
    return jwt.sign(payload, this.key, {
      expiresIn,
    });
  }

  public verifySessionJwt(token: string): undefined | SessionJwtPayload {
    try {
      const payload = jwt.verify(token, this.key);
      return typeof payload === 'string'
        ? undefined
        : SessionJwtPayload.parse(payload);
    } catch {
      return undefined;
    }
  }

  public signHmac(text: string): string {
    return createHmac('sha256', this.key).update(text).digest('hex');
  }

  public verifyHmac(hmac: string, text: string): boolean {
    const expectedHmac = this.signHmac(text);
    try {
      return timingSafeEqual(
        Buffer.from(hmac, 'hex'),
        Buffer.from(expectedHmac, 'hex'),
      );
    } catch {
      return false;
    }
  }

  public encrypt(plainText: string): { ivHex: string; encryptedHex: string } {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(this.key), iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);

    return {
      ivHex: iv.toString('hex'),
      encryptedHex: encrypted.toString('hex'),
    };
  }

  public decrypt(encryptedHex: string, ivHex: string): string {
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.key),
      Buffer.from(ivHex, 'hex'),
    );
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    return decrypted.toString();
  }
}
