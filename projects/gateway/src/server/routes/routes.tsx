import { BillPage } from '../../client/pages/bills/[id]/page.tsx';
import { HomePage } from '../../client/pages/page.tsx';
import { resolveRouteSegments } from '../services/resolveRouteSegments.ts';
import { writeToHtml, writeToJson } from '../services/responseHelpers.ts';
import { RequestHandler } from '../types/requestHandler.ts';
import { staticRouteHandler } from './static.ts';

/**
 * All routes for our app
 */
export const routes: Record<string, RequestHandler> = {
  '/': async (req, res, { staticFileService }) => {
    const staticAssets = staticFileService.getPageAssetFilenames(req.url);
    return writeToHtml(<HomePage staticAssets={staticAssets} />, res);
  },
  '/api/bills': async (req, res, { billService }) => {
    // Post a new bill with a receipt file upload
    if (req.method === 'POST') {
      try {
        const bill = await billService.create(req);
        return writeToJson({ data: bill }, res);
      } catch (err) {
        console.error(err);
        res.statusCode = 400;
        return writeToJson(
          { error: { message: 'We were unable to parse your file' } },
          res,
        );
      }
    }
    res.statusCode = 405;
    return writeToJson(
      { error: { message: `method ${req.method} not allowed` } },
      res,
    );
  },
  '/api/bills/:id': async (req, res, { billService }) => {
    if (req.method === 'GET') {
      try {
        const { id } = resolveRouteSegments(req.url, req.urlPattern);
        const bill = await billService.read(id);
        return writeToJson({ data: bill }, res);
      } catch (err) {
        console.error(err);
        res.statusCode = 400;
        return writeToJson(
          {
            error: {
              message: 'We were unable to get the resource you requested',
            },
          },
          res,
        );
      }
    }
    res.statusCode = 405;
    return writeToJson(
      { error: { message: `method ${req.method} not allowed` } },
      res,
    );
  },
  '/bills/:id': async (req, res, { billService, staticFileService }) => {
    const { id } = resolveRouteSegments(req.url, req.urlPattern);

    const bill = await billService.read(id);

    const staticAssets = staticFileService.getPageAssetFilenames(
      req.urlPattern,
    );
    return writeToHtml(
      <BillPage staticAssets={staticAssets} bill={bill} />,
      res,
    );
  },
  // Static route handlers (local development only)
  '/static/**': staticRouteHandler,
};
