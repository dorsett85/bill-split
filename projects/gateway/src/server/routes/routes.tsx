import { RequestHandler } from '../types/requestHandler.ts';
import { writeToHtml, writeToJson } from '../services/responseHelpers.ts';
import { HomePage } from '../../client/pages/page.tsx';
import { BillPage } from '../../client/pages/bill/page.tsx';

/**
 * All non-static routes for our app
 */
export const routes: Record<string, RequestHandler> = {
  '/': async (req, res, { staticFileService }) => {
    const staticAssets = staticFileService.getPageAssetFilenames(req.url);
    return writeToHtml(<HomePage staticAssets={staticAssets} />, res);
  },
  '/bill': async (req, res, { staticFileService }) => {
    const staticAssets = staticFileService.getPageAssetFilenames(req.url);
    return writeToHtml(<BillPage staticAssets={staticAssets} />, res);
  },
  '/api': async (req, res) => {
    console.log('request:', req);
    const json = { data: 'REST api coming soon' };

    return writeToJson(json, res);
  },
};
