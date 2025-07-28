import { hydrateRootElement } from '../../../utils/hydrateRootElement.tsx';
import { Bill } from './Bill.tsx';

declare let window: Window & {
  bill: {
    image_path?: string;
    image_status: 'parsing' | 'ready' | 'error';
  };
};

hydrateRootElement(<Bill bill={window.bill} />);
