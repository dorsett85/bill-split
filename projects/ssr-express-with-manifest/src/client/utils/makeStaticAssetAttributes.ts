import type { StaticAssetAttributes } from '../types/staticAssetAttributes.ts';

/**
 * Takes a list of static filenames and maps them with the appropriate html
 * attributes.
 *
 *  We'll probably need to add other static assets here as well at some point
 */
export const makeStaticAssetAttributes = (filenames: {
  js: string[];
  css: string[];
}): StaticAssetAttributes => {
  const links: StaticAssetAttributes['links'] = filenames.css.map((href) => ({
    rel: 'stylesheet',
    href,
  }));
  const scripts: StaticAssetAttributes['scripts'] = filenames.js.map((src) => ({
    type: 'module',
    src,
  }));

  return { links, scripts };
};
