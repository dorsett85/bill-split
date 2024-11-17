import {
  FileStorageOutput,
  FileStorageService,
} from '../types/fileStorageService.ts';
import { ServerRequest } from '../types/requestHandler.ts';
import fs from 'fs';
import path from 'path';
import formidable, { VolatileFile } from 'formidable';
import { PassThrough } from 'node:stream';

interface StaticFileServiceConstructorInput {
  /**
   * Absolute base path for storing files
   */
  storagePath: string;
}

export class LocalFileStorageService implements FileStorageService {
  private readonly storagePath: string;

  constructor({ storagePath }: StaticFileServiceConstructorInput) {
    this.storagePath = storagePath;
  }

  async store(req: ServerRequest): Promise<FileStorageOutput[]> {
    // parse a file upload
    const form = formidable({
      keepExtensions: true,
      fileWriteStreamHandler: (file) => {
        const pass = new PassThrough();
        if (!(file instanceof VolatileFile)) {
          return pass;
        }

        if (!fs.existsSync(this.storagePath)) {
          fs.mkdirSync(this.storagePath);
        }
        const filePath = path.join(this.storagePath, file.newFilename);
        const stream = fs.createWriteStream(filePath);
        pass.pipe(stream);

        return pass;
      },
    });

    const files = (await form.parse(req))[1];

    return Object.values(files)
      .flat()
      .filter((file) => file !== undefined)
      .map((file) => {
        return {
          path: path.join(this.storagePath, file.newFilename),
        };
      });
  }
}
