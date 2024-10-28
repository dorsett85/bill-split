import { BasePage } from '../../components/BasePage/BasePage';
import React from 'react';
import { Bill } from './Bill.tsx';
import { PageProps } from '../../types/pageProps.ts';
import { makeStaticAssetAttributes } from '../../utils/makeStaticAssetAttributes.ts';

export const BillPage: React.FC<PageProps> = ({ staticAssets }) => {
  const { links, scripts } = makeStaticAssetAttributes(staticAssets);

  return (
    <BasePage
      links={links}
      title="Bill Split: here's the bill you requested"
      body={<Bill />}
      scripts={scripts}
      serverProps={{ staticAssets }}
    />
  );
};
