import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../config.ts';
import { AccessTokenDao } from '../dao/AccessTokenDao.ts';
import { BillDao } from '../dao/BillDao.ts';
import { BillParticipantDao } from '../dao/BillParticipantDao.ts';
import { LineItemDao } from '../dao/LineItemDao.ts';
import { LineItemParticipantDao } from '../dao/LineItemParticipantDao.ts';
import { ParticipantDao } from '../dao/ParticipantDao.ts';
import { getDb } from '../db/getDb.ts';
import { AccessTokenCreateRequest } from '../dto/accessToken.ts';
import { AdminRequest } from '../dto/admin.ts';
import { VerifyAccessRequest } from '../dto/auth.ts';
import { BillUpdate } from '../dto/bill.ts';
import { id } from '../dto/id.ts';
import { LineItemCreate, LineItemUpdate } from '../dto/lineItem.ts';
import { LineItemParticipantCreateRequest } from '../dto/lineItemParticipant.ts';
import { ParticipantCreate, ParticipantUpdate } from '../dto/participant.ts';
import { AuthService } from '../services/AuthService.ts';
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
  jsonErrorResponse,
  jsonForbiddenResponse,
  jsonSuccessResponse,
  setSessionCookie,
  writeRedirect,
  writeToHtml,
} from '../utils/responseHelpers.ts';

export const getAuthService = () => {
  return new AuthService({
    accessTokenDao: new AccessTokenDao(getDb()),
    adminPassword: env.ADMIN_PASSWORD,
    cryptoService: new CryptoService({ key: env.ADMIN_SECRET_KEY }),
  });
};

const getBillService = () => {
  return new BillService({
    billDao: new BillDao(getDb()),
    lineItemDao: new LineItemDao(getDb()),
    lineItemParticipantDao: new LineItemParticipantDao(getDb()),
    participantDao: new ParticipantDao(getDb()),
    authService: getAuthService(),
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
  });
};

export const getAdminPage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const { sessionToken } = parseCookies(req);

    const authService = getAuthService();

    const accessTokens = sessionToken
      ? await authService.readAllAccessTokens(sessionToken)
      : undefined;

    const html = await htmlService.render(req.route, { accessTokens });
    return writeToHtml(html, res);
  };

export const postAdminPage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const authService = getAuthService();
    const { authenticationCode } = AdminRequest.parse(
      await parseUrlEncodedForm(req),
    );

    const { sessionToken } = parseCookies(req);

    let authenticationError: string | undefined = undefined;
    let adminSessionToken = sessionToken;

    if (
      !sessionToken ||
      (sessionToken && !authService.verifyAdminToken(sessionToken))
    ) {
      // User makes a request to gain admin access
      const token = authService.signAdminToken(
        authenticationCode,
        sessionToken,
      );
      if (token) {
        adminSessionToken = token;
        setSessionCookie(token, res);
      } else {
        authenticationError = 'We could not verify your code';
      }
    }

    const accessTokens =
      !authenticationError && adminSessionToken
        ? await authService.readAllAccessTokens(adminSessionToken)
        : undefined;

    const html = await htmlService.render(req.route, {
      accessTokens,
      authenticationCode,
      authenticationError,
    });
    return writeToHtml(html, res);
  };

export const postAccessToken: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);
  const { pin } = AccessTokenCreateRequest.parse(await parseJsonBody(req));
  const authService = getAuthService();

  const idRecord = await authService.createAccessToken(pin, sessionToken);

  return idRecord
    ? jsonSuccessResponse(idRecord, res)
    : jsonErrorResponse('Unabled to create access token', res);
};

export const getAccessTokens: MiddlewareFunction = async (req, res) => {
  const { sessionToken } = parseCookies(req);
  const authService = getAuthService();

  const accessTokens = sessionToken
    ? await authService.readAllAccessTokens(sessionToken)
    : undefined;

  jsonSuccessResponse({ accessTokens }, res);
};

export const postVerifyAccess: MiddlewareFunction = async (req, res) => {
  const { pin } = VerifyAccessRequest.parse(await parseJsonBody(req));
  const { sessionToken } = parseCookies(req);
  const authService = getAuthService();

  const token = await authService.signCreateBillToken(pin, sessionToken);
  if (token) {
    setSessionCookie(token, res);
    return jsonSuccessResponse({ success: true }, res);
  }
  jsonErrorResponse('Could not verify access', res, 400);
};

