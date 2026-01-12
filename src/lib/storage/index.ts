import { LocalFileStorage } from './local'
import { StorageProvider, StorageProviderType } from './types'

/**
 * Storage provider factory
 * Creates the appropriate storage provider based on environment configuration
 */
export function createStorageProvider(): StorageProvider {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProviderType
  
  switch (provider) {
    case 'local':
      return new LocalFileStorage(
        process.env.LOCAL_UPLOAD_DIR || './uploads/attachments'
      )
    
    // Future providers can be added here:
    // case 's3':
    //   return new S3FileStorage({ ... })
    // case 'wasabi':
    //   return new WasabiFileStorage({ ... })
    
    default:
      console.warn(`Unknown storage provider: ${provider}, falling back to local`)
      return new LocalFileStorage()
  }
}

/**
 * Singleton instance of storage provider
 * Reused across requests for performance
 */
let storageInstance: StorageProvider | null = null

/**
 * Get the configured storage provider instance
 * @returns Storage provider
 */
export function getStorage(): StorageProvider {
  if (!storageInstance) {
    storageInstance = createStorageProvider()
  }
  return storageInstance
}

// Re-export types for convenience
export * from './types'
