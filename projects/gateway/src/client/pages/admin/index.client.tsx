import { hydrateRootElement } from '../../utils/hydrateRootElement.tsx';
import { Admin } from './Admin.tsx';
import { AdminData } from './dto.ts';

declare let window: Window & {
  admin: unknown;
};

hydrateRootElement(<Admin admin={AdminData.parse(window.admin)} />);
