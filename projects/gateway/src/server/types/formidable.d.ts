// This unused import is required to augment the entire module
import * as Formidable from 'formidable';

declare module 'formidable' {
  /**
   * Add additional missing fields here as needed (e.g., `filepath`)
   */
  interface VolatileFile {
    newFilename: string;
  }
}
