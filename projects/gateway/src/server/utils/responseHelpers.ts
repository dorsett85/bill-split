import type { ServerResponse } from 'node:http';
import path from 'path';

type UnknownRecord = Record<never, never>;

export interface JsonSuccessResponse<
  TData extends UnknownRecord = UnknownRecord,
> {
  data: TData;
}

interface JsonErrorResponse {
  error: {
    message: string;
  };
}

type JsonResponse = JsonSuccessResponse | JsonErrorResponse;

/**
 * One year in milliseconds
 */
const ONE_YEAR_IN_MILLIS = 365 * 24 * 60 * 60;

const mimeTypeMapping: Record<string, string> = {
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.map': 'application/json',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

/**
 * Takes any Buffer and serializes it as a text response. Use the url arg to
 * determine the mimetype.
 */
export const writeToText = (
  content: Buffer,
  url: string,
  res: ServerResponse,
): ServerResponse => {
  const mimeType = mimeTypeMapping[path.extname(url)];

  return res
    .setHeader('Content-type', mimeType ?? 'text/plain')
    .setHeader('Cache-Control', `max-age=${ONE_YEAR_IN_MILLIS}`)
    .end(content);
};

/**
 * Takes an object and serializes it as a json response
 */
const writeToJson = <JResponse extends JsonResponse>(
  response: JResponse,
  res: ServerResponse,
): ServerResponse => {
  return res
    .setHeader('Content-type', 'application/json')
    .end(JSON.stringify(response));
};

/**
 * Standardized json success response
 */
export const jsonSuccessResponse = <TData extends UnknownRecord>(
  response: TData,
  res: ServerResponse,
) => {
  return writeToJson({ data: response }, res);
};

/**
 * Standardized json error response
 */
export const jsonErrorResponse = (
  message: string,
  res: ServerResponse,
  statusCode?: number,
) => {
  res.statusCode = statusCode ?? res.statusCode;
  return writeToJson({ error: { message } }, res);
};

/**
 * Standardized json 400 response
 */
export const jsonBadRequestResponse = (res: ServerResponse, msg?: string) => {
  return jsonErrorResponse(msg ?? 'We were unable to process your', res, 400);
};

/**
 * Standardized json 403 response
 */
export const jsonForbiddenResponse = (res: ServerResponse, msg?: string) => {
  return jsonErrorResponse(msg ?? 'You are not authorized', res, 403);
};

/**
 * Standardized json 404 response
 */
export const jsonNotFoundResponse = (res: ServerResponse, msg?: string) => {
  return jsonErrorResponse(
    msg ?? 'We were unable to find the resource you requested',
    res,
    404,
  );
};

/**
 * Standardized json 500 response
 */
export const jsonServerErrorResponse = (res: ServerResponse, msg?: string) => {
  return jsonErrorResponse(
    msg ?? 'We experienced an unexpected issue, please try again later',
    res,
    500,
  );
};

/**
 * Take a html string and write it to the response.
 */
export const writeToHtml = (
  html: string,
  res: ServerResponse,
): ServerResponse => {
  return res
    .setHeader('Content-Type', 'text/html')
    .end('<!DOCTYPE html>\n' + html);
};

/**
 * Write a redirect response
 */
export const writeRedirect = (
  location: string,
  res: ServerResponse,
): ServerResponse => {
  return res
    .writeHead(302, {
      Location: location,
    })
    .end();
};

export const setSessionCookie = (token: string, res: ServerResponse): void => {
  const cookieString = `sessionToken=${token}; HttpOnly; Secure; SameSite=Lax; Path=/`;
  res.setHeader('Set-Cookie', cookieString);
};
