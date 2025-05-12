import ReactDomClient from 'react-dom/client';
import { WindowWithStaticAssets } from '../types/WindowWithStaticAssets.ts';
import { HomePage } from './page.tsx';

declare let window: WindowWithStaticAssets;

ReactDomClient.hydrateRoot(
  document,
  <HomePage staticAssets={window.staticAssets} />,
);
