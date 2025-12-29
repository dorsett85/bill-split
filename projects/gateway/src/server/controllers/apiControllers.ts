import { logger } from '@rsbuild/core';
import {
  AccessTokenCreateRequest,
  AccessTokenUpdate,
  pin,
} from '../dto/accessToken.ts';
import { VerifyAccessRequest } from '../dto/auth.ts';
import { BillUpdate } from '../dto/bill.ts';
import { intId } from '../dto/id.ts';
import {
  ParticipantCreateRequest,
  ParticipantUpdateRequest,
} from '../dto/participant.ts';
import type { MiddlewareFunction } from '../types/serverRequest.ts';
import { parseCookies } from '../utils/parseCookies.ts';
import { parseJsonBody } from '../utils/parseJsonBody.ts';
import {
  jsonBadRequestResponse,
  jsonForbiddenResponse,
  jsonNotFoundResponse,
  jsonServerErrorResponse,
  jsonSuccessResponse,
  setSessionCookie,
} from '../utils/responseHelpers.ts';
import type { BillMiddlewareFunction } from '../utils/withBillAuthMiddleware.ts';
import {
  getAdminService,
  getBillService,
  getKafkaConsumerService,
  getParticipantService,
} from './controllerServices.ts';

export const getAccessTokens: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);
  const adminService = getAdminService();

  try {
    const accessTokens = sessionToken
      ? await adminService.readAllAccessTokens(sessionToken)
      : undefined;

    return accessTokens
      ? jsonSuccessResponse({ accessTokens }, res)
      : jsonNotFoundResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const postAccessToken: MiddlewareFunction = async (req, res) => {
  const parseResult = AccessTokenCreateRequest.safeParse(
    await parseJsonBody(req),
  );

  if (!parseResult.success) {
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const adminService = getAdminService();

  try {
    const idRecord = sessionToken
      ? await adminService.createAccessToken(parseResult.data.pin, sessionToken)
      : undefined;

    return idRecord
      ? jsonSuccessResponse(idRecord, res)
      : jsonForbiddenResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const patchAccessToken: MiddlewareFunction = async (req, res) => {
  const parsePinResult = pin.safeParse(req.params.pin);
  const parseUpdatesResult = AccessTokenUpdate.safeParse(
    await parseJsonBody(req),
  );

  if (!parsePinResult.success || !parseUpdatesResult.success) {
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const adminService = getAdminService();

  try {
    const idRecord = sessionToken
      ? await adminService.updateAccessToken(
          parsePinResult.data,
          parseUpdatesResult.data,
          sessionToken,
        )
      : undefined;

    return idRecord
      ? jsonSuccessResponse(idRecord, res)
      : jsonForbiddenResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const deleteAccessToken: MiddlewareFunction = async (req, res) => {
  const parsePinResult = pin.safeParse(req.params.pin);

  if (!parsePinResult.success) {
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const adminService = getAdminService();

  try {
    const idRecord = sessionToken
      ? await adminService.deleteAccessToken(parsePinResult.data, sessionToken)
      : undefined;

    return idRecord
      ? jsonSuccessResponse(idRecord, res)
      : jsonForbiddenResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const postBillCreateAccess: MiddlewareFunction = async (req, res) => {
  const parseResult = VerifyAccessRequest.safeParse(await parseJsonBody(req));

  if (!parseResult.success) {
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  try {
    const token = await billService.signBillCreateToken(
      parseResult.data.pin,
      sessionToken,
    );
    if (token) {
      setSessionCookie(token, res);
      return jsonSuccessResponse({ success: true }, res);
    }
    return jsonBadRequestResponse(res, 'Could not verify access');
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const postBill: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  try {
    const billCreateRecord = sessionToken
      ? await billService.create(req, sessionToken)
      : undefined;

    return billCreateRecord
      ? jsonSuccessResponse(billCreateRecord, res)
      : jsonForbiddenResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const getBill: BillMiddlewareFunction = async (req, res) => {
  const billService = getBillService();

  try {
    const bill = await billService.read(req.billId);
    return bill ? jsonSuccessResponse(bill, res) : jsonNotFoundResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const patchBill: BillMiddlewareFunction = async (req, res) => {
  const parseUpdatesResult = BillUpdate.safeParse(await parseJsonBody(req));

  if (!parseUpdatesResult.success) {
    return jsonBadRequestResponse(res);
  }

  const billService = getBillService();

  try {
    const idRecord = await billService.update(
      req.billId,
      parseUpdatesResult.data,
    );

    return idRecord
      ? jsonSuccessResponse(idRecord, res)
      : jsonNotFoundResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const subscribeBillRecalculate: BillMiddlewareFunction = async (
  req,
  res,
) => {
  const kafkaConsumerService = getKafkaConsumerService();

  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Essential for Nginx/Cloudflare
    });
    // Avoid connection timeouts with a heartbeat
    const interval = setInterval(() => res.write(`heartbeat:\n\n`), 15000);

    const subscribed = await kafkaConsumerService.subscribeRecalculate(
      req.billId,
      req.sessionToken,
      (bill) => {
        res.write(`data: ${JSON.stringify(bill)}\n\n`);
      },
    );

    req.on('close', () => {
      clearInterval(interval);
      subscribed.unsubscribe();
    });
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const postBillParticipant: BillMiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const parseCreateResult = ParticipantCreateRequest.safeParse(body);

  if (!parseCreateResult.success) {
    return jsonBadRequestResponse(res);
  }

  const participantService = getParticipantService();

  try {
    const detailedBill = await participantService.createBillParticipant(
      req.billId,
      parseCreateResult.data,
      req.sessionToken,
    );

    return detailedBill
      ? jsonSuccessResponse(detailedBill, res)
      : jsonForbiddenResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const patchBillParticipant: BillMiddlewareFunction = async (
  req,
  res,
) => {
  const body = await parseJsonBody(req);

  const parseParticipantIdResult = intId.safeParse(req.params.participantId);
  const parseUpdatesResult = ParticipantUpdateRequest.safeParse(body);

  if (!parseParticipantIdResult.success || !parseUpdatesResult.success) {
    return jsonBadRequestResponse(res);
  }

  const participantService = getParticipantService();

  try {
    const countRecord = await participantService.updateBillParticipant(
      parseParticipantIdResult.data,
      req.billId,
      parseUpdatesResult.data,
      req.sessionToken,
    );

    return countRecord
      ? jsonSuccessResponse(countRecord, res)
      : jsonForbiddenResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const deleteBillParticipant: BillMiddlewareFunction = async (
  req,
  res,
) => {
  const parseParticipantIdResult = intId.safeParse(req.params.participantId);

  if (!parseParticipantIdResult.success) {
    return jsonBadRequestResponse(res);
  }

  const participantService = getParticipantService();

  try {
    const detailedBill = await participantService.deleteBillParticipant(
      req.billId,
      parseParticipantIdResult.data,
      req.sessionToken,
    );

    return detailedBill
      ? jsonSuccessResponse(detailedBill, res)
      : jsonForbiddenResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const postBillParticipantLineItem: BillMiddlewareFunction = async (
  req,
  res,
) => {
  const parseParticipantIdResult = intId.safeParse(req.params.participantId);
  const parseLineItemIdResult = intId.safeParse(req.params.lineItemId);

  if (!parseParticipantIdResult.success || !parseLineItemIdResult.success) {
    return jsonBadRequestResponse(res);
  }

  const participantService = getParticipantService();

  try {
    const detailedBill = await participantService.createParticipantLineItem(
      req.billId,
      parseParticipantIdResult.data,
      parseLineItemIdResult.data,
      req.sessionToken,
    );

    return detailedBill
      ? jsonSuccessResponse(detailedBill, res)
      : jsonForbiddenResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};
export const deleteBillParticipantLineItem: BillMiddlewareFunction = async (
  req,
  res,
) => {
  const parseParticipantIdResult = intId.safeParse(req.params.participantId);
  const parseLineItemIdResult = intId.safeParse(req.params.lineItemId);

  if (!parseParticipantIdResult.success || !parseLineItemIdResult.success) {
    return jsonBadRequestResponse(res);
  }

  const participantService = getParticipantService();

  try {
    const detailedBill = await participantService.deleteParticipantLineItem(
      req.billId,
      parseParticipantIdResult.data,
      parseLineItemIdResult.data,
      req.sessionToken,
    );

    return detailedBill
      ? jsonSuccessResponse(detailedBill, res)
      : jsonForbiddenResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};
