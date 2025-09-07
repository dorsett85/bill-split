/**
 * This interface will be used by all page level components
 */
export interface PageProps {
  /** An object with lists of static assets by type */
  staticAssets: { css: string[]; js: string[] };
}
