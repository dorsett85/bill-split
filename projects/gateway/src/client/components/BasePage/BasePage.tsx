import { Html } from '../Html/Html.tsx';
import React, { ReactElement } from 'react';
import { PageProps } from './BasePage.types.ts';

export interface BasePageProps extends PageProps {
  title: string;
  body: ReactElement;
}

export const BasePage: React.FC<BasePageProps> = ({
  body,
  title,
  links,
  scripts,
}) => {
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
