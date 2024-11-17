import { ServerRequest } from './requestHandler.ts';

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
   * Store file(s) given a server request
   */
  store(req: ServerRequest): Promise<FileStorageOutput[]>;
}
