/**
 * Product form options and constants
 * Used across product creation and editing
 */

export const COUNTRIES = [
  'China',
  'USA',
  'Germany',
  'France',
  'India',
  'Japan',
  'Korea',
  'Brazil',
  'Netherlands',
  'Switzerland',
  'Italy',
  'Spain',
  'UK',
  'Canada',
  'Australia',
  'Poland',
  'Thailand',
  'Vietnam',
  'Indonesia',
  'Malaysia',
  'Singapore',
  'Mexico',
  'Turkey',
  'UAE',
  'South Africa',
  'Egypt',
  'Chile',
  'Argentina',
  'Other',
] as const

export const CERTIFICATES = [
  'ISO 9001',
  'ISO 22000',
  'GMP',
  'HACCP',
  'Halal',
  'Kosher',
  'Vegan',
  'Non-GMO',
  'Organic',
  'FSSC 22000',
  'BRC',
  'IFS',
  'REACH',
  'Sedex',
  'SA8000',
  'BSCI',
] as const

export const PACKAGING_TYPES = [
  'Fiber Drum',
  'Aluminum Foil Bag',
  'Carton',
  'Bottle',
  'PE Bag',
  'Vacuum Bag',
  'IBC Tote',
  'Bulk Bag (FIBC)',
  'Steel Drum',
] as const

export const PAYMENT_TERMS = [
  '100% T/T Advance',
  '30/70 Before Shipment',
  'T/T Against BL',
  'L/C at Sight',
  'L/C 60 days',
  'D/P',
  'D/A',
  'Open Account 30 Days',
] as const

export const INCOTERMS = [
  'EXW',
  'FCA',
  'FOB',
  'CFR',
  'CIF',
  'DAP',
  'DDP',
] as const

export const PRODUCT_CATEGORIES = [
  'Vitamin',
  'Mineral',
  'Botanical Extract',
  'Protein',
  'Probiotic',
  'Antioxidant',
  'Amino Acid',
  'Enzyme',
  'Omega Fatty Acid',
  'Fiber',
  'Herbal',
  'Other',
] as const

export const APPLICATIONS = [
  'Dietary Supplement',
  'Beverage',
  'Bakery',
  'Dairy',
  'Pharmaceutical',
  'Pet Food',
  'Sports Nutrition',
  'Functional Food',
  'Cosmetics',
  'Other',
] as const

export const SAMPLE_TYPES = [
  'Free',
  'Paid',
] as const

export const DOCUMENT_TYPES = [
  'COA',
  'TDS',
  'MSDS',
  'Specification Sheet',
  'Certificate',
  'Other',
] as const

export type Country = typeof COUNTRIES[number]
export type Certificate = typeof CERTIFICATES[number]
export type PackagingType = typeof PACKAGING_TYPES[number]
export type PaymentTerm = typeof PAYMENT_TERMS[number]
export type Incoterm = typeof INCOTERMS[number]
export type ProductCategory = typeof PRODUCT_CATEGORIES[number]
export type Application = typeof APPLICATIONS[number]
export type SampleType = typeof SAMPLE_TYPES[number]
export type DocumentType = typeof DOCUMENT_TYPES[number]

