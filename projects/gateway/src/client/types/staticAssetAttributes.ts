import type {
  DetailedHTMLProps,
  LinkHTMLAttributes,
  ScriptHTMLAttributes,
} from 'react';

/**
 * These fields will be passed to link and script tags respectively
 */
export interface StaticAssetAttributes {
  /** Passed to a list of link elements */
  links: DetailedHTMLProps<
    LinkHTMLAttributes<HTMLLinkElement>,
    HTMLLinkElement
  >[];
  /** Passed to a list of script elements */
  scripts: DetailedHTMLProps<
    ScriptHTMLAttributes<HTMLScriptElement>,
    HTMLScriptElement
  >[];
}
