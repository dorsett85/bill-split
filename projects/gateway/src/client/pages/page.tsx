import { BasePage } from '../components/BasePage/BasePage';
import React from 'react';
import { PageProps } from '../components/BasePage/BasePage.types';
import { Home } from './Home.tsx';

export const HomePage: React.FC<PageProps> = ({ links, scripts }) => {
  return (
    <BasePage
      links={links}
      title="Bill Split: split the bill with friends and family"
      body={<Home />}
      scripts={scripts}
    />
  );
};
