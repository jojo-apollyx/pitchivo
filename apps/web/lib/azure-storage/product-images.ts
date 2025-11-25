/**
 * Azure Blob Storage utility for product images
 * Uploads AI-generated product images to Azure Blob Storage with public access
 */

import { BlobServiceClient, ContainerClient, BlockBlobClient, PublicAccessType } from '@azure/storage-blob';

let productImagesContainerClient: ContainerClient | null = null;

/**
 * Get Azure Blob Storage container client for product images
 */
function getProductImagesContainerClient(): ContainerClient {
  if (!productImagesContainerClient) {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_PRODUCT_IMAGES_CONTAINER_NAME || 'product-images';

    if (!accountName || !accountKey) {
      throw new Error('Azure Storage credentials are required. Set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY');
    }

    const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    productImagesContainerClient = blobServiceClient.getContainerClient(containerName);
  }

  return productImagesContainerClient;
}

/**
 * Ensure product images container exists with public access
 */
async function ensureProductImagesContainer(): Promise<void> {
  const containerClient = getProductImagesContainerClient();
  const exists = await containerClient.exists();

  if (!exists) {
    // Create container with public blob access
    await containerClient.create({
      access: 'blob' as PublicAccessType,
    });
    console.log('[Azure Storage] Created product-images container with public access');
  } else {
    // Ensure access policy is set to public
    await containerClient.setAccessPolicy('blob' as PublicAccessType);
  }
}

/**
 * Upload product image to Azure Blob Storage
 * 
 * @param imageBuffer Image buffer data
 * @param filename Filename for the blob
 * @param contentType MIME type (default: 'image/png')
 * @param userId Optional user ID for organizing images
 * @returns Public URL of the uploaded image
 */
export async function uploadProductImageToAzure(
  imageBuffer: Buffer,
  filename: string,
  contentType: string = 'image/png',
  userId?: string
): Promise<string> {
  // Ensure container exists
  await ensureProductImagesContainer();

  const containerClient = getProductImagesContainerClient();
  
  // Generate blob name: {userId}/product-{timestamp}-{random}.png
  // If no userId, just use: product-{timestamp}-{random}.png
  const blobName = userId 
    ? `${userId}/products/${filename}`
    : `products/${filename}`;

  // Upload to Azure Blob Storage
  const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: 'public, max-age=31536000', // Cache for 1 year
    },
    metadata: {
      uploadedAt: new Date().toISOString(),
      userId: userId || 'anonymous',
    },
  });

  // Return public URL
  // Azure blob URLs are: https://{account}.blob.core.windows.net/{container}/{blob}
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
  const containerName = process.env.AZURE_STORAGE_PRODUCT_IMAGES_CONTAINER_NAME || 'product-images';
  const publicUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;

  return publicUrl;
}

/**
 * Upload base64 image to Azure Blob Storage
 * 
 * @param base64Image Base64 encoded image string
 * @param filename Filename for the blob
 * @param contentType MIME type (default: 'image/png')
 * @param userId Optional user ID for organizing images
 * @returns Public URL of the uploaded image
 */
export async function uploadBase64ProductImageToAzure(
  base64Image: string,
  filename: string,
  contentType: string = 'image/png',
  userId?: string
): Promise<string> {
  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  
  // Convert base64 to buffer
  const imageBuffer = Buffer.from(base64Data, 'base64');

  return uploadProductImageToAzure(imageBuffer, filename, contentType, userId);
}

