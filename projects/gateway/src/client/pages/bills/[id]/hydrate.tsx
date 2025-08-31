import { hydrateRootElement } from '../../../utils/hydrateRootElement.tsx';
import { Bill } from './Bill.tsx';
import { BillData } from './types.ts';

declare let window: Window & {
  bill: BillData;
};

hydrateRootElement(<Bill bill={window.bill} />);
