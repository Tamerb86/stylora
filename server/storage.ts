// Storage helpers - S3 or local filesystem
// Uses AWS S3 or local filesystem fallback

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fs from "fs";
import * as path from "path";

// Check if S3 is configured
const isS3Configured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
};

// S3 Client (lazy initialization)
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || "eu-north-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

// Local storage directory
const LOCAL_STORAGE_DIR = path.join(process.cwd(), "uploads");

function ensureLocalStorageDir(): void {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Upload a file to storage (S3 or local filesystem)
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  if (isS3Configured()) {
    // Use S3
    const bucket = process.env.AWS_S3_BUCKET!;
    const client = getS3Client();

    const body = typeof data === "string" ? Buffer.from(data) : data;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );

    // Return public URL or presigned URL
    const region = process.env.AWS_REGION || "eu-north-1";
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return { key, url };
  } else {
    // Use local filesystem
    ensureLocalStorageDir();
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    const fileDir = path.dirname(filePath);

    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    const body =
      typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    fs.writeFileSync(filePath, body);

    // Return local URL (assumes files are served from /uploads)
    const url = `/uploads/${key}`;
    return { key, url };
  }
}

/**
 * Get a file URL from storage (S3 presigned URL or local path)
 */
export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  if (isS3Configured()) {
    // Use S3 presigned URL
    const bucket = process.env.AWS_S3_BUCKET!;
    const client = getS3Client();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    return { key, url };
  } else {
    // Use local filesystem
    const url = `/uploads/${key}`;
    return { key, url };
  }
}

/**
 * Check if storage is properly configured
 */
export function isStorageConfigured(): boolean {
  return isS3Configured();
}

/**
 * Get storage configuration info (for debugging)
 */
export function getStorageInfo(): {
  type: "s3" | "local";
  bucket?: string;
  region?: string;
} {
  if (isS3Configured()) {
    return {
      type: "s3",
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION || "eu-north-1",
    };
  }
  return { type: "local" };
}
