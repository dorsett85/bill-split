import http from 'http';
import { App } from './client/App';
import fs from 'fs';
import path from 'path';
import ReactDomServer from 'react-dom/server';

const app = http.createServer((_req, res) => {
  if (_req.url === '/main.js') {
    const js = fs.readFileSync(path.join(__dirname, 'main.js')).toString();
    res.end(js);
    return;
  } else if (_req.url === '/main.css') {
    const css = fs.readFileSync(path.join(__dirname, `main.css`).toString());
    res.end(css);
    return;
  }

  const appHtml = ReactDomServer.renderToString(<App />);
  const html = fs
    .readFileSync(path.join(__dirname, '../src/template/index.html'))
    .toString();
  res.end(html.replace('<!--app-html-->', appHtml));
});

app.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});
