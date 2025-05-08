import {
  FileStorageOutput,
  FileStorageService,
} from '../types/fileStorageService.ts';
import { ServerRequest } from '../types/requestHandler.ts';
import formidable, { VolatileFile } from 'formidable';
import { PassThrough } from 'node:stream';
import {
  CompleteMultipartUploadCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

interface S3FileServiceConstructorInput {
  bucketName: string;
  s3Client: S3Client;
}

export class S3FileStorageService implements FileStorageService {
  private readonly bucketName: string;
  private readonly s3Client: S3Client;

  constructor({ bucketName, s3Client }: S3FileServiceConstructorInput) {
    this.bucketName = bucketName;
    this.s3Client = s3Client;
  }

  async store(req: ServerRequest): Promise<FileStorageOutput[]> {
    const newUploadPromises: Promise<CompleteMultipartUploadCommandOutput>[] =
      [];

    const form = formidable({
      keepExtensions: true,
      fileWriteStreamHandler: (file) => {
        const pass = new PassThrough();
        if (!(file instanceof VolatileFile)) {
          return pass;
        }

        newUploadPromises.push(
          new Upload({
            client: this.s3Client,
            params: {
              Bucket: this.bucketName,
              Key: file.newFilename,
              Body: pass,
            },
          }).done(),
        );

        return pass;
      },
    });

    // parse a file upload
    await form.parse(req);

    const storageOutput: FileStorageOutput[] = [];
    for await (const uploadData of newUploadPromises) {
      storageOutput.push({
        path: uploadData.Location ?? '',
      });
    }

    return storageOutput;
  }
}
