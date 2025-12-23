import { hydrateRootElement } from '../../utils/hydrateRootElement.tsx';
import { ErrorPageData } from './dto.ts';
import { ErrorStatus } from './ErrorStatus.tsx';

declare let window: Window & {
  errorStatus: unknown;
};

hydrateRootElement(
  <ErrorStatus {...ErrorPageData.parse(window.errorStatus)} />,
);
