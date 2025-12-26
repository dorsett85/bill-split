import type { ServerResponse } from 'node:http';
import { logger } from '@rsbuild/core';
import { isProd } from '../config.ts';
import { AdminPagePostRequest } from '../dto/admin.ts';
import { intId } from '../dto/id.ts';
import type { HtmlService } from '../services/HtmlService.ts';
import type { MiddlewareFunction } from '../types/serverRequest.ts';
import { parseCookies } from '../utils/parseCookies.ts';
import { parseUrlEncodedForm } from '../utils/parseUrlEncodedForm.ts';
import {
  SERVER_ERROR_MESSAGE,
  setSessionCookie,
  writeRedirect,
  writeToHtml,
} from '../utils/responseHelpers.ts';
import { getAdminService, getBillService } from './controllerServices.ts';

const writeErrorPage = async (
  res: ServerResponse,
  htmlService: HtmlService,
  error: unknown,
  statusCode = 500,
  message = SERVER_ERROR_MESSAGE,
) => {
  logger.error(error);
  res.statusCode = statusCode;
  const html = await htmlService.render('/error', {
    statusCode: res.statusCode,
    message:
      !isProd() && error instanceof Error
        ? (error.stack ?? error.message)
        : message,
  });
  return writeToHtml(html, res);
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

    try {
      const accessTokens = sessionToken
        ? await adminService.readAllAccessTokens(sessionToken)
        : undefined;
      const html = await htmlService.render(req.route, { accessTokens });
      return writeToHtml(html, res);
    } catch (e) {
      return writeErrorPage(res, htmlService, e);
    }
  };

export const postAdminPage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const requestForm = await parseUrlEncodedForm(req);
    const parseResult = AdminPagePostRequest.safeParse(requestForm);

    if (!parseResult.success) {
      logger.error(parseResult.error.message);
      res.statusCode = 400;
      const html = await htmlService.render(req.route, {
        authenticationCode: requestForm.authenticationCode,
        authenticationError: 'Your authentication code must be a string',
      });
      return writeToHtml(html, res);
    }

    const { sessionToken } = parseCookies(req);
    const adminService = getAdminService();

    try {
      const { token, accessTokens, authenticationError } =
        await adminService.signAdminToken(
          parseResult.data.authenticationCode,
          sessionToken,
        );

      if (!authenticationError && token) {
        setSessionCookie(token, res);
      }

      const html = await htmlService.render(req.route, {
        accessTokens,
        authenticationCode: parseResult.data.authenticationCode,
        authenticationError,
      });
      return writeToHtml(html, res);
    } catch (e) {
      return writeErrorPage(res, htmlService, e);
    }
  };

export const getBillPage =
  ({ htmlService }: { htmlService: HtmlService }): MiddlewareFunction =>
  async (req, res) => {
    const parseResult = intId.safeParse(req.params.id);

    if (!parseResult.success) {
      logger.error(parseResult.error.message);
      return writeErrorPage(
        res,
        htmlService,
        undefined,
        400,
        'Your request contained a bad input. Please try again',
      );
    }

    const { sessionToken } = parseCookies(req);
    const { signature } = req.queryParams;
    const billService = getBillService();

    try {
      const result = await billService.readBillPage(
        parseResult.data,
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
    } catch (e) {
      return writeErrorPage(res, htmlService, e);
    }
  };
