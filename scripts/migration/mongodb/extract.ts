/**
 * MongoDB extraction logic - streams data in batches
 */

import { MongoClient, Db, Collection } from 'mongodb';
import { MongoCompanyLead, MongoProductLead, MongoPersonLead, MongoPurchaseLead, MongoIngredient } from './types';

export interface ExtractOptions {
  batchSize?: number;
  limit?: number;
  skip?: number;
  filter?: any; // MongoDB filter query
}

/**
 * Extract companies in batches
 */
export async function* extractCompanies(
  db: Db,
  options: ExtractOptions = {}
): AsyncGenerator<MongoCompanyLead[], void, unknown> {
  const { batchSize = 1000, limit, skip = 0 } = options;
  const collection = db.collection<MongoCompanyLead>('CompanyLead');
  
  let currentSkip = skip;
  let totalProcessed = 0;
  
  while (true) {
    // Calculate how many to fetch in this batch (respect limit)
    const remaining = limit ? Math.max(0, limit - totalProcessed) : batchSize;
    if (limit && remaining <= 0) {
      break;
    }
    
    const fetchSize = limit ? Math.min(batchSize, remaining) : batchSize;
    // Sort by _id for deterministic ordering (ensures skip counts are consistent across runs)
    const query = collection.find({}).sort({ _id: 1 }).skip(currentSkip).limit(fetchSize);
    
    const batch = await query.toArray();
    
    if (batch.length === 0) {
      break;
    }
    
    yield batch;
    
    currentSkip += batch.length;
    totalProcessed += batch.length;
    
    if (limit && totalProcessed >= limit) {
      break;
    }
  }
}

/**
 * Extract products in batches
 */
export async function* extractProducts(
  db: Db,
  options: ExtractOptions = {}
): AsyncGenerator<MongoProductLead[], void, unknown> {
  const { batchSize = 1000, limit, skip = 0, filter = {} } = options;
  const collection = db.collection<MongoProductLead>('ProductLead');
  
  let currentSkip = skip;
  let totalProcessed = 0;
  
  while (true) {
    // Calculate how many to fetch in this batch (respect limit)
    const remaining = limit ? Math.max(0, limit - totalProcessed) : batchSize;
    if (limit && remaining <= 0) {
      break;
    }
    
    const fetchSize = limit ? Math.min(batchSize, remaining) : batchSize;
    // Sort by _id for deterministic ordering (ensures skip counts are consistent across runs)
    const query = collection.find(filter).sort({ _id: 1 }).skip(currentSkip).limit(fetchSize);
    
    const batch = await query.toArray();
    
    if (batch.length === 0) {
      break;
    }
    
    yield batch;
    
    currentSkip += batch.length;
    totalProcessed += batch.length;
    
    if (limit && totalProcessed >= limit) {
      break;
    }
  }
}

/**
 * Extract contacts (person leads) in batches
 */
export async function* extractContacts(
  db: Db,
  options: ExtractOptions = {}
): AsyncGenerator<MongoPersonLead[], void, unknown> {
  const { batchSize = 1000, limit, skip = 0 } = options;
  const collection = db.collection<MongoPersonLead>('PersonLead');
  
  let currentSkip = skip;
  let totalProcessed = 0;
  
  while (true) {
    // Calculate how many to fetch in this batch (respect limit)
    const remaining = limit ? Math.max(0, limit - totalProcessed) : batchSize;
    if (limit && remaining <= 0) {
      break;
    }
    
    const fetchSize = limit ? Math.min(batchSize, remaining) : batchSize;
    // Sort by _id for deterministic ordering (ensures skip counts are consistent across runs)
    const query = collection.find({}).sort({ _id: 1 }).skip(currentSkip).limit(fetchSize);
    
    const batch = await query.toArray();
    
    if (batch.length === 0) {
      break;
    }
    
    yield batch;
    
    currentSkip += batch.length;
    totalProcessed += batch.length;
    
    if (limit && totalProcessed >= limit) {
      break;
    }
  }
}

/**
 * Extract purchases in batches
 */
export async function* extractPurchases(
  db: Db,
  options: ExtractOptions = {}
): AsyncGenerator<MongoPurchaseLead[], void, unknown> {
  const { batchSize = 1000, limit, skip = 0 } = options;
  const collection = db.collection<MongoPurchaseLead>('PurchaseLead');
  
  let currentSkip = skip;
  let totalProcessed = 0;
  
  while (true) {
    // Calculate how many to fetch in this batch (respect limit)
    const remaining = limit ? Math.max(0, limit - totalProcessed) : batchSize;
    if (limit && remaining <= 0) {
      break;
    }
    
    const fetchSize = limit ? Math.min(batchSize, remaining) : batchSize;
    // Sort by _id for deterministic ordering (ensures skip counts are consistent across runs)
    const query = collection.find({}).sort({ _id: 1 }).skip(currentSkip).limit(fetchSize);
    
    const batch = await query.toArray();
    
    if (batch.length === 0) {
      break;
    }
    
    yield batch;
    
    currentSkip += batch.length;
    totalProcessed += batch.length;
    
    if (limit && totalProcessed >= limit) {
      break;
    }
  }
}

/**
 * Extract ingredients in batches
 */
export async function* extractIngredients(
  db: Db,
  options: ExtractOptions = {}
): AsyncGenerator<MongoIngredient[], void, unknown> {
  const { batchSize = 1000, limit, skip = 0 } = options;
  const collection = db.collection<MongoIngredient>('Ingredient');
  
  let currentSkip = skip;
  let totalProcessed = 0;
  
  while (true) {
    // Calculate how many to fetch in this batch (respect limit)
    const remaining = limit ? Math.max(0, limit - totalProcessed) : batchSize;
    if (limit && remaining <= 0) {
      break;
    }
    
    const fetchSize = limit ? Math.min(batchSize, remaining) : batchSize;
    // Sort by _id for deterministic ordering (ensures skip counts are consistent across runs)
    const query = collection.find({}).sort({ _id: 1 }).skip(currentSkip).limit(fetchSize);
    
    const batch = await query.toArray();
    
    if (batch.length === 0) {
      break;
    }
    
    yield batch;
    
    currentSkip += batch.length;
    totalProcessed += batch.length;
    
    if (limit && totalProcessed >= limit) {
      break;
    }
  }
}

