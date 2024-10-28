import React from 'react';
import ReactDomServer from 'react-dom/server';
import { ServerResponse } from 'node:http';
import path from 'path';

/**
 * One year in milliseconds
 */
const ONE_YEAR_IN_MILLIS = 365 * 24 * 60 * 60;

/**
 * Takes any Buffer and serializes it as a text response. Use the url arg to
 * determine the mimetype
 */
export const writeToText = (
  content: Buffer,
  url: string,
  res: ServerResponse,
): ServerResponse => {
  // This should have a more sophisticated mapping
  const mimeType = path
    .extname(url)
    .replace('.', '')
    .replace('js', 'javascript');

  return res
    .setHeader('Content-type', `text/${mimeType}`)
    .setHeader('Cache-Control', `max-age=${ONE_YEAR_IN_MILLIS}`)
    .end(content);
};

/**
 * Takes any object and serializes it as a json response
 * @param data
 * @param res
 */
export const writeToJson = (
  data: Record<never, never>,
  res: ServerResponse,
): ServerResponse => {
  return res
    .setHeader('Content-type', 'application/json')
    .end(JSON.stringify(data));
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
