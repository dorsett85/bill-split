import React, { ReactElement } from 'react';

interface HtmlProps {
  head: ReactElement;
  body: ReactElement;
}

export const Html: React.FC<HtmlProps> = ({ head, body }) => {
  return (
    <html lang="en">
      <head>{head}</head>
      <body>{body}</body>
    </html>
  );
};
