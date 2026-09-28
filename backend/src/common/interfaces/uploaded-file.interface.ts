export interface UploadedMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  path?: string;
  destination?: string;
  filename?: string;
}

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export function isUploadedFile(value: unknown): value is UploadedMulterFile {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const file = value as UploadedMulterFile;
  return (
    typeof file.fieldname === 'string' &&
    typeof file.originalname === 'string' &&
    typeof file.mimetype === 'string' &&
    typeof file.size === 'number' &&
    (Buffer.isBuffer(file.buffer) || typeof file.path === 'string')
  );
}