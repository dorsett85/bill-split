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
  jsonSuccessResponse,
  setSessionCookie,
} from '../utils/responseHelpers.ts';
import {
  getAdminService,
  getBillService,
  getParticipantService,
} from './controllerServices.ts';

export const getAccessTokens: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);
  const adminService = getAdminService();

  const accessTokens = sessionToken
    ? await adminService.readAllAccessTokens(sessionToken)
    : undefined;

  return accessTokens
    ? jsonSuccessResponse({ accessTokens }, res)
    : jsonNotFoundResponse(res);
};

export const postAccessToken: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);
  const { pin } = AccessTokenCreateRequest.parse(await parseJsonBody(req));
  const adminService = getAdminService();

  const idRecord = sessionToken
    ? await adminService.createAccessToken(pin, sessionToken)
    : undefined;

  return idRecord
    ? jsonSuccessResponse(idRecord, res)
    : jsonForbiddenResponse(res);
};

export const patchAccessToken: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);

  const verifiedPin = pin.safeParse(req.params.pin);
  const verifiedUpdates = AccessTokenUpdate.safeParse(await parseJsonBody(req));

  if (!verifiedPin.success || !verifiedUpdates.success) {
    return jsonBadRequestResponse(res);
  }

  const adminService = getAdminService();

  const idRecord = sessionToken
    ? await adminService.updateAccessToken(
        verifiedPin.data,
        verifiedUpdates.data,
        sessionToken,
      )
    : undefined;

  return idRecord
    ? jsonSuccessResponse(idRecord, res)
    : jsonForbiddenResponse(res);
};

export const deleteAccessToken: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);

  const verifiedPin = pin.safeParse(req.params.pin);

  if (!verifiedPin.success) {
    return jsonBadRequestResponse(res);
  }

  const adminService = getAdminService();

  const idRecord = sessionToken
    ? await adminService.deleteAccessToken(verifiedPin.data, sessionToken)
    : undefined;

  return idRecord
    ? jsonSuccessResponse(idRecord, res)
    : jsonForbiddenResponse(res);
};

export const getBill: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  const bill = await billService.read(
    intId.parse(req.params.billId),
    sessionToken,
  );
  return bill ? jsonSuccessResponse(bill, res) : jsonNotFoundResponse(res);
};

export const postBill: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  const billCreateRecord = sessionToken
    ? await billService.create(req, sessionToken)
    : undefined;

  return billCreateRecord
    ? jsonSuccessResponse(billCreateRecord, res)
    : jsonForbiddenResponse(res);
};

export const patchBill: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  const idRecord = sessionToken
    ? await billService.update(
        intId.parse(req.params.billId),
        BillUpdate.parse(body),
        sessionToken,
      )
    : undefined;

  return idRecord
    ? jsonSuccessResponse(idRecord, res)
    : jsonNotFoundResponse(res);
};

export const postBillCreateAccess: MiddlewareFunction = async (req, res) => {
  const { pin } = VerifyAccessRequest.parse(await parseJsonBody(req));
  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  const token = await billService.signBillCreateToken(pin, sessionToken);
  if (token) {
    setSessionCookie(token, res);
    return jsonSuccessResponse({ success: true }, res);
  }
  jsonBadRequestResponse(res, 'Could not verify access');
};

export const getBillParticipants: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);
  const participantService = getParticipantService();

  const participants = sessionToken
    ? await participantService.readBillParticipants(
        intId.parse(req.params.billId),
        sessionToken,
      )
    : undefined;

  return participants
    ? jsonSuccessResponse(participants, res)
    : jsonNotFoundResponse(res);
};

export const postBillParticipant: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const { sessionToken } = parseCookies(req);
  const participantService = getParticipantService();

  const participant = sessionToken
    ? await participantService.createBillParticipant(
        intId.parse(req.params.billId),
        ParticipantCreate.parse(body),
        sessionToken,
      )
    : undefined;

  return participant
    ? jsonSuccessResponse(participant, res)
    : jsonForbiddenResponse(res);
};

export const patchBillParticipant: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const { sessionToken } = parseCookies(req);
  const participantService = getParticipantService();

  const idRecord = sessionToken
    ? await participantService.updateBillParticipant(
        intId.parse(req.params.id),
        intId.parse(req.params.billId),
        ParticipantUpdate.parse(body),
        sessionToken,
      )
    : undefined;

  return idRecord
    ? jsonSuccessResponse(idRecord, res)
    : jsonForbiddenResponse(res);
};

export const deleteBillParticipant: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);
  const participantService = getParticipantService();

  const idRecord = sessionToken
    ? await participantService.deleteBillParticipant(
        intId.parse(req.params.billId),
        intId.parse(req.params.id),
        sessionToken,
      )
    : undefined;

  return idRecord
    ? jsonSuccessResponse(idRecord, res)
    : jsonForbiddenResponse(res);
};

export const postBillLineItem: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  const idRecord = sessionToken
    ? await billService.createLineItem(
        intId.parse(req.params.billId),
        LineItemCreate.parse(body),
        sessionToken,
      )
    : undefined;

  return idRecord
    ? jsonSuccessResponse(idRecord, res)
    : jsonForbiddenResponse(res);
};

export const patchBillLineItem: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const { sessionToken } = parseCookies(req);
  const billService = getBillService();

  const idRecord = sessionToken
    ? await billService.updateLineItem(
        intId.parse(req.params.id),
        intId.parse(req.params.billId),
        LineItemUpdate.parse(body),
        sessionToken,
      )
    : undefined;

  return idRecord
    ? jsonSuccessResponse(idRecord, res)
    : jsonForbiddenResponse(res);
};

export const postBillLineItemParticipant: MiddlewareFunction = async (
  req,
  res,
) => {
  const body = await parseJsonBody(req);
  const { sessionToken } = parseCookies(req);
  const participantService = getParticipantService();

  const idRecord = sessionToken
    ? await participantService.createLineItemParticipant(
        intId.parse(req.params.billId),
        LineItemParticipantCreateRequest.parse(body),
        sessionToken,
      )
    : undefined;

  return idRecord
    ? jsonSuccessResponse(idRecord, res)
    : jsonForbiddenResponse(res);
};

export const deleteBillLineItemParticipant: MiddlewareFunction = async (
  req,
  res,
) => {
  const { sessionToken } = parseCookies(req);
  const participantService = getParticipantService();

  const idRecord = sessionToken
    ? await participantService.deleteLineItemParticipant(
        intId.parse(req.params.id),
        intId.parse(req.params.billId),
        sessionToken,
      )
    : undefined;

  return idRecord
    ? jsonSuccessResponse(idRecord, res)
    : jsonForbiddenResponse(res);
};
