import { hydrateRootElement } from '../../utils/hydrateRootElement.tsx';
import { VerifyAccessData } from './dto.ts';
import { VerifyAccess } from './VerifyAccess.tsx';

declare let window: Window & {
  verifyAccess: unknown;
};

hydrateRootElement(
  <VerifyAccess verifyAccess={VerifyAccessData.parse(window.verifyAccess)} />,
);
