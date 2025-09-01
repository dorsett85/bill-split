import { hydrateRootElement } from '../../../utils/hydrateRootElement.tsx';
import { Bill } from './Bill.tsx';
import { BillData } from './dto.ts';

declare let window: Window & {
  bill: unknown;
};

hydrateRootElement(<Bill bill={BillData.parse(window.bill)} />);
