import type { ServerRequest } from '../types/serverRequest.ts';

/**
 * Parse the url encoded form of a request object
 */
export const parseUrlEncodedForm = async (
  req: ServerRequest,
): Promise<Record<string, unknown>> => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const formData = Object.fromEntries(
        body.split('&').map((item) => {
          const [key, value] = item.split('=');
          return [key, decodeURIComponent(value)];
        }),
      );
      resolve(formData);
    });
  });
};
