import type { ServerResponse } from 'node:http';
import jwt from 'jsonwebtoken';

export class AuthService {
  /**
   * Key/value pairs with keys as the pin and values as the expiration
   * TODO create persistent storage for these.
   */
  private static accessPins: Record<string, Date> = {};

  public async signAdminToken(
    code: string,
    res: ServerResponse,
  ): Promise<boolean> {
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

  public verifyToken(token: string): boolean {
    try {
      return !!jwt.verify(token, process.env.ADMIN_SECRET_KEY ?? '');
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

  public signAccessToken(pin: string, res: ServerResponse): boolean {
    // Check if the access pin has expired
    if (new Date() > AuthService.accessPins[pin]) {
      return false;
    }

    const accessToken = jwt.sign({}, process.env.ADMIN_SECRET_KEY ?? '', {
      expiresIn: '10m',
    });

    const cookieString = `accessToken=${accessToken}; HttpOnly; Secure; SameSite=Lax; Path=/`;
    res.setHeader('Set-Cookie', cookieString);

    return true;
  }
}
