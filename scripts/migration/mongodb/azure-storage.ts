/**
 * Azure Blob Storage helpers for storing raw MongoDB data
 */

import { ContainerClient, BlockBlobClient, PublicAccessType } from '@azure/storage-blob';
import { BatchMetadata } from '../shared/types';

/**
 * Upload batch data to Azure Blob Storage as JSONL
 * Idempotent: checks if blob exists before uploading
 */
export async function uploadBatchToAzure(
  containerClient: ContainerClient,
  collectionName: string,
  batchNumber: number,
  batchData: any[]
): Promise<string> {
  // Create blob name: collection/batch-0001.jsonl
  const blobName = `${collectionName}/batch-${String(batchNumber).padStart(4, '0')}.jsonl`;
  const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  // Check if blob already exists (for idempotency)
  const exists = await blockBlobClient.exists();
  if (exists) {
    console.log(`    ℹ️  Blob already exists: ${blobName} (skipping upload)`);
    return blockBlobClient.url;
  }
  
  // Convert batch to JSONL format (one JSON object per line)
  const jsonlContent = batchData
    .map(item => JSON.stringify(item))
    .join('\n');
  
  // Upload to Azure
  await blockBlobClient.upload(jsonlContent, jsonlContent.length, {
    blobHTTPHeaders: {
      blobContentType: 'application/x-ndjson',
    },
  });
  
  // Return blob URL
  return blockBlobClient.url;
}

/**
 * Create container if it doesn't exist
 */
export async function ensureContainerExists(
  containerClient: ContainerClient,
  publicAccess?: PublicAccessType
): Promise<void> {
  const exists = await containerClient.exists();
  
  if (!exists) {
    // If publicAccess is provided, use it; otherwise create private container
    const createOptions = publicAccess ? { access: publicAccess } : {};
    await containerClient.create(createOptions);
  } else if (publicAccess) {
    // Only update access policy if publicAccess is specified
    // For private containers, don't call setAccessPolicy
    await containerClient.setAccessPolicy(publicAccess);
  }
}

/**
 * Get batch metadata
 */
export function createBatchMetadata(
  collectionName: string,
  batchNumber: number,
  itemCount: number,
  blobUrl?: string
): BatchMetadata {
  return {
    batchNumber,
    collectionName,
    itemCount,
    blobUrl,
    uploadedAt: blobUrl ? new Date() : undefined,
  };
}

