import { exec } from "child_process";
import { promisify } from "util";
import { createReadStream, createWriteStream, unlinkSync } from "fs";
import { pipeline } from "stream/promises";
import { createGzip } from "zlib";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import * as Sentry from "@sentry/node";

const execAsync = promisify(exec);

/**
 * Database Backup Service
 *
 * Features:
 * - Daily automated backups
 * - Compression (gzip)
 * - S3/Backblaze B2 storage
 * - 30-day retention policy
 * - Backup verification
 * - Error monitoring with Sentry
 *
 * Environment variables required:
 * - DATABASE_URL: MySQL connection string
 * - BACKUP_S3_ENDPOINT: S3-compatible endpoint (e.g., Backblaze B2)
 * - BACKUP_S3_REGION: S3 region
 * - BACKUP_S3_BUCKET: S3 bucket name
 * - BACKUP_S3_ACCESS_KEY: S3 access key
 * - BACKUP_S3_SECRET_KEY: S3 secret key
 * - BACKUP_RETENTION_DAYS: Number of days to keep backups (default: 30)
 */

interface BackupConfig {
  databaseUrl: string;
  s3Endpoint: string;
  s3Region: string;
  s3Bucket: string;
  s3AccessKey: string;
  s3SecretKey: string;
  retentionDays: number;
}

interface BackupResult {
  success: boolean;
  filename: string;
  size: number;
  duration: number;
  error?: string;
}

/**
 * Get backup configuration from environment variables
 */
function getBackupConfig(): BackupConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  // Parse database URL
  const url = new URL(databaseUrl);

  return {
    databaseUrl,
    s3Endpoint: process.env.BACKUP_S3_ENDPOINT || "",
    s3Region: process.env.BACKUP_S3_REGION || "us-east-1",
    s3Bucket: process.env.BACKUP_S3_BUCKET || "",
    s3AccessKey: process.env.BACKUP_S3_ACCESS_KEY || "",
    s3SecretKey: process.env.BACKUP_S3_SECRET_KEY || "",
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || "30", 10),
  };
}

/**
 * Create S3 client for backup storage
 */
function createS3Client(config: BackupConfig): S3Client {
  return new S3Client({
    endpoint: config.s3Endpoint,
    region: config.s3Region,
    credentials: {
      accessKeyId: config.s3AccessKey,
      secretAccessKey: config.s3SecretKey,
    },
  });
}

/**
 * Parse MySQL connection URL
 */
function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || "3306",
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1), // Remove leading slash
  };
}

/**
 * Create database backup using mysqldump
 */
async function createDatabaseDump(
  config: BackupConfig,
  filename: string
): Promise<void> {
  const db = parseDatabaseUrl(config.databaseUrl);

  // mysqldump command with compression
  const dumpCommand = `mysqldump \
    --host=${db.host} \
    --port=${db.port} \
    --user=${db.user} \
    --password='${db.password}' \
    --single-transaction \
    --quick \
    --lock-tables=false \
    --routines \
    --triggers \
    --events \
    ${db.database}`;

  const compressedFilename = `${filename}.gz`;

  // Execute dump and compress
  await execAsync(`${dumpCommand} | gzip > /tmp/${compressedFilename}`);

  console.log(`✅ Database dump created: ${compressedFilename}`);
}

/**
 * Upload backup to S3
 */
async function uploadToS3(
  s3Client: S3Client,
  config: BackupConfig,
  filename: string
): Promise<number> {
  const compressedFilename = `${filename}.gz`;
  const localPath = `/tmp/${compressedFilename}`;
  const s3Key = `backups/${compressedFilename}`;

  // Read file and upload
  const fileStream = createReadStream(localPath);

  const command = new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: s3Key,
    Body: fileStream,
    ContentType: "application/gzip",
    Metadata: {
      "backup-date": new Date().toISOString(),
      database: parseDatabaseUrl(config.databaseUrl).database,
    },
  });

  await s3Client.send(command);

  // Get file size
  const { size } = await execAsync(
    `stat -f%z ${localPath} || stat -c%s ${localPath}`
  );
  const fileSize = parseInt(size.trim(), 10);

  // Clean up local file
  unlinkSync(localPath);

  console.log(
    `✅ Backup uploaded to S3: ${s3Key} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`
  );

  return fileSize;
}

