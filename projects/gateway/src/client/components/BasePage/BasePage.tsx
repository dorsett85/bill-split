import { Html } from '../Html/Html.tsx';
import React, { ReactElement } from 'react';
import { StaticAssetAttributes } from '../../types/staticAssetAttributes.ts';

export interface BasePageProps extends StaticAssetAttributes {
  title: string;
  body: ReactElement;
  /**
   * Use this option for any ssr props passed that need to be available to the
   * window object when the client hydrates the page.
   */
  serverProps?: Record<string, unknown>;
}

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
    <Html
      head={
        <>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>{title}</title>
          <script dangerouslySetInnerHTML={{ __html: bootstrapServerProps }} />
          {links.map((linkProps) => (
            <link key={linkProps.href} {...linkProps} />
          ))}
        </>
      }
      body={
        <div id="root">
          {body}
          {scripts.map((scriptProps) => (
            <script key={scriptProps.src} {...scriptProps}></script>
          ))}
        </div>
      }
    />
  );
};
