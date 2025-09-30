import type { ServerResponse } from 'node:http';
import jwt from 'jsonwebtoken';

export class AuthService {
  /**
   * Key/value pairs with keys as the pin and values as the expiration
   * TODO create persistent storage for these.
   */
  private static accessPins: Record<string, Date> = {};
  public async signCookie(code: string, res: ServerResponse): Promise<boolean> {
    if (code !== process.env.ADMIN_PASSWORD) {
      return false;
    }
    const adminToken = jwt.sign({}, process.env.ADMIN_SECRET_KEY ?? '', {
      expiresIn: '7d',
    });

    const cookieString = `adminToken=${adminToken}; HttpOnly; Secure; SameSite=Lax`;
    res.setHeader('Set-Cookie', cookieString);

    return true;
  }

  public verifyAdminToken(token: string): boolean {
    try {
      return !!jwt.sign(token, process.env.ADMIN_SECRET_KEY ?? '');
    } catch {
      return false;
    }
  }

  public generatePin(pin: string): boolean {
    const pinExpirationDate = new Date();
    // We'll expire the pin in 10 minutes
    pinExpirationDate.setMinutes(pinExpirationDate.getMinutes() + 10);

    AuthService.accessPins[pin] = pinExpirationDate;

    return true;
  }

  public verifyAccessPin(pin: string): boolean {
    return new Date() < AuthService.accessPins[pin];
  }

  public signAccessPin(pin: string, res: ServerResponse): boolean {
    const verified = this.verifyAccessPin(pin);
    if (!verified) {
      return false;
    }

    const cookieString = `accessPin=${pin}; HttpOnly; Secure; SameSite=Lax`;
    res.setHeader('Set-Cookie', cookieString);

    return true;
  }
}
