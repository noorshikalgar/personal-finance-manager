# Reminders Feature - Storage Configuration

## Overview
The reminders feature supports file attachments (receipts, bills, photos, PDFs) with a modular storage system that can be easily switched between providers.

## Storage Providers

### Local File Storage (Default)
Stores files in a local directory on the server.

**Environment Variables:**
```env
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=./uploads/attachments  # Optional, defaults to this value
```

**Pros:**
- ✅ Simple setup
- ✅ No external dependencies
- ✅ Free
- ✅ Fast for development

**Cons:**
- ❌ Files stored on server disk
- ❌ Not scalable for production
- ❌ Files lost if server is replaced

---

### Wasabi Cloud Storage (Recommended for Production)
S3-compatible cloud storage at $6.99/month for 1TB.

**Environment Variables:**
```env
STORAGE_PROVIDER=wasabi
WASABI_BUCKET=your-bucket-name
WASABI_REGION=us-east-1  # or us-east-2, us-west-1, eu-central-1
WASABI_ACCESS_KEY_ID=your-access-key
WASABI_SECRET_ACCESS_KEY=your-secret-key
WASABI_ENDPOINT=https://s3.us-east-1.wasabisys.com
```

**Setup Steps:**
1. Create account at [wasabi.com](https://wasabi.com)
2. Create a bucket
3. Generate access keys
4. Update `.env` with credentials

**Pros:**
- ✅ Cost-effective ($6.99/month for 1TB)
- ✅ No egress fees (vs AWS S3 ~$15/month)
- ✅ S3-compatible API
- ✅ Scalable
- ✅ Persistent across deployments

---

### AWS S3 (Alternative)
Amazon's cloud storage service.

**Environment Variables:**
```env
STORAGE_PROVIDER=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

**Pros:**
- ✅ Industry standard
- ✅ Global infrastructure
- ✅ Advanced features

**Cons:**
- ❌ More expensive (~$15-20/month)
- ❌ Egress fees

---

### Cloudflare R2 (Alternative)
Cloudflare's S3-compatible storage.

**Environment Variables:**
```env
STORAGE_PROVIDER=r2
R2_BUCKET=your-bucket-name
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

**Pros:**
- ✅ No egress fees
- ✅ S3-compatible
- ✅ Competitive pricing

---

## Migration Path

### Development → Production
1. **Start with local storage** for development
2. **Create Wasabi account** before production deployment
3. **Update environment variables** in production
4. **Existing files remain accessible** (migration not required)
5. **New uploads** automatically use new provider

### Switching Providers
The storage provider is determined per-file based on the `storageProvider` field in the database. This means:
- Old files remain accessible from their original storage
- New files use the current `STORAGE_PROVIDER` setting
- No migration script needed
- Gradual transition possible

---

## File Handling

### Supported File Types
- **Images:** JPEG, PNG, WebP (auto-optimized)
- **Documents:** PDF

### Size Limits
- **Images:** 5MB (before optimization)
- **PDFs:** 10MB

### Image Optimization
Images are automatically optimized using Sharp:
- Resized to max 1920x1080
- Converted to JPEG at 85% quality
- Original aspect ratio preserved

---

## Security

### Access Control
- ✅ Files only accessible by reminder owner
- ✅ Session-based authentication required
- ✅ Direct storage URLs not exposed publicly
- ✅ Downloads through authenticated API endpoint

### File Validation
- ✅ File type whitelist
- ✅ Size limit enforcement
- ✅ MIME type verification

---

## Cost Comparison (Monthly)

| Provider | Storage (1TB) | Egress | Total |
|----------|---------------|--------|-------|
| Local | Free | N/A | Free |
| Wasabi | $6.99 | Free | $6.99 |
| AWS S3 | $23 | ~$92/TB | ~$115 |
| R2 | $15 | Free | $15 |

**Recommendation:** Start with local, migrate to Wasabi for production.

---

## Implementation Notes

### Adding New Providers
To add a new storage provider (e.g., Google Cloud Storage):

1. Create implementation in `src/lib/storage/gcs.ts`:
```typescript
import { StorageProvider, FileMetadata } from './types'

export class GCSFileStorage implements StorageProvider {
  async upload(file: Buffer, metadata: FileMetadata): Promise<string> {
    // Implementation
  }
  
  async download(storageKey: string): Promise<Buffer> {
    // Implementation
  }
  
  async delete(storageKey: string): Promise<void> {
    // Implementation
  }
  
  getUrl(storageKey: string): string {
    // Return API endpoint
  }
}
```

2. Update factory in `src/lib/storage/index.ts`:
```typescript
case 'gcs':
  return new GCSFileStorage({ ... })
```

3. Document environment variables in this file

---

## Troubleshooting

### Files Not Uploading
- Check `STORAGE_PROVIDER` environment variable
- Verify file size is within limits
- Check file type is supported
- Inspect server logs for detailed errors

### Files Not Downloading
- Verify user owns the reminder
- Check storage provider credentials
- Ensure file exists in storage
- Verify network connectivity to cloud provider

### Migration Issues
- Files are stored per-file, no bulk migration needed
- Update `STORAGE_PROVIDER` in production environment
- Existing files remain accessible from old storage
- New uploads use new provider automatically

---

## Future Enhancements
- [ ] Automatic migration script for bulk file transfers
- [ ] CDN integration for faster image delivery
- [ ] Image thumbnails for gallery view
- [ ] Virus scanning for uploaded files
- [ ] Backup to secondary storage provider
