import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../config.ts';
import { AccessTokenDao } from '../dao/AccessTokenDao.ts';
import { BillDao } from '../dao/BillDao.ts';
import { BillParticipantDao } from '../dao/BillParticipantDao.ts';
import { LineItemDao } from '../dao/LineItemDao.ts';
import { LineItemParticipantDao } from '../dao/LineItemParticipantDao.ts';
import { ParticipantDao } from '../dao/ParticipantDao.ts';
import { getDb } from '../db/getDb.ts';
import {
  AccessTokenCreateRequest,
  AccessTokenUpdate,
  pin,
} from '../dto/accessToken.ts';
import { AdminPagePostRequest } from '../dto/admin.ts';
import { VerifyAccessRequest } from '../dto/auth.ts';
import { BillUpdate } from '../dto/bill.ts';
import { intId } from '../dto/id.ts';
import { LineItemCreate, LineItemUpdate } from '../dto/lineItem.ts';
import { LineItemParticipantCreateRequest } from '../dto/lineItemParticipant.ts';
import { ParticipantCreate, ParticipantUpdate } from '../dto/participant.ts';
import { AdminService } from '../services/AdminService.ts';
import { BillService } from '../services/BillService.ts';
import { CryptoService } from '../services/CryptoService.ts';
import type { HtmlService } from '../services/HtmlService.ts';
import { KafkaService } from '../services/KafkaService.ts';
import { ParticipantService } from '../services/ParticipantService.ts';
import { S3FileStorageService } from '../services/S3FileStorageService.ts';
import type { MiddlewareFunction } from '../types/serverRequest.ts';
import { parseCookies } from '../utils/parseCookies.ts';
import { parseJsonBody } from '../utils/parseJsonBody.ts';
import { parseUrlEncodedForm } from '../utils/parseUrlEncodedForm.ts';
import {
  jsonBadRequestResponse,
  jsonForbiddenResponse,
  jsonNotFoundResponse,
  jsonSuccessResponse,
  setSessionCookie,
  writeRedirect,
  writeToHtml,
} from '../utils/responseHelpers.ts';

const getAdminService = () => {
  return new AdminService({
    accessTokenDao: new AccessTokenDao(getDb()),
    adminPassword: env.ADMIN_PASSWORD,
    cryptoService: new CryptoService({ key: env.ADMIN_SECRET_KEY }),
  });
};

const getBillService = () => {
  return new BillService({
    accessTokenDao: new AccessTokenDao(getDb()),
    billDao: new BillDao(getDb()),
    lineItemDao: new LineItemDao(getDb()),
    lineItemParticipantDao: new LineItemParticipantDao(getDb()),
    participantDao: new ParticipantDao(getDb()),
    cryptoService: new CryptoService({ key: env.ADMIN_SECRET_KEY }),
    fileStorageService: new S3FileStorageService({
      bucketName: env.AWS_BILL_IMAGE_S3_BUCKET,
      s3Client: new S3Client({
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
        region: env.AWS_REGION,
      }),
    }),
    kafkaService: new KafkaService({
      billTopic: env.KAFKA_BILL_PROCESSING_TOPIC,
      connectionString: `${env.KAFKA_HOST}:${env.KAFKA_PORT}`,
    }),
  });
};

const getParticipantService = () => {
  return new ParticipantService({
    participantDao: new ParticipantDao(getDb()),
    billParticipantDao: new BillParticipantDao(getDb()),
    lineItemParticipantDao: new LineItemParticipantDao(getDb()),
    cryptoService: new CryptoService({ key: env.ADMIN_SECRET_KEY }),
  });
};

export const getHomePage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const html = await htmlService.render(req.route);
    return writeToHtml(html, res);
  };

export const getAdminPage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const { sessionToken } = parseCookies(req);
    const adminService = getAdminService();

    const accessTokens = sessionToken
      ? await adminService.readAllAccessTokens(sessionToken)
      : undefined;

    const html = await htmlService.render(req.route, { accessTokens });
    return writeToHtml(html, res);
  };

export const postAdminPage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const { authenticationCode } = AdminPagePostRequest.parse(
      await parseUrlEncodedForm(req),
    );
    const { sessionToken } = parseCookies(req);
    const adminService = getAdminService();

    const { token, accessTokens, authenticationError } =
      await adminService.signAdminToken(authenticationCode, sessionToken);

    if (!authenticationError && token) {
      setSessionCookie(token, res);
    }

    const html = await htmlService.render(req.route, {
      accessTokens,
      authenticationCode,
      authenticationError,
    });
    return writeToHtml(html, res);
  };

export const getBillPage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const { sessionToken } = parseCookies(req);
    const { signature } = req.queryParams;
    const billId = intId.parse(req.params.id);
    const billService = getBillService();

    const result = await billService.prepareBillPage(
      billId,
      signature,
      sessionToken,
    );
    if (!result) {
      return writeRedirect('/', res);
    }

    if (result.token) {
      setSessionCookie(result.token, res);
    }

    const html = await htmlService.render(req.route, result.bill);
    return writeToHtml(html, res);
  };

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
