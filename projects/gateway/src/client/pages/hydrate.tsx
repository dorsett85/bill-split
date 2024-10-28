import ReactDomClient from 'react-dom/client';
import { HomePage } from './page.tsx';
import { WindowWithStaticAssets } from '../types/WindowWithStaticAssets.ts';

declare let window: WindowWithStaticAssets;

ReactDomClient.hydrateRoot(
  document,
  <HomePage staticAssets={window.staticAssets} />,
);
