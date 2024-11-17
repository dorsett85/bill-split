import { RequestHandler } from '../types/requestHandler.ts';
import { writeToHtml, writeToJson } from '../services/responseHelpers.ts';
import { HomePage } from '../../client/pages/page.tsx';
import { BillPage } from '../../client/pages/bill/page.tsx';
import { FileStorageOutput } from '../types/fileStorageService.ts';

/**
 * All non-static routes for our app
 */
export const routes: Record<string, RequestHandler> = {
  '/': async (req, res, { staticFileService }) => {
    const staticAssets = staticFileService.getPageAssetFilenames(req.url);
    return writeToHtml(<HomePage staticAssets={staticAssets} />, res);
  },
  '/bill': async (req, res, { fileStorageService, staticFileService }) => {
    // Post a new bill with a receipt file upload
    if (req.method === 'POST') {
      let storedFiles: FileStorageOutput[];
      try {
        storedFiles = await fileStorageService.store(req);
      } catch (err) {
        console.error(err);
        res.statusCode = 400;
        return writeToJson(
          { error: 'We were unable to parse your file', reason: err },
          res,
        );
      }
      return writeToJson({ storedFiles }, res);
    }

    const staticAssets = staticFileService.getPageAssetFilenames(req.url);
    return writeToHtml(<BillPage staticAssets={staticAssets} />, res);
  },
};
