import ReactDomClient from 'react-dom/client';
import { WindowWithStaticAssets } from '../../types/WindowWithStaticAssets.ts';
import { BillPage } from './page.tsx';

declare let window: WindowWithStaticAssets;

ReactDomClient.hydrateRoot(
  document,
  <BillPage staticAssets={window.staticAssets} />,
);
