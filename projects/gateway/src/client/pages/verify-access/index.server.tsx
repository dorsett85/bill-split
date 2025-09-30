import type React from 'react';
import ReactDomServer from 'react-dom/server';
import { BasePage } from '../../components/BasePage/BasePage.tsx';
import type { PageProps } from '../../types/pageProps.ts';
import { makeStaticAssetAttributes } from '../../utils/makeStaticAssetAttributes.ts';
import type { VerifyAccessData } from './dto.ts';
import { VerifyAccess } from './VerifyAccess.tsx';

interface VerifyAccessPageProps extends PageProps {
  data: VerifyAccessData;
}

export const render: React.FC<VerifyAccessPageProps> = ({
  staticAssets,
  data: verifyAccess,
}) => {
  const { links, scripts } = makeStaticAssetAttributes(staticAssets);

  return ReactDomServer.renderToString(
    <BasePage
      links={links}
      title="Bill Split: verify access"
      body={<VerifyAccess verifyAccess={verifyAccess} />}
      scripts={scripts}
      serverProps={{ verifyAccess }}
    />,
  );
};
