import type { ServerResponse } from 'node:http';
import { getCryptoService } from '../controllers/controllerServices.ts';
import type {
  MiddlewareFunction,
  ServerRequest,
} from '../types/serverRequest.ts';
import { parseCookies } from './parseCookies.ts';
import { jsonForbiddenResponse } from './responseHelpers.ts';

export interface AdminServerRequest extends ServerRequest {
  sessionToken: string;
}

export type AdminMiddlewareFunction = (
  req: AdminServerRequest,
  res: ServerResponse,
) => void;

/**
 * Higher-order function that wraps a controller with admin authentication. The
 * wrapped handler receives a BillServerRequest with the validated billId
 * already parsed and attached.
 */
export const withAdminAuthMiddleware = (
  middlewareFunction: AdminMiddlewareFunction,
): MiddlewareFunction => {
  return (req, res) => {
    const { sessionToken } = parseCookies(req);

    const payload =
      !!sessionToken && getCryptoService().verifySessionJwt(sessionToken);

    if (!payload || !payload.isAdmin) {
      return jsonForbiddenResponse(res);
    }

    // Augment request with parsed billId
    const adminRequest = Object.assign(req, {
      sessionToken,
    });

    return middlewareFunction(adminRequest, res);
  };
};
