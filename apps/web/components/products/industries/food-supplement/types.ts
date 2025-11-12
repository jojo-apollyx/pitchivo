/**
 * Food Supplement Product Form Types
 */

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

export interface FoodSupplementProductData {
  // Basic Information
  productImages: File[]
  productName: string
  originCountry: string
  manufacturerName: string
  casNumber: string
  fdaNumber: string
  einecs: string // European Inventory Number
  description: string
  category: string
  applications: string[]
  form: string // Physical form (powder, liquid, etc.)
  grade: string // Food grade, pharma grade, etc.
  
  // Specifications
  appearance: string // e.g., "White to off-white powder"
  odor: string
  taste: string
  solubility: string
  
  // Tiered Pricing
  priceTiers: PriceTier[]
  
  // Packaging & Logistics
  packagingType: string
  netWeight: string // e.g., "25kg per drum"
  paymentTerms: string
  shelfLife: number | null // in months
  incoterm: string
  storageConditions: string[]
  
  // Samples
  provideSample: string
  sampleType: string
  samplePrice: number | null
  sampleQuantity: number | null
  sampleLeadTime: string
  
  // Certificates & Compliance
  certificates: string[]
  certificateFiles: File[]
  certificateExpiryDate: string
  allergenInfo: string
  gmoStatus: string // Non-GMO, GMO, etc.
  irradiationStatus: string // Irradiated, Non-irradiated
  bseStatement: string // BSE/TSE free statement
  
  // Inventory
  warehouseLocations: WarehouseLocation[]
  
  // Documents
  coaFile: File | null
  tdsFile: File | null
  msdsFile: File | null
  specSheet: File | null
  otherFiles: File[]
  
  // Technical Data (COA/TDS fields)
  assay: number | null // % purity
  moisture: number | null // %
  ashContent: number | null // %
  bulkDensity: number | null // g/ml
  particleSize: string // e.g., "80 mesh"
  
  // Heavy Metals (ppm)
  lead: number | null
  arsenic: number | null
  cadmium: number | null
  mercury: number | null
  
  // Microbiological (cfu/g)
  totalPlateCount: number | null
  yeastMold: number | null
  eColiPresence: string // Negative/Positive
  salmonellaPresence: string // Negative/Positive
  staphylococcusPresence: string // Negative/Positive
  
  // Pesticide Residues
  pesticideResidue: string // e.g., "Complies with EU/USP/JP standards"
  
  // Others
  ph: string // e.g., "5.0-7.0"
  lossOnDrying: number | null // %
}

