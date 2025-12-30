import type { PassThrough } from 'node:stream';

export interface FileStorageOutput {
  /**
   * Path to the stored file
   */
  path: string;
}

/**
 * Responsible for receiving requests that require storing files
 */
export interface FileStorageService {
  /**
   * Store streaming file(s)
   */
  store(pass: PassThrough, file: string): Promise<string | undefined>;
}
