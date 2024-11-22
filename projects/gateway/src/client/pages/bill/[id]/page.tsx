import { BasePage } from '../../../components/BasePage/BasePage.tsx';
import React from 'react';
import { Bill } from './Bill.tsx';
import { PageProps } from '../../../types/pageProps.ts';
import { makeStaticAssetAttributes } from '../../../utils/makeStaticAssetAttributes.ts';

interface BillPageProps extends PageProps {
  bill: {
    image_path?: string;
  };
}

export const BillPage: React.FC<BillPageProps> = ({ staticAssets, bill }) => {
  const { links, scripts } = makeStaticAssetAttributes(staticAssets);

  return (
    <BasePage
      links={links}
      title="Bill Split: here's the bill you requested"
      body={<Bill bill={bill} />}
      scripts={scripts}
      serverProps={{ staticAssets, bill }}
    />
  );
};
