/**
 * Azure Blob Storage client setup for migration scripts
 */

import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { AzureStorageConfig } from './types';

let containerClient: ContainerClient | null = null;

export function getAzureContainerClient(config: AzureStorageConfig): ContainerClient {
  if (!containerClient) {
    const connectionString = `DefaultEndpointsProtocol=https;AccountName=${config.accountName};AccountKey=${config.accountKey};EndpointSuffix=core.windows.net`;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(config.containerName);
  }
  return containerClient;
}

export function resetAzureClient(): void {
  containerClient = null;
}