export const getHomePage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const html = await htmlService.render(req.route);
    return writeToHtml(html, res);
  };

/**
 * A more complicated controller. Accessing this page either requires a
 * sessionToken with admin or bill access permission, or a hmac signature query
 * param. This allows the page to be shareable with people that don't have a
 * session token.
 *
 * Once The page is accessed with a signature hmac, the response will then set
 * the sessionToken with bill access permission.
 */
export const getBillPage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const billService = getBillService();
    const authService = getAuthService();
    const billId = id.parse(+req.params.id);
    const { sessionToken } = parseCookies(req);
    const { signature } = req.queryParams;

    const hasBillTokenAccess =
      !!sessionToken && authService.verifyBillAccessToken(sessionToken, billId);

    const addBillTokenAccess =
      !hasBillTokenAccess &&
      !!signature &&
      authService.verifyBillAccessHmac(signature, billId);

    if (!hasBillTokenAccess && !addBillTokenAccess) {
      return writeRedirect('/', res);
    }

    if (addBillTokenAccess) {
      const token = authService.signBillAccessToken(billId, sessionToken);
      setSessionCookie(token, res);
    }

    const bill = await billService.read(id.parse(+req.params.id));

    const html = await htmlService.render(req.route, bill);
    return writeToHtml(html, res);
  };

export const postBill: MiddlewareFunction = async (req, res) => {
  const billService = getBillService();
  const authService = getAuthService();
  const { sessionToken } = parseCookies(req);

  const verified =
    !!sessionToken && authService.verifyCreateBillToken(sessionToken);
  if (!verified) {
    return jsonForbiddenResponse(res);
  }

  const billCreateRecord = await billService.create(req);
  return jsonSuccessResponse(billCreateRecord, res);
};

export const getBill: MiddlewareFunction = async (req, res) => {
  const billService = getBillService();
  const bill = await billService.read(id.parse(+req.params.billId));
  return jsonSuccessResponse(bill, res);
};

export const patchBill: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);

  const billService = getBillService();

  const idRecord = await billService.update(
    id.parse(+req.params.billId),
    BillUpdate.parse(body),
  );
  return jsonSuccessResponse(idRecord, res);
};

export const postBillParticipant: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const participantService = getParticipantService();
  const participant = await participantService.createBillParticipant(
    id.parse(+req.params.billId),
    ParticipantCreate.parse(body),
  );
  return jsonSuccessResponse(participant, res);
};

export const getBillParticipants: MiddlewareFunction = async (req, res) => {
  const participantService = getParticipantService();
  const participants = await participantService.readBillParticipants(
    id.parse(+req.params.billId),
  );
  return jsonSuccessResponse(participants, res);
};

export const deleteBillParticipant: MiddlewareFunction = async (req, res) => {
  const participantService = getParticipantService();
  const idRecord = await participantService.deleteBillParticipant(
    id.parse(+req.params.billId),
    id.parse(+req.params.id),
  );

  return jsonSuccessResponse(idRecord, res);
};

export const patchLineItem: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);

  const billService = getBillService();
  const idRecord = await billService.updateLineItem(
    id.parse(+req.params.id),
    LineItemUpdate.parse(body),
  );
  return jsonSuccessResponse(idRecord, res);
};

export const postLineItem: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);

  const billService = getBillService();
  const idRecord = await billService.createLineItem(LineItemCreate.parse(body));
  return jsonSuccessResponse(idRecord, res);
};

export const postLineItemParticipant: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const participantService = getParticipantService();
  const idRecord = await participantService.createLineItemParticipant(
    LineItemParticipantCreateRequest.parse(body),
  );
  return jsonSuccessResponse(idRecord, res);
};

export const deleteLineItemParticipant: MiddlewareFunction = async (
  req,
  res,
) => {
  const participantService = getParticipantService();
  const idRecord = await participantService.deleteLineItemParticipant(
    id.parse(+req.params.id),
  );
  return jsonSuccessResponse(idRecord, res);
};

export const patchParticipant: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const participantService = getParticipantService();
  const idRecord = await participantService.updateBillParticipant(
    id.parse(+req.params.id),
    ParticipantUpdate.parse(body),
  );

  return jsonSuccessResponse(idRecord, res);
};
