import { ServerResponse } from 'node:http';
import path from 'path';
import React from 'react';
import ReactDomServer from 'react-dom/server';

interface JsonDataResponse {
  data: Record<never, never>;
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
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

/**
 * Takes any Buffer and serializes it as a text response. Use the url arg to
 * determine the mimetype
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
export const writeToJson = (
  response: JsonResponse,
  res: ServerResponse,
): ServerResponse => {
  return res
    .setHeader('Content-type', 'application/json')
    .end(JSON.stringify(response));
};

/**
 * Takes a React element and renders it into a html document, then writes it to
 * the response.
 */
export const writeToHtml = (
  element: React.ReactNode,
  res: ServerResponse,
): ServerResponse => {
  const html = ReactDomServer.renderToString(element);

  return res
    .setHeader('Content-Type', 'text/html')
    .end('<!DOCTYPE html>\n' + html);
};
