import fs from 'fs/promises'
import path from 'path'
import { StorageProvider, FileMetadata } from './types'

/**
 * Local filesystem storage provider
 * Stores files in a local directory with UUID-based naming
 */
export class LocalFileStorage implements StorageProvider {
  private uploadDir: string

  constructor(uploadDir: string = './uploads/attachments') {
    this.uploadDir = uploadDir
  }

  async upload(file: Buffer, metadata: FileMetadata): Promise<string> {
    // Ensure directory exists
    await fs.mkdir(this.uploadDir, { recursive: true })
    
    // Generate UUID for file
    const fileId = crypto.randomUUID()
    const ext = path.extname(metadata.fileName)
    const storageKey = `${fileId}${ext}`
    const filePath = path.join(this.uploadDir, storageKey)
    
    // Write file to disk
    await fs.writeFile(filePath, file)
    
    return storageKey
  }

  async download(storageKey: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, storageKey)
    
    try {
      return await fs.readFile(filePath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${storageKey}`)
      }
      throw error
    }
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = path.join(this.uploadDir, storageKey)
    
    try {
      await fs.unlink(filePath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, consider it deleted
        return
      }
      throw error
    }
  }

  getUrl(storageKey: string): string {
    // Return API endpoint for downloading
    return `/api/attachments/download/${storageKey}`
  }
}
