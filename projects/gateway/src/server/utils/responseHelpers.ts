import type { ServerResponse } from 'node:http';
import path from 'path';

export interface JsonDataResponse<
  TData extends Record<never, never> = Record<never, never>,
> {
  data: TData;
}

interface JsonErrorResponse {
  error: {
    message: string;
  };
}

type JsonResponse = JsonDataResponse | JsonErrorResponse;

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
export const writeToJson = <JResponse extends JsonResponse>(
  response: JResponse,
  res: ServerResponse,
): ServerResponse => {
  return res
    .setHeader('Content-type', 'application/json')
    .end(JSON.stringify(response));
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
