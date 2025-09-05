import { ServerResponse } from 'node:http';
import {
  type NextFunction,
  type ServerRequest,
} from '../types/serverRequest.ts';
import { writeToHtml } from './responseHelpers.ts';

type HtmlMiddlewareOptions = {
  renderHtml: (url: string) => Promise<string | null> | string | null;
};

export const htmlMiddleware =
  ({ renderHtml }: HtmlMiddlewareOptions) =>
  async (req: ServerRequest, res: ServerResponse, next: NextFunction) => {
    const html = await renderHtml(req.url);

    if (html) {
      writeToHtml(html, res);
    } else {
      next();
    }
  };
