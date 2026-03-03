import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import logger from '@/logger';

export const generateUniqueFileName = (filename: string) => {
  const sanitizedFilename = filename
    .replace(/[&!@#$%^&*()-+=`~;:{}'",?/<>[\]\s]/g, '_')
    .toLowerCase();

  const randomString = `${Date.now()}${Math.random().toString().replace('.', '')}`;

  return `${process.env.NODE_ENV}/${randomString}_${sanitizedFilename}`;
};

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
  region: process.env.AWS_REGION,
});

export const uploadFile = async (file: Buffer, filename: string) => {
  const key = generateUniqueFileName(filename);
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: file,
  });
  try {
    await s3Client.send(command);
    // console.log(response, key);
    return key;
  } catch (err) {
    logger.error((err as Error).message);
  }
};

export const deleteFile = async (key: string) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    // console.log(result);
    logger.info(`Object ${key} deleted successfully.`);
  } catch (error) {
    logger.error(`Error deleting object ${key}`);
    logger.error((error as Error).message);
  }
};

export const getPresignedGetObjectUrl = async (
  key: string,
  expiresInSeconds: number = 60 * 60 // 3600s = 60 minutes
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  });
  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    return url;
  } catch (err) {
    logger.error(`Failed to generate presigned URL for key: ${key}`);
    logger.error((err as Error).message);
    throw err;
  }
};
