/**
 * File storage abstraction layer
 * Supports multiple providers (local, S3, Wasabi, Cloudflare R2, etc.)
 */

export interface FileMetadata {
  fileName: string
  fileType: string
  fileSize: number
}

export interface StorageProvider {
  /**
   * Upload a file and return its storage key
   * @param file - File buffer
   * @param metadata - File metadata
   * @returns Storage key (UUID for local, S3 key for cloud)
   */
  upload(file: Buffer, metadata: FileMetadata): Promise<string>

  /**
   * Download a file by its storage key
   * @param storageKey - File identifier
   * @returns File buffer
   */
  download(storageKey: string): Promise<Buffer>

  /**
   * Delete a file by its storage key
   * @param storageKey - File identifier
   */
  delete(storageKey: string): Promise<void>

  /**
   * Get public URL for a file (if applicable)
   * @param storageKey - File identifier
   * @returns URL or API endpoint
   */
  getUrl(storageKey: string): string
}

export type StorageProviderType = 'local' | 's3' | 'wasabi' | 'r2' | 'uploadthing'

export interface LocalStorageConfig {
  uploadDir: string
}

export interface S3StorageConfig {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string // For S3-compatible services like Wasabi
}

export type StorageConfig = {
  provider: StorageProviderType
  local?: LocalStorageConfig
  s3?: S3StorageConfig
  wasabi?: S3StorageConfig
}
