// @ts-expect-error - This import is required to augment the entire module
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Formidable from 'formidable';

declare module 'formidable' {
  /**
   * Add additional missing fields here as needed (e.g., `filepath`)
   */
  interface VolatileFile {
    newFilename: string;
  }
}
