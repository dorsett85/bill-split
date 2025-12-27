import { logger } from '@rsbuild/core';
import {
  AccessTokenCreateRequest,
  AccessTokenUpdate,
  pin,
} from '../dto/accessToken.ts';
import { VerifyAccessRequest } from '../dto/auth.ts';
import { BillUpdate } from '../dto/bill.ts';
import { intId } from '../dto/id.ts';
import { LineItemCreate, LineItemUpdate } from '../dto/lineItem.ts';
import { LineItemParticipantCreateRequest } from '../dto/lineItemParticipant.ts';
import { ParticipantCreate, ParticipantUpdate } from '../dto/participant.ts';
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

export const getBill: MiddlewareFunction = async (req, res) => {
  const parseResult = intId.safeParse(req.params.billId);

  if (!parseResult.success) {
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  try {
    const bill = sessionToken
      ? await billService.read(parseResult.data, sessionToken)
      : undefined;
    return bill ? jsonSuccessResponse(bill, res) : jsonNotFoundResponse(res);
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

export const patchBill: MiddlewareFunction = async (req, res) => {
  const parseBillIdResult = intId.safeParse(req.params.billId);
  const parseUpdatesResult = BillUpdate.safeParse(await parseJsonBody(req));

  if (!parseBillIdResult.success || !parseUpdatesResult.success) {
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  try {
    const idRecord = sessionToken
      ? await billService.update(
          parseBillIdResult.data,
          parseUpdatesResult.data,
          sessionToken,
        )
      : undefined;

    return idRecord
      ? jsonSuccessResponse(idRecord, res)
      : jsonNotFoundResponse(res);
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
    jsonBadRequestResponse(res, 'Could not verify access');
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const getBillRecalculate: MiddlewareFunction = async (req, res) => {
  const parseResult = intId.safeParse(req.params.billId);

  if (!parseResult.success) {
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  try {
    const bill = sessionToken
      ? await billService.recalculate(parseResult.data, sessionToken)
      : undefined;
    return bill ? jsonSuccessResponse(bill, res) : jsonNotFoundResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const subscribeBillRecalculate: MiddlewareFunction = async (
  req,
  res,
) => {
  const parseResult = intId.safeParse(req.params.billId);

  if (!parseResult.success) {
    logger.log('ENDED - could not parse bill id');
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const kafkaConsumerService = getKafkaConsumerService();

  try {
    if (sessionToken) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Essential for Nginx/Cloudflare
      });
      // Avoid connection timeouts with a heartbeat
      const interval = setInterval(() => res.write(`heartbeat:\n\n`), 15000);

      const subscribed = await kafkaConsumerService.subscribeRecalculate(
        parseResult.data,
        sessionToken,
        (bill) => {
          res.write(`data: ${JSON.stringify(bill)}\n\n`);
        },
      );

      if (!subscribed) {
        res.write(
          `data: you are not authorized for recalculate subscription\n\n`,
        );
        return res.end();
      }

      req.on('close', () => {
        clearInterval(interval);
        subscribed.unsubscribe();
      });
    } else {
      logger.log('ENDED - no session token');
      return jsonNotFoundResponse(res);
    }
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const postBillParticipant: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const parseBillIdResult = intId.safeParse(req.params.billId);
  const parseCreateResult = ParticipantCreate.safeParse(body);

  if (!parseBillIdResult.success || !parseCreateResult.success) {
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const participantService = getParticipantService();

  try {
    const participant = sessionToken
      ? await participantService.createBillParticipant(
          parseBillIdResult.data,
          parseCreateResult.data,
          sessionToken,
        )
      : undefined;

    return participant
      ? jsonSuccessResponse(participant, res)
      : jsonForbiddenResponse(res);
  } catch (e) {
    logger.error(e);
    return jsonServerErrorResponse(res);
  }
};

export const patchBillParticipant: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);

  const parseIdResult = intId.safeParse(req.params.id);
  const parseBillIdResult = intId.safeParse(req.params.billId);
  const parseUpdatesResult = ParticipantUpdate.safeParse(body);

  if (
    !parseIdResult.success ||
    !parseBillIdResult.success ||
    !parseUpdatesResult.success
  ) {
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const participantService = getParticipantService();

  try {
    const idRecord = sessionToken
      ? await participantService.updateBillParticipant(
          parseIdResult.data,
          parseBillIdResult.data,
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

export const deleteBillParticipant: MiddlewareFunction = async (req, res) => {
  const parseBillIdResult = intId.safeParse(req.params.billId);
  const parseIdResult = intId.safeParse(req.params.id);

  if (!parseBillIdResult.success || !parseIdResult.success) {
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const participantService = getParticipantService();

  try {
    const idRecord = sessionToken
      ? await participantService.deleteBillParticipant(
          parseBillIdResult.data,
          parseIdResult.data,
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

export const postBillLineItem: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const parseBillIdResult = intId.safeParse(req.params.billId);
  const parseCreateResult = LineItemCreate.safeParse(body);

  if (!parseBillIdResult.success || !parseCreateResult.success) {
    return jsonBadRequestResponse(res);
  }

  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  try {
    const idRecord = sessionToken
      ? await billService.createLineItem(
          parseBillIdResult.data,
          parseCreateResult.data,
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

export const patchBillLineItem: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const parseIdResult = intId.safeParse(req.params.id);
  const parseBillIdResult = intId.safeParse(req.params.billId);
  const parseUpdatesResult = LineItemUpdate.safeParse(body);

  if (
    !parseIdResult.success ||
    !parseBillIdResult.success ||
    !parseUpdatesResult.success
  ) {
    return jsonBadRequestResponse(res);
  }

  try {
    const { sessionToken } = parseCookies(req);
    const billService = getBillService();

    const idRecord = sessionToken
      ? await billService.updateLineItem(
          parseIdResult.data,
          parseBillIdResult.data,
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

export const postBillLineItemParticipant: MiddlewareFunction = async (
  req,
  res,
) => {
  const body = await parseJsonBody(req);
  const parseBillIdResult = intId.safeParse(req.params.billId);
  const parseCreateResult = LineItemParticipantCreateRequest.safeParse(body);

  if (!parseBillIdResult.success || !parseCreateResult.success) {
    return jsonBadRequestResponse(res);
  }

  try {
    const { sessionToken } = parseCookies(req);
    const participantService = getParticipantService();

    const idRecord = sessionToken
      ? await participantService.createLineItemParticipant(
          parseBillIdResult.data,
          parseCreateResult.data,
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

export const deleteBillLineItemParticipant: MiddlewareFunction = async (
  req,
  res,
) => {
  const parseIdResult = intId.safeParse(req.params.id);
  const parseBillIdResult = intId.safeParse(req.params.billId);

  if (!parseIdResult.success || !parseBillIdResult.success) {
    return jsonBadRequestResponse(res);
  }

  try {
    const { sessionToken } = parseCookies(req);
    const participantService = getParticipantService();

    const idRecord = sessionToken
      ? await participantService.deleteLineItemParticipant(
          parseIdResult.data,
          parseBillIdResult.data,
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
