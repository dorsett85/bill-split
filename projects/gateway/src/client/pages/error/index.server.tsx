import type React from 'react';
import ReactDomServer from 'react-dom/server';
import { BasePage } from '../../components/BasePage/BasePage.tsx';
import type { PageProps } from '../../types/pageProps.ts';
import { makeStaticAssetAttributes } from '../../utils/makeStaticAssetAttributes.ts';
import type { ErrorPageData } from './dto.ts';
import { ErrorStatus } from './ErrorStatus.tsx';

interface AdminPageProps extends PageProps {
  data: ErrorPageData;
}

export const render: React.FC<AdminPageProps> = ({
  staticAssets,
  data: error,
}) => {
  const { links, scripts } = makeStaticAssetAttributes(staticAssets);

  return ReactDomServer.renderToString(
    <BasePage
      links={links}
      title={`Bill Split: we've encountered a ${error.statusCode} error`}
      body={
        <ErrorStatus statusCode={error.statusCode} message={error.message} />
      }
      scripts={scripts}
      serverProps={{ errorStatus: error }}
    />,
  );
};
