import { createTheme, MantineProvider } from '@mantine/core';
import { ReactElement, StrictMode } from 'react';
import ReactDomClient from 'react-dom/client';

const theme = createTheme({});

/**
 * ID of the root container element where we'll hydrate the page
 */
export const rootId = 'root';

export const hydrateRootElement = (elem: ReactElement): void => {
  const root = document.getElementById(rootId);
  if (root) {
    ReactDomClient.hydrateRoot(
      root,
      <StrictMode>
        <MantineProvider defaultColorScheme="auto" theme={theme}>
          {elem}
        </MantineProvider>
      </StrictMode>,
    );
  } else {
    console.error('Unable to find root element to hydrate');
  }
};
