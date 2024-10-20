import http from 'http';
import path from 'path';
import ReactDomServer from 'react-dom/server';
import { LocalStaticFileService } from './services/LocalStaticFileService.ts';
import { HomePage } from '../client/pages/page.tsx';
import { BillPage } from '../client/pages/bill/page.tsx';

const staticFileService = new LocalStaticFileService({
  staticDir: `${__dirname}/static`,
});
void staticFileService.populateHashFileNameCache();

const app = http.createServer(async (req, res) => {
  // Handle static asset requests
  if (req.url && staticFileService.hasAsset(req.url)) {
    const content = await staticFileService.getContent(req.url);
    const ext = path.extname(req.url).replace('.', '');

    res.setHeader('Content-type', `text/${ext}`);
    res.setHeader('Cache-Control', `max-age=${365 * 24 * 60 * 60}`);
    res.end(content);
    return;
  }

  // Handle REST api requests
  if (req.url?.startsWith('/api')) {
    const json = { data: 'REST api coming soon' };

    res.setHeader('Content-type', 'application/json');
    res.end(JSON.stringify(json));
    return;
  }

  // Handle SSR requests
  if (req.url === '/') {
    const html = ReactDomServer.renderToString(
      <HomePage
        links={[
          {
            rel: 'stylesheet',
            href: staticFileService.getHashFileName('index.css'),
          },
        ]}
        scripts={[{ src: staticFileService.getHashFileName('index.js') }]}
      />,
    );

    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html>\n' + html);
    return;
  } else if (req.url === '/bill') {
    const html = ReactDomServer.renderToString(
      <BillPage
        links={[
          {
            rel: 'stylesheet',
            href: staticFileService.getHashFileName('bill/index.css'),
          },
        ]}
        scripts={[{ src: staticFileService.getHashFileName('bill/index.js') }]}
      />,
    );

    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html>\n' + html);
    return;
  }

  // Fall through case
  res.statusCode = 400;
  res.end('We are unable to process your request');
});

app.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});