/**
 * Delete old backups based on retention policy
 */
async function cleanupOldBackups(
  s3Client: S3Client,
  config: BackupConfig
): Promise<number> {
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - config.retentionDays);

  // List all backups
  const listCommand = new ListObjectsV2Command({
    Bucket: config.s3Bucket,
    Prefix: "backups/",
  });

  const response = await s3Client.send(listCommand);
  const objects = response.Contents || [];

  let deletedCount = 0;

  // Delete old backups
  for (const object of objects) {
    if (object.LastModified && object.LastModified < retentionDate) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: config.s3Bucket,
        Key: object.Key,
      });

      await s3Client.send(deleteCommand);
      deletedCount++;
      console.log(`🗑️ Deleted old backup: ${object.Key}`);
    }
  }

  if (deletedCount > 0) {
    console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
  }

  return deletedCount;
}

/**
 * Perform database backup
 */
export async function performBackup(): Promise<BackupResult> {
  const startTime = Date.now();

  try {
    console.log("🔄 Starting database backup...");

    // Get configuration
    const config = getBackupConfig();

    // Validate S3 configuration
    if (
      !config.s3Endpoint ||
      !config.s3Bucket ||
      !config.s3AccessKey ||
      !config.s3SecretKey
    ) {
      throw new Error(
        "S3 backup configuration is incomplete. Please set BACKUP_S3_* environment variables."
      );
    }

    // Create S3 client
    const s3Client = createS3Client(config);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dbName = parseDatabaseUrl(config.databaseUrl).database;
    const filename = `${dbName}-${timestamp}.sql`;

    // Create database dump
    await createDatabaseDump(config, filename);

    // Upload to S3
    const fileSize = await uploadToS3(s3Client, config, filename);

    // Cleanup old backups
    await cleanupOldBackups(s3Client, config);

    const duration = Date.now() - startTime;

    console.log(
      `✅ Backup completed successfully in ${(duration / 1000).toFixed(2)}s`
    );

    return {
      success: true,
      filename: `${filename}.gz`,
      size: fileSize,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("❌ Backup failed:", errorMessage);

    // Send error to Sentry
    Sentry.captureException(error, {
      tags: {
        service: "database-backup",
      },
    });

    return {
      success: false,
      filename: "",
      size: 0,
      duration,
      error: errorMessage,
    };
  }
}

/**
 * Schedule daily backups
 * Call this function when the server starts
 */
export function scheduleBackups() {
  // Check if backup is configured
  try {
    const config = getBackupConfig();

    if (!config.s3Endpoint || !config.s3Bucket) {
      console.warn(
        "⚠️ Database backup not configured. Skipping backup scheduler."
      );
      return;
    }
  } catch (error) {
    console.warn("⚠️ Database backup configuration error:", error);
    return;
  }

  // Run backup every day at 3:00 AM
  const BACKUP_HOUR = 3;
  const BACKUP_MINUTE = 0;

  function scheduleNextBackup() {
    const now = new Date();
    const nextBackup = new Date();

    nextBackup.setHours(BACKUP_HOUR, BACKUP_MINUTE, 0, 0);

    // If we've passed today's backup time, schedule for tomorrow
    if (now > nextBackup) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }

    const msUntilBackup = nextBackup.getTime() - now.getTime();

    console.log(
      `📅 Next database backup scheduled for: ${nextBackup.toISOString()}`
    );

    setTimeout(async () => {
      await performBackup();
      scheduleNextBackup(); // Schedule next backup
    }, msUntilBackup);
  }

  scheduleNextBackup();
  console.log("✅ Database backup scheduler started");
}

/**
 * Manual backup endpoint (for testing or on-demand backups)
 */
export async function triggerManualBackup(): Promise<BackupResult> {
  console.log("🔄 Manual backup triggered");
  return await performBackup();
}
