import type { ServerRequest } from '../types/serverRequest.ts';

/**
 * Parse cookies from the request object
 */
export const parseCookies = (
  req: ServerRequest,
): Record<string, string | undefined> => {
  const cookies: Record<string, string | undefined> = {};
  if (!req.headers.cookie) {
    return cookies;
  }
  req.headers.cookie.split(';').map((item) => {
    const [key, value] = item.trim().split('=');
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
  });
  return cookies;
};
