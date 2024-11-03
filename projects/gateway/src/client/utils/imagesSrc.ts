import wineGlassesPath from '../assets/images/favicon-32x32.png';

/**
 * The bundler adds `.` (periods) to the image import paths. We don't want this
 * because we're using them as absolute paths to the webserver, which is where
 * they'll get bundled to. An image path of `./favicon.png` would get
 * transformed to `/favicon.png`.
 */
const stripRelativePrefix = (path: string) => {
  return path.substring(path.lastIndexOf('/'));
};

export const wineGlassesSrc = stripRelativePrefix(wineGlassesPath);
