import { ServerResponse } from 'node:http';
import { type ServerRequest } from '../types/serverRequest.ts';
import { writeToHtml } from './responseHelpers.ts';

type RenderHtmlInput = {
  staticAssets: {
    css: string[];
    js: string[];
  };
  data?: unknown;
};

type RenderHtmlModule = {
  render: (input: RenderHtmlInput) => string;
};

type Manifest = {
  entries: {
    [key: string]: {
      initial: {
        css: string[];
        js: string[];
      };
    };
  };
};

type HtmlMiddlewareOptions = {
  loadRenderModule: (
    url: string,
  ) => Promise<RenderHtmlModule> | RenderHtmlModule;
  loadManifest: () => Promise<Manifest> | Manifest;
};

export const htmlMiddleware =
  ({ loadManifest, loadRenderModule }: HtmlMiddlewareOptions) =>
  async (req: ServerRequest, res: ServerResponse) => {
    const indexModule = await loadRenderModule(req.url);

    const { entries } = await loadManifest();

    const { css = [], js = [] } = entries['index'].initial;
    const html = indexModule.render({ staticAssets: { css, js } });

    writeToHtml(html, res);
  };
