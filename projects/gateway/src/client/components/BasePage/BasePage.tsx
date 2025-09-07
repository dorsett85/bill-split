import { ColorSchemeScript, createTheme, MantineProvider } from '@mantine/core';
import type React from 'react';
import type { ReactElement } from 'react';
import packageJson from '../../../../package.json';
import type { StaticAssetAttributes } from '../../types/staticAssetAttributes.ts';
import { rootId } from '../../utils/hydrateRootElement.tsx';

export interface BasePageProps extends StaticAssetAttributes {
  title: string;
  body: ReactElement;
  /**
   * Use this option for any ssr props passed that need to be available to the
   * window object when the client hydrates the page.
   */
  serverProps?: Record<string, unknown>;
}

const theme = createTheme({});

// Get the raw version of mantine for the cdn link
const mantineVersion = packageJson.dependencies['@mantine/core'].replace(
  /^\D+/,
  '',
);

export const BasePage: React.FC<BasePageProps> = ({
  body,
  title,
  links,
  scripts,
  serverProps,
}) => {
  // Loop over each entry and add it to the window object
  const bootstrapServerProps = Object.entries(serverProps ?? {})
    .map(([key, value]) => `window['${key}'] = ${JSON.stringify(value)}`)
    .join(';');

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link
          rel="stylesheet"
          href={`https://unpkg.com/@mantine/core@${mantineVersion}/styles.css`}
        />
        <script dangerouslySetInnerHTML={{ __html: bootstrapServerProps }} />
        {links.map((linkProps) => (
          <link key={linkProps.href} {...linkProps} />
        ))}
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body style={{ margin: 0 }}>
        <div id={rootId}>
          <MantineProvider defaultColorScheme="auto" theme={theme}>
            {body}
          </MantineProvider>
        </div>

        {scripts.map((scriptProps) => (
          <script key={scriptProps.src} {...scriptProps}></script>
        ))}
      </body>
    </html>
  );
};
