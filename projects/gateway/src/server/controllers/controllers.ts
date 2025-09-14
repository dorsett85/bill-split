import { S3Client } from '@aws-sdk/client-s3';
import { BillDao } from '../dao/BillDao.ts';
import { LineItemDao } from '../dao/LineItemDao.ts';
import { getDb } from '../db/getDb.ts';
import { BillUpdate } from '../dto/bill.ts';
import { LineItemCreate } from '../dto/lineItem.ts';
import { BillService } from '../services/BillService.ts';
import type { HtmlService } from '../services/HtmlService.ts';
import { KafkaService } from '../services/KafkaService.ts';
import { S3FileStorageService } from '../services/S3FileStorageService.ts';
import type { MiddlewareFunction } from '../types/serverRequest.ts';
import { parseJsonBody } from '../utils/parseJsonBody.ts';
import { writeToHtml, writeToJson } from '../utils/responseHelpers.ts';

const getBillService = () => {
  return new BillService({
    billDao: new BillDao(getDb()),
    lineItemDao: new LineItemDao(getDb()),
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
    const bill = await billService.read(+req.params.id);
    const html = await htmlService.render(req.route, bill);
    return writeToHtml(html, res);
  };

export const getBill: MiddlewareFunction = async (req, res) => {
  const billService = getBillService();
  const bill = await billService.read(+req.params.id);
  return writeToJson({ data: bill }, res);
};

export const patchBill: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);

  const billService = getBillService();

  const idRecord = await billService.update(
    +req.params.id,
    BillUpdate.parse(body),
  );
  return writeToJson({ data: idRecord }, res);
};

export const postBill: MiddlewareFunction = async (req, res) => {
  const billService = getBillService();
  const idRecord = await billService.create(req);
  return writeToJson({ data: idRecord }, res);
};

export const postBillItem: MiddlewareFunction = async (req, res) => {
  const body = await parseJsonBody(req);

  const billService = getBillService();
  const idRecord = await billService.createLineItem(LineItemCreate.parse(body));
  return writeToJson({ data: idRecord }, res);
};
