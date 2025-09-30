import type React from 'react';
import ReactDomServer from 'react-dom/server';
import { BasePage } from '../../components/BasePage/BasePage.tsx';
import type { PageProps } from '../../types/pageProps.ts';
import { makeStaticAssetAttributes } from '../../utils/makeStaticAssetAttributes.ts';
import { Admin } from './Admin.tsx';
import type { AdminData } from './dto.ts';

interface AdminPageProps extends PageProps {
  data: AdminData;
}

export const render: React.FC<AdminPageProps> = ({
  staticAssets,
  data: admin,
}) => {
  const { links, scripts } = makeStaticAssetAttributes(staticAssets);

  return ReactDomServer.renderToString(
    <BasePage
      links={links}
      title="Bill Split: admin tools"
      body={<Admin admin={admin} />}
      scripts={scripts}
      serverProps={{ admin }}
    />,
  );
};
