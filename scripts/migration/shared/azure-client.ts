/**
 * Azure Blob Storage client setup for migration scripts
 */

import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { AzureStorageConfig } from './types';

// Cache clients by container name to support multiple containers
const containerClients = new Map<string, ContainerClient>();
let blobServiceClient: BlobServiceClient | null = null;

export function getAzureContainerClient(config: AzureStorageConfig): ContainerClient {
  // Get or create blob service client (shared across containers)
  if (!blobServiceClient) {
    const connectionString = `DefaultEndpointsProtocol=https;AccountName=${config.accountName};AccountKey=${config.accountKey};EndpointSuffix=core.windows.net`;
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }
  
  // Get or create container client for this specific container name
  if (!containerClients.has(config.containerName)) {
    const client = blobServiceClient.getContainerClient(config.containerName);
    containerClients.set(config.containerName, client);
  }
  
  return containerClients.get(config.containerName)!;
}

export function resetAzureClient(): void {
  containerClients.clear();
  blobServiceClient = null;
}

