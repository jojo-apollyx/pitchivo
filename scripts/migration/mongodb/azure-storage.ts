/**
 * Azure Blob Storage helpers for storing raw MongoDB data
 */

import { ContainerClient, BlockBlobClient, PublicAccessType } from '@azure/storage-blob';
import { BatchMetadata } from '../shared/types';

/**
 * Upload batch data to Azure Blob Storage as JSONL
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
  publicAccess: PublicAccessType = 'none' as PublicAccessType
): Promise<void> {
  const exists = await containerClient.exists();
  
  if (!exists) {
    await containerClient.create({
      access: publicAccess,
    });
  } else {
    // Ensure access policy is set correctly
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

