import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2Output,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export interface S3ObjectSummary {
  key: string;
  size?: number;
  lastModified?: Date;
  eTag?: string;
}

export interface S3ObjectMetadata {
  contentType: string;
  contentLength: number;
  metadata?: Record<string, string>;
  lastModified?: Date;
  eTag?: string;
}

export interface S3ObjectContent extends S3ObjectMetadata {
  body: Readable;
}

export interface S3UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('S3_REGION', 'us-east-1');
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || undefined;
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY') || undefined;
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY') || undefined;
    const forcePathStyle = this.configService.get<boolean>('S3_FORCE_PATH_STYLE', true);

    this.bucket = this.configService.get<string>('S3_BUCKET', 'agri-platform');

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });
  }

  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | Readable | string,
    contentType = 'application/octet-stream',
    options: S3UploadOptions = {},
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: options.contentType ?? contentType,
      Metadata: options.metadata,
    });
    await this.client.send(command);
    this.logger.debug(`Uploaded object to s3://${this.bucket}/${key}`);
    return key;
  }

  async getFile(key: string): Promise<S3ObjectContent> {
    try {
      const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const result = await this.client.send(command);
      return {
        body: result.Body as Readable,
        contentType: result.ContentType ?? 'application/octet-stream',
        contentLength: result.ContentLength ?? 0,
        metadata: result.Metadata,
        lastModified: result.LastModified,
        eTag: result.ETag,
      };
    } catch (error) {
      this.throwIfMissing(error, key);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
    await this.client.send(command);
    this.logger.debug(`Deleted object s3://${this.bucket}/${key}`);
  }

  async getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async listFiles(prefix: string): Promise<S3ObjectSummary[]> {
    const objects: S3ObjectSummary[] = [];
    let continuationToken: string | undefined;

    do {
      const output: ListObjectsV2Output = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      if (output.Contents) {
        for (const object of output.Contents) {
          if (!object.Key) continue;
          objects.push({
            key: object.Key,
            size: object.Size,
            lastModified: object.LastModified,
            eTag: object.ETag,
          });
        }
      }

      continuationToken = output.IsTruncated ? output.NextContinuationToken : undefined;
    } while (continuationToken);

    return objects;
  }

  async getFileMetadata(key: string): Promise<S3ObjectMetadata> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        contentType: result.ContentType ?? 'application/octet-stream',
        contentLength: result.ContentLength ?? 0,
        metadata: result.Metadata,
        lastModified: result.LastModified,
        eTag: result.ETag,
      };
    } catch (error) {
      this.throwIfMissing(error, key);
      throw error;
    }
  }

  private throwIfMissing(error: unknown, key: string): void {
    if (error instanceof Error) {
      const name = error.name;
      if (name === 'NoSuchKey' || name === 'NotFound') {
        throw new NotFoundException(`File not found in storage: ${key}`);
      }
    }
  }
}