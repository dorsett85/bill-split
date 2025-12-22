import { getAuthService } from '../controllers/controllers.ts';
import type { MiddlewareFunction } from '../types/serverRequest.ts';
import { parseCookies } from './parseCookies.ts';
import { jsonForbiddenResponse } from './responseHelpers.ts';

/**
 * Check bill access for ajax requests. Return 403
 */
export const billApiAccessMiddleware =
  (middlewareFunction: MiddlewareFunction): MiddlewareFunction =>
  (req, res, next) => {
    const { sessionToken } = parseCookies(req);
    const { billId } = req.params;
    const authService = getAuthService();

    if (
      sessionToken &&
      billId &&
      authService.verifyBillAccessToken(sessionToken, +billId)
    ) {
      return middlewareFunction(req, res, next);
    }
    jsonForbiddenResponse(res);
  };
