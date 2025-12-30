import type { PassThrough } from 'node:stream';
import { GetObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { FileStorageService } from '../types/fileStorageService.ts';

interface S3FileServiceConstructor {
  bucketName: string;
  s3Client: S3Client;
}

export class S3FileStorageService implements FileStorageService {
  private readonly bucketName: string;
  private readonly s3Client: S3Client;

  constructor({ bucketName, s3Client }: S3FileServiceConstructor) {
    this.bucketName = bucketName;
    this.s3Client = s3Client;
  }

  async store(
    pass: PassThrough,
    fileName: string,
  ): Promise<string | undefined> {
    const finishedUpload = await new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: fileName,
        Body: pass,
      },
    }).done();

    return finishedUpload.Location;
  }

  /**
   * Get a presigned url that the FE can access
   *
   * @param unsignedUrl - unsigned s3 bucket url
   */
  public getPresignedUrl(unsignedUrl: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: unsignedUrl.split('/').pop(),
    });

    return getSignedUrl(this.s3Client, command);
  }
}
