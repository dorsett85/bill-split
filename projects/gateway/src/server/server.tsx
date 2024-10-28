import http from 'http';
import { LocalStaticFileService } from './services/LocalStaticFileService.ts';
import { HomePage } from '../client/pages/page.tsx';
import { BillPage } from '../client/pages/bill/page.tsx';
import {
  writeToHtml,
  writeToJson,
  writeToText,
} from './services/responseHelpers.ts';

const staticFileService = new LocalStaticFileService({
  staticDir: `${__dirname}/static`,
});
void staticFileService.populateHashFilenameCache();

const app = http.createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    return res.end('You need to specify a url in your request');
  }

  // Handle static asset requests
  if (req.url && staticFileService.hasAsset(req.url)) {
    const content = await staticFileService.getContent(req.url);

    return writeToText(content, req.url, res);
  }

  // Handle REST api requests
  if (req.url.startsWith('/api')) {
    const json = { data: 'REST api coming soon' };

    return writeToJson(json, res);
  }

  // Handle SSR requests
  const staticAssets = staticFileService.getPageAssetFilenames(req.url);

  if (req.url === '/') {
    return writeToHtml(<HomePage staticAssets={staticAssets} />, res);
  } else if (req.url === '/bill') {
    return writeToHtml(<BillPage staticAssets={staticAssets} />, res);
  }

  // Fall through case
  res.statusCode = 400;
  res.end('We are unable to process your request');
});

app.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});
