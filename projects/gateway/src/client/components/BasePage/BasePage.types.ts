import {
  DetailedHTMLProps,
  LinkHTMLAttributes,
  ScriptHTMLAttributes,
} from 'react';

export interface PageProps {
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
