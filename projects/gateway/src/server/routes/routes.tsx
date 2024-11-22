import { RequestHandler } from '../types/requestHandler.ts';
import { writeToHtml, writeToJson } from '../services/responseHelpers.ts';
import { HomePage } from '../../client/pages/page.tsx';
import { BillPage } from '../../client/pages/bill/[id]/page.tsx';
import { resolveRouteSegments } from '../services/resolveRouteSegments.ts';

/**
 * All non-static routes for our app
 */
export const routes: Record<string, RequestHandler> = {
  // TODO add static dynamic routes. We no longer need to create them
  //  dynamically because we have the resolveRoute function.
  '/': async (req, res, { staticFileService }) => {
    const staticAssets = staticFileService.getPageAssetFilenames(req.url);
    return writeToHtml(<HomePage staticAssets={staticAssets} />, res);
  },
  '/bill': async (req, res, { billService }) => {
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
    res.statusCode = 404;
    return writeToHtml(<>We could not find the page you requested</>, res);
  },
  '/bill/[id]': async (req, res, { billService, staticFileService }) => {
    const { id } = resolveRouteSegments(req.url, '/bill/[id]');

    const bill = await billService.read(id);

    const staticAssets = staticFileService.getPageAssetFilenames('/bill/[id]');
    return writeToHtml(
      <BillPage staticAssets={staticAssets} bill={bill} />,
      res,
    );
  },
};
