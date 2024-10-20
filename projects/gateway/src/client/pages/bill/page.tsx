import { BasePage } from '../../components/BasePage/BasePage';
import React from 'react';
import { PageProps } from '../../components/BasePage/BasePage.types';
import { Bill } from './Bill.tsx';

export const BillPage: React.FC<PageProps> = ({ links, scripts }) => {
  return (
    <BasePage
      links={links}
      title="Bill Split: here's the bill you requested"
      body={<Bill />}
      scripts={scripts}
    />
  );
};
