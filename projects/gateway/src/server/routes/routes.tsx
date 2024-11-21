import { RequestHandler } from '../types/requestHandler.ts';
import { writeToHtml, writeToJson } from '../services/responseHelpers.ts';
import { HomePage } from '../../client/pages/page.tsx';
import { BillPage } from '../../client/pages/bill/page.tsx';
import { Bill } from '../../models/BillModel.ts';

/**
 * All non-static routes for our app
 */
export const routes: Record<string, RequestHandler> = {
  '/': async (req, res, { staticFileService }) => {
    const staticAssets = staticFileService.getPageAssetFilenames(req.url);
    return writeToHtml(<HomePage staticAssets={staticAssets} />, res);
  },
  '/bill': async (req, res, { billService, staticFileService }) => {
    // Post a new bill with a receipt file upload
    if (req.method === 'POST') {
      let bill: Bill;
      try {
        bill = await billService.create(req);
      } catch (err) {
        console.error(err);
        res.statusCode = 400;
        return writeToJson(
          { error: 'We were unable to parse your file', reason: err },
          res,
        );
      }
      return writeToJson({ bill }, res);
    }

    const staticAssets = staticFileService.getPageAssetFilenames(req.url);
    return writeToHtml(<BillPage staticAssets={staticAssets} />, res);
  },
};
