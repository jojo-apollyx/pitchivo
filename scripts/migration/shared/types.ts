/**
 * Shared types for migration scripts
 */

export interface MongoConnectionConfig {
  connectionString: string;
  databaseName?: string;
}

export interface AzureStorageConfig {
  accountName: string;
  accountKey: string;
  containerName: string;
}

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

export interface MigrationConfig {
  mongo: MongoConnectionConfig;
  azure: AzureStorageConfig;
  supabase: SupabaseConfig;
  batchSize?: number;
}

export interface BatchMetadata {
  batchNumber: number;
  collectionName: string;
  itemCount: number;
  blobUrl?: string;
  uploadedAt?: Date;
}

