import { AuthService } from '../services/AuthService.ts';
import type { MiddlewareFunction } from '../types/serverRequest.ts';
import { parseCookies } from './parseCookies.ts';

/**
 * Check access pin before proceeding. Redirect them to the verify access page.
 */
export const authMiddleware: MiddlewareFunction = async (req, res, next) => {
  const { accessPin, adminToken } = parseCookies(req);
  const authService = new AuthService();
  if (
    (adminToken && authService.verifyAdminToken(adminToken)) ||
    (accessPin && authService.verifyAccessPin(accessPin))
  ) {
    next();
  } else {
    res
      .writeHead(302, {
        Location: `/verify-access?redirect=${encodeURIComponent(req.url)}`,
      })
      .end();
  }
};
