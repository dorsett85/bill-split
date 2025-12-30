import type { ServerResponse } from 'node:http';
import { getCryptoService } from '../controllers/controllerServices.ts';
import { intId } from '../dto/id.ts';
import type {
  MiddlewareFunction,
  ServerRequest,
} from '../types/serverRequest.ts';
import { parseCookies } from './parseCookies.ts';
import {
  jsonBadRequestResponse,
  jsonForbiddenResponse,
} from './responseHelpers.ts';

export interface BillServerRequest extends ServerRequest {
  billId: number;
  sessionToken: string;
}

export type BillMiddlewareFunction = (
  req: BillServerRequest,
  res: ServerResponse,
) => void;

/**
 * Higher-order function that wraps a controller with bill authentication
 * and billId parsing. The wrapped handler receives a BillServerRequest with
 * the validated billId already parsed and attached.
 */
export const withBillAuthMiddleware = (
  middlewareFunction: BillMiddlewareFunction,
): MiddlewareFunction => {
  return (req, res) => {
    const parseBillIdResult = intId.safeParse(req.params.billId);

    if (!parseBillIdResult.success) {
      return jsonBadRequestResponse(res);
    }

    const { sessionToken } = parseCookies(req);

    const payload =
      !!sessionToken && getCryptoService().verifySessionJwt(sessionToken);

    if (
      !payload ||
      !(
        payload.isAdmin ||
        payload.billAccessIds?.includes(parseBillIdResult.data)
      )
    ) {
      return jsonForbiddenResponse(res);
    }

    // Augment request with parsed billId
    const billRequest = Object.assign(req, {
      billId: parseBillIdResult.data,
      sessionToken,
    });

    return middlewareFunction(billRequest, res);
  };
};
