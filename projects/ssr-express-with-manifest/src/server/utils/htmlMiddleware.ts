import type { ServerResponse } from 'node:http';
import {
  HtmlService,
  type LoadRenderModuleFunction,
} from '../services/HtmlService.ts';
import { LocalStaticFileService } from '../services/LocalStaticFileService.ts';
import type { ServerRequest } from '../types/serverRequest.ts';
import { writeToHtml } from './responseHelpers.ts';

type HtmlMiddlewareOptions = {
  path: string;
  loadRenderModule: LoadRenderModuleFunction;
};

export const htmlMiddleware =
  ({ loadRenderModule, path }: HtmlMiddlewareOptions) =>
  async (req: ServerRequest, res: ServerResponse) => {
    const htmlService = new HtmlService({
      loadRenderModule,
      staticFileService: new LocalStaticFileService({ path }),
    });
    const html = await htmlService.render(req.url);

    writeToHtml(html, res);
  };
