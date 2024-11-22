import ReactDomClient from 'react-dom/client';
import { WindowWithStaticAssets } from '../../../types/WindowWithStaticAssets.ts';
import { BillPage } from './page.tsx';

declare let window: WindowWithStaticAssets & {
  bill: {
    image_path?: string;
  };
};

ReactDomClient.hydrateRoot(
  document,
  <BillPage staticAssets={window.staticAssets} bill={window.bill} />,
);
