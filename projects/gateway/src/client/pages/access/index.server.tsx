import type React from 'react';
import ReactDomServer from 'react-dom/server';
import { BasePage } from '../../components/BasePage/BasePage.tsx';
import type { PageProps } from '../../types/pageProps.ts';
import { makeStaticAssetAttributes } from '../../utils/makeStaticAssetAttributes.ts';
import { Access } from './Access.tsx';

export const render: React.FC<PageProps> = ({ staticAssets }) => {
  const { links, scripts } = makeStaticAssetAttributes(staticAssets);

  return ReactDomServer.renderToString(
    <BasePage
      links={links}
      title="Bill Split: enter valid code for access"
      body={<Access />}
      scripts={scripts}
    />,
  );
};
