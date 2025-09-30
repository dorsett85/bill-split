import type { ServerResponse } from 'node:http';
import jwt from 'jsonwebtoken';

export class AuthService {
  /**
   * Key/value pairs with keys as the pin and values as the expiration
   */
  private pinExpiration: Record<string, Date> = {};
  public async signCookie(code: string, res: ServerResponse): Promise<boolean> {
    if (code !== process.env.ADMIN_PASSWORD) {
      return false;
    }
    const authToken = jwt.sign({}, process.env.ADMIN_SECRET_KEY ?? '', {
      expiresIn: '7d',
    });

    const cookieString = `authToken=${authToken}; HttpOnly; Secure; SameSite=Lax`;
    res.setHeader('Set-Cookie', cookieString);

    return true;
  }

  public verify(token: string): boolean {
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

    this.pinExpiration[pin] = pinExpirationDate;

    return true;
  }
}
