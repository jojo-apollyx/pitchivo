/**
 * Food Supplement Product Form Types (snake_case)
 * Matches PRODUCT_FIELDS schema and database structure
 */

// Export the canonical type from extraction schema
export type { FoodSupplementProductData } from '@/lib/industries/food-supplement/extraction-schema'

// Legacy camelCase types - kept for backward compatibility during migration
export interface PriceTier {
  id: string
  moq: number // Minimum Order Quantity in kg
  price: number // Price per kg in USD
  leadTime: number // Lead time in days
}

export interface WarehouseLocation {
  id: string
  country: string
  city: string
  quantity: number // in kg
}

