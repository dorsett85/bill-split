import { StaticAssetAttributes } from '../types/staticAssetAttributes.ts';

/**
 * Takes a list of static filenames and maps them with the appropriate html
 * attributes.
 *
 *  We'll probably need to add other static assets here as well at some point
 */
export const makeStaticAssetAttributes = (
  filenames: string[],
): StaticAssetAttributes => {
  const links: StaticAssetAttributes['links'] = [];
  const scripts: StaticAssetAttributes['scripts'] = [];

  filenames.forEach((filename) => {
    if (filename.endsWith('.css')) {
      links.push({
        rel: 'stylesheet',
        href: filename,
      });
    } else if (filename.endsWith('.js')) {
      scripts.push({
        type: 'module',
        src: filename,
      });
    }
  });

  return { links, scripts };
};
