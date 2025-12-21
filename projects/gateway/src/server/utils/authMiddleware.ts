import { AuthService } from '../services/AuthService.ts';
import type {
  MiddlewareFunction,
  ServerRequest,
} from '../types/serverRequest.ts';
import { parseCookies } from './parseCookies.ts';
import { jsonErrorResponse, writeRedirect } from './responseHelpers.ts';

const hasAccess = (req: ServerRequest): boolean => {
  const { accessToken, adminToken } = parseCookies(req);
  const authService = new AuthService();
  return (
    (!!accessToken && authService.verifyToken(accessToken)) ||
    (!!adminToken && authService.verifyToken(adminToken))
  );
};

/**
 * Check access for html requests. On failure Redirect to home page and flash
 * message.
 */
export const authHtmlMiddleware =
  (middleWareFun: MiddlewareFunction): MiddlewareFunction =>
  (req, res, next) => {
    if (hasAccess(req)) {
      return middleWareFun(req, res, next);
    }
    writeRedirect(`/access?redirectUrl=${encodeURIComponent(req.url)}`, res);
  };

/**
 * Check access for ajax requests. Return 403
 */
export const authApiMiddleware =
  (middlewareFunction: MiddlewareFunction): MiddlewareFunction =>
  (req, res, next) => {
    if (hasAccess(req)) {
      return middlewareFunction(req, res, next);
    }
    jsonErrorResponse('You are not authorized', res, 403);
  };
