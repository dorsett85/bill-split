import React from 'react';
import { BasePage } from '../components/BasePage/BasePage';
import { PageProps } from '../types/pageProps.ts';
import { makeStaticAssetAttributes } from '../utils/makeStaticAssetAttributes.ts';
import { Home } from './Home.tsx';

export const HomePage: React.FC<PageProps> = ({ staticAssets }) => {
  const { links, scripts } = makeStaticAssetAttributes(staticAssets);

  return (
    <BasePage
      links={links}
      title="Bill Split: split the bill with friends and family"
      body={<Home />}
      scripts={scripts}
      serverProps={{ staticAssets }}
    />
  );
};
