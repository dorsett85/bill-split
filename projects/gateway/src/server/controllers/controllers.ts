import { S3Client } from '@aws-sdk/client-s3';
import { BillDao } from '../dao/BillDao.ts';
import { BillParticipantDao } from '../dao/BillParticipantDao.ts';
import { LineItemDao } from '../dao/LineItemDao.ts';
import { LineItemParticipantDao } from '../dao/LineItemParticipantDao.ts';
import { ParticipantDao } from '../dao/ParticipantDao.ts';
import { getDb } from '../db/getDb.ts';
import { AdminRequest } from '../dto/admin.ts';
import { VerifyAccessRequest } from '../dto/auth.ts';
import { BillUpdate } from '../dto/bill.ts';
import { id } from '../dto/id.ts';
import { LineItemCreate, LineItemUpdate } from '../dto/lineItem.ts';
import { LineItemParticipantCreateRequest } from '../dto/lineItemParticipant.ts';
import { ParticipantCreate, ParticipantUpdate } from '../dto/participant.ts';
import { AuthService } from '../services/AuthService.ts';
import { BillService } from '../services/BillService.ts';
import type { HtmlService } from '../services/HtmlService.ts';
import { KafkaService } from '../services/KafkaService.ts';
import { ParticipantService } from '../services/ParticipantService.ts';
import { S3FileStorageService } from '../services/S3FileStorageService.ts';
import type { MiddlewareFunction } from '../types/serverRequest.ts';
import { parseCookies } from '../utils/parseCookies.ts';
import { parseJsonBody } from '../utils/parseJsonBody.ts';
import { parseUrlEncodedForm } from '../utils/parseUrlEncodedForm.ts';
import { writeToHtml, writeToJson } from '../utils/responseHelpers.ts';

const getAuthService = () => {
  return new AuthService();
};

const getBillService = () => {
  return new BillService({
    billDao: new BillDao(getDb()),
    lineItemDao: new LineItemDao(getDb()),
    lineItemParticipantDao: new LineItemParticipantDao(getDb()),
    participantDao: new ParticipantDao(getDb()),
    fileStorageService: new S3FileStorageService({
      bucketName: process.env.AWS_BILL_IMAGE_S3_BUCKET ?? '',
      s3Client: new S3Client({
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY ?? '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
        },
        region: process.env.AWS_REGION ?? '',
      }),
    }),
    kafkaService: new KafkaService(),
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
    const { adminToken } = parseCookies(req);

    const authService = getAuthService();

    let authorized = false;
    if (adminToken) {
      authorized = authService.verifyAdminToken(adminToken);
    }

    const html = await htmlService.render(req.route, { authorized });
    return writeToHtml(html, res);
  };

export const postAdminPage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const authService = getAuthService();
    const { authenticationCode, pin } = AdminRequest.parse(
      await parseUrlEncodedForm(req),
    );

    const { adminToken } = parseCookies(req);

    let authenticationError: string | undefined = undefined;
    let pinGenerated = false;
    if (!adminToken && authenticationCode) {
      const success = await authService.signCookie(authenticationCode, res);
      if (!success) {
        authenticationError = 'We could not verify your code';
      }
    } else if (pin && adminToken && authService.verifyAdminToken(adminToken)) {
      pinGenerated = authService.generatePin(pin);
    }

    const html = await htmlService.render(req.route, {
      authorized: !authenticationError,
      authenticationCode,
      authenticationError,
      pin,
      pinGenerated,
    });
    return writeToHtml(html, res);
  };

export const postVerifyAccess =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const { redirect } = req.queryParams;
    const { accessPin } = VerifyAccessRequest.parse(
      await parseUrlEncodedForm(req),
    );
    const authService = getAuthService();

    const success = authService.signAccessPin(accessPin, res);
    if (success) {
      res
        .writeHead(302, {
          Location: redirect ? decodeURIComponent(redirect) : '/',
        })
        .end();
    } else {
      const html = await htmlService.render(req.route, {
        error: 'Could not verify access',
      });
      writeToHtml(html, res);
    }
  };

export const getVerifyAccess =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const { redirect } = req.queryParams;
    const { accessPin } = parseCookies(req);
    const authService = getAuthService();

    if (accessPin && authService.verifyAccessPin(accessPin)) {
      res
        .writeHead(302, {
          Location: redirect ? decodeURIComponent(redirect) : '/',
        })
        .end();
    } else {
      const html = await htmlService.render(req.route, {});
      writeToHtml(html, res);
    }
  };

export const getHomePage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const html = await htmlService.render(req.route);
    return writeToHtml(html, res);
  };

export const getBillPage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const billService = getBillService();

    const bill = await billService.read(id.parse(+req.params.id));

    const html = await htmlService.render(req.route, bill);
    return writeToHtml(html, res);
  };

export const postBill: MiddlewareFunction = async (req, res) => {
  const billService = getBillService();
  const idRecord = await billService.create(req);
  return writeToJson({ data: idRecord }, res);
};

export const getBill: MiddlewareFunction = async (req, res) => {
  const billService = getBillService();
  const bill = await billService.read(id.parse(+req.params.id));
  return writeToJson({ data: bill }, res);
};

export const patchBill: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);

  const billService = getBillService();

  const idRecord = await billService.update(
    id.parse(+req.params.id),
    BillUpdate.parse(body),
  );
  return writeToJson({ data: idRecord }, res);
};

export const postBillParticipant: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const participantService = getParticipantService();
  const participant = await participantService.createBillParticipant(
    id.parse(+req.params.billId),
    ParticipantCreate.parse(body),
  );
  return writeToJson({ data: participant }, res);
};

export const getBillParticipants: MiddlewareFunction = async (req, res) => {
  const participantService = getParticipantService();
  const participants = await participantService.readBillParticipants(
    id.parse(+req.params.billId),
  );
  return writeToJson({ data: participants }, res);
};

export const deleteBillParticipant: MiddlewareFunction = async (req, res) => {
  const participantService = getParticipantService();
  const idRecord = await participantService.deleteBillParticipant(
    id.parse(+req.params.billId),
    id.parse(+req.params.id),
  );

  return writeToJson({ data: idRecord }, res);
};

export const patchLineItem: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);

  const billService = getBillService();
  const idRecord = await billService.updateLineItem(
    id.parse(+req.params.id),
    LineItemUpdate.parse(body),
  );
  return writeToJson({ data: idRecord }, res);
};

export const postLineItem: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);

  const billService = getBillService();
  const idRecord = await billService.createLineItem(LineItemCreate.parse(body));
  return writeToJson({ data: idRecord }, res);
};

export const postLineItemParticipant: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const participantService = getParticipantService();
  const idRecord = await participantService.createLineItemParticipant(
    LineItemParticipantCreateRequest.parse(body),
  );
  return writeToJson({ data: idRecord }, res);
};

export const deleteLineItemParticipant: MiddlewareFunction = async (
  req,
  res,
) => {
  const participantService = getParticipantService();
  const idRecord = await participantService.deleteLineItemParticipant(
    id.parse(+req.params.id),
  );
  return writeToJson({ data: idRecord }, res);
};

export const patchParticipant: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);
  const participantService = getParticipantService();
  const idRecord = await participantService.updateBillParticipant(
    id.parse(+req.params.id),
    ParticipantUpdate.parse(body),
  );

  return writeToJson({ data: idRecord }, res);
};
