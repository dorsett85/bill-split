import type React from 'react';
import ReactDomServer from 'react-dom/server';
import { BasePage } from '../../../components/BasePage/BasePage.tsx';
import type { PageProps } from '../../../types/pageProps.ts';
import { makeStaticAssetAttributes } from '../../../utils/makeStaticAssetAttributes.ts';
import { Bill } from './Bill.tsx';
import type { BillData } from './dto.ts';

interface BillPageProps extends PageProps {
  data: BillData;
}

export const render: React.FC<BillPageProps> = ({
  staticAssets,
  data: bill,
}) => {
  const { links, scripts } = makeStaticAssetAttributes(staticAssets);

  return ReactDomServer.renderToString(
    <BasePage
      links={links}
      title="Bill Split: here's the bill you requested"
      body={<Bill bill={bill} />}
      scripts={scripts}
      serverProps={{ bill }}
    />,
  );
};
