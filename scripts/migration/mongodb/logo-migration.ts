/**
 * Logo migration utility - downloads logos from URLs and uploads to Azure Blob Storage
 */

import { ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Get content type from URL or buffer
 */
function getContentType(url: string, buffer: Buffer): string {
  // Try to detect from URL extension
  const urlLower = url.toLowerCase();
  if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
    return 'image/jpeg';
  }
  if (urlLower.includes('.png')) {
    return 'image/png';
  }
  if (urlLower.includes('.webp')) {
    return 'image/webp';
  }
  if (urlLower.includes('.gif')) {
    return 'image/gif';
  }
  if (urlLower.includes('.svg')) {
    return 'image/svg+xml';
  }
  
  // Try to detect from magic bytes
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return 'image/jpeg';
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }
  
  // Default to jpeg
  return 'image/jpeg';
}

/**
 * Get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };
  return map[contentType] || 'jpg';
}

/**
 * Migrate company logo from URL to Azure Blob Storage
 * 
 * @param logoUrl Original logo URL
 * @param companyMongoId MongoDB company ID (for naming)
 * @param containerClient Azure container client (should be public access)
 * @returns New public URL or null if migration failed
 */
export async function migrateCompanyLogo(
  logoUrl: string,
  companyMongoId: string,
  containerClient: ContainerClient
): Promise<string | null> {
  if (!logoUrl || typeof logoUrl !== 'string') {
    return null;
  }
  
  try {
    // Validate URL
    let url: URL;
    try {
      url = new URL(logoUrl);
    } catch {
      // Invalid URL, return null
      return null;
    }
    
    // Generate a deterministic blob name based on company ID and URL hash for deduplication
    const urlHash = Buffer.from(logoUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    const urlHashShort = urlHash.substring(0, 12); // Use shorter hash for filename
    
    // Check if logo already exists in our container (deduplication)
    // Try to find existing blob by checking metadata or by naming pattern
    // We'll use a consistent naming: {companyMongoId}-{urlHash}.{ext}
    // First, download to detect extension, then check if exists
    
    // Download image (even if it's already in Azure, we want it in OUR container)
    console.log(`      Downloading logo from ${logoUrl}...`);
    const imageBuffer = await downloadImage(logoUrl);
    
    // Validate image size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (imageBuffer.length > maxSize) {
      throw new Error(`Image too large: ${imageBuffer.length} bytes (max ${maxSize})`);
    }
    
    // Detect content type
    const contentType = getContentType(logoUrl, imageBuffer);
    const extension = getExtensionFromContentType(contentType);
    
    // Generate deterministic blob name for deduplication: {companyMongoId}-{urlHash}.{ext}
    const blobName = `${companyMongoId}-${urlHashShort}.${extension}`;
    
    // Check if blob already exists (deduplication)
    const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);
    const exists = await blockBlobClient.exists();
    
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
    const containerName = containerClient.containerName;
    const publicUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
    
    if (exists) {
      console.log(`      ✓ Logo already exists in container "${containerName}", skipping upload: ${blobName}`);
      return publicUrl;
    }
    
    // Upload to Azure Blob Storage
    console.log(`      Uploading logo to container "${containerName}": ${blobName}`);
    
    await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      metadata: {
        originalUrl: logoUrl,
        migratedAt: new Date().toISOString(),
        companyMongoId: companyMongoId,
      },
    });
    
    // Return public URL
    console.log(`      ✓ Logo uploaded successfully: ${publicUrl}`);
    return publicUrl;
    
  } catch (error: any) {
    console.error(`      Error migrating logo: ${error.message}`);
    return null;
  }
}

/**
 * Batch migrate multiple logos
 */
export async function migrateCompanyLogos(
  logos: Array<{ url: string; mongoId: string }>,
  containerClient: ContainerClient,
  concurrency: number = 5
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const queue = [...logos];
  
  async function processNext() {
    while (queue.length > 0) {
      const { url, mongoId } = queue.shift()!;
      const migratedUrl = await migrateCompanyLogo(url, mongoId, containerClient);
      if (migratedUrl) {
        results.set(mongoId, migratedUrl);
      }
    }
  }
  
  // Process with concurrency limit
  await Promise.all(
    Array(Math.min(concurrency, queue.length))
      .fill(0)
      .map(() => processNext())
  );
  
  return results;
}

