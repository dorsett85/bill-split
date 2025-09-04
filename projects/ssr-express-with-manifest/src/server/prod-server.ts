import { createRequire } from 'node:module';
import fs from 'fs/promises';
import http from 'http';
import path from 'path';
import { writeToHtml, writeToText } from './utils/responseHelpers.ts';

const require = createRequire(import.meta.url);

const port = process.env.PORT || 3007;

async function preview() {
  const app = http.createServer(async (req, res) => {
    if (!req.url) {
      res.statusCode = 400;
      return res.end('You need to specify a url in your request');
    }

    // check for static assets (only do this testing prod build locally)
    try {
      const content = await fs.readFile(path.join('./dist', req.url));
      return writeToText(content, req.url, res);
    } catch {
      // no-op, not a static file we have
    }

    try {
      const remotesPath = path.join(process.cwd(), `./dist/server/index.js`);

      const importedApp = require(remotesPath);

      const { entries } = JSON.parse(
        await fs.readFile('./dist/manifest.json', 'utf-8'),
      );

      const { css = [], js = [] } = entries['index'].initial;
      const html = importedApp.render({ staticAssets: { css, js } });

      return writeToHtml(html, res);
    } catch (err) {
      console.error(err);
      // TODO send back catch all response
    }
  });

  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}

void preview();
