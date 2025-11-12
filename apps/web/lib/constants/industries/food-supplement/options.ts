/**
 * Food Supplement Industry - Comprehensive Options
 * Based on industry best practices and most commonly used values
 */

// Manufacturing Countries (Food Supplement Industry)
export const FOOD_SUPPLEMENT_COUNTRIES = [
  'China', // Largest supplier of raw materials
  'USA',
  'India', // Second largest supplier
  'Germany',
  'France',
  'Netherlands',
  'Switzerland',
  'Italy',
  'Spain',
  'UK',
  'Japan',
  'South Korea',
  'Brazil',
  'Poland',
  'Denmark',
  'Belgium',
  'Canada',
  'Australia',
  'New Zealand',
  'Ireland',
  'Sweden',
  'Finland',
  'Norway',
  'Israel',
  'Singapore',
  'Malaysia',
  'Thailand',
  'Vietnam',
  'Indonesia',
  'Mexico',
  'Chile',
  'Argentina',
  'Peru',
  'Turkey',
  'UAE',
  'South Africa',
  'Other',
] as const

// Certificates (Food Supplement Industry)
export const FOOD_SUPPLEMENT_CERTIFICATES = [
  // Quality Management
  'ISO 9001',
  'ISO 22000',
  'FSSC 22000',
  'GMP', // Good Manufacturing Practice
  'HACCP',
  
  // Organic & Natural
  'USDA Organic',
  'EU Organic',
  'JAS Organic (Japan)',
  'COSMOS Organic',
  'NOP Organic',
  
  // Religious & Dietary
  'Halal',
  'Kosher',
  'Vegan',
  'Vegetarian',
  
  // GMO & Allergen
  'Non-GMO Project Verified',
  'Non-GMO',
  'Gluten-Free',
  'Allergen-Free',
  
  // Sustainability
  'Rainforest Alliance',
  'Fair Trade',
  'UTZ Certified',
  
  // Safety & Compliance
  'FDA Registered',
  'NSF International',
  'USP Verified',
  'Informed Choice',
  'BSCG Certified Drug Free',
  
  // Quality Standards
  'BRC', // British Retail Consortium
  'IFS', // International Featured Standards
  'SQF', // Safe Quality Food
  
  // Chemical & Environmental
  'REACH Compliant',
  'California Prop 65 Compliant',
  
  // Social Responsibility
  'Sedex',
  'SA8000',
  'BSCI',
  'SMETA',
  
  // Lab Testing
  'Third-Party Tested',
  'Heavy Metal Tested',
  'Pesticide Residue Free',
  'Microbiological Tested',
] as const

// Packaging Types (Food Supplement Industry)
export const FOOD_SUPPLEMENT_PACKAGING = [
  // Bulk Packaging
  'Fiber Drum (25kg)',
  'Fiber Drum (20kg)',
  'Fiber Drum (10kg)',
  'Aluminum Foil Bag',
  'Double PE Bag',
  'Vacuum Bag',
  
  // Industrial Packaging
  'IBC Tote (500-1000kg)',
  'Bulk Bag / FIBC (500-1000kg)',
  'Steel Drum',
  
  // Cartons
  'Carton (25kg)',
  'Carton (20kg)',
  'Carton (10kg)',
  'Carton (5kg)',
  'Carton (1kg)',
  
  // Consumer Packaging
  'Bottle (HDPE)',
  'Bottle (PET)',
  'Jar (Glass)',
  'Pouch (Stand-up)',
  'Blister Pack',
  'Sachet',
  
  // Custom
  'Custom Packaging',
  'Bulk (No Packaging)',
] as const

// Payment Terms (Food Supplement B2B)
export const FOOD_SUPPLEMENT_PAYMENT_TERMS = [
  '100% T/T in Advance',
  '30% Deposit + 70% Before Shipment',
  '50% Deposit + 50% Before Shipment',
  '30% Deposit + 70% Against BL Copy',
  'T/T Against BL Copy',
  'L/C at Sight',
  'L/C 30 Days',
  'L/C 60 Days',
  'L/C 90 Days',
  'D/P (Documents against Payment)',
  'D/A (Documents against Acceptance)',
  'CAD (Cash Against Documents)',
  'Open Account 30 Days',
  'Open Account 60 Days',
  'Open Account 90 Days',
  'Escrow Service',
  'PayPal (Small Orders)',
  'Credit Card (Small Orders)',
] as const

// Incoterms (Universal but ordered by popularity in food supplement)
export const FOOD_SUPPLEMENT_INCOTERMS = [
  'FOB', // Most common
  'CIF',
  'CFR',
  'EXW',
  'FCA',
  'CPT',
  'CIP',
  'DAP',
  'DPU',
  'DDP',
] as const

// Product Categories (Food Supplement Specific)
export const FOOD_SUPPLEMENT_CATEGORIES = [
  // Vitamins
  'Vitamin A',
  'Vitamin B Complex',
  'Vitamin B1 (Thiamine)',
  'Vitamin B2 (Riboflavin)',
  'Vitamin B3 (Niacin)',
  'Vitamin B5 (Pantothenic Acid)',
  'Vitamin B6 (Pyridoxine)',
  'Vitamin B7 (Biotin)',
  'Vitamin B9 (Folic Acid)',
  'Vitamin B12 (Cobalamin)',
  'Vitamin C (Ascorbic Acid)',
  'Vitamin D2 (Ergocalciferol)',
  'Vitamin D3 (Cholecalciferol)',
  'Vitamin E (Tocopherol)',
  'Vitamin K1',
  'Vitamin K2',
  
  // Minerals
  'Calcium',
  'Magnesium',
  'Iron',
  'Zinc',
  'Selenium',
  'Copper',
  'Manganese',
  'Chromium',
  'Iodine',
  'Potassium',
  'Phosphorus',
  'Molybdenum',
  
  // Botanical Extracts
  'Herbal Extract',
  'Plant Extract',
  'Fruit Extract',
  'Vegetable Extract',
  'Mushroom Extract',
  'Algae Extract',
  'Seaweed Extract',
  
  // Proteins & Amino Acids
  'Whey Protein',
  'Casein Protein',
  'Soy Protein',
  'Pea Protein',
  'Rice Protein',
  'Hemp Protein',
  'Collagen',
  'Gelatin',
  'Amino Acid',
  'BCAA',
  'L-Carnitine',
  'Creatine',
  
  // Probiotics & Prebiotics
  'Probiotic Strain',
  'Prebiotic Fiber',
  'Synbiotic',
  'Postbiotic',
  
  // Omega Fatty Acids
  'Omega-3',
  'Omega-6',
  'Omega-9',
  'Fish Oil',
  'Krill Oil',
  'Algae Oil',
  'Flaxseed Oil',
  'Evening Primrose Oil',
  
  // Antioxidants
  'Coenzyme Q10 (CoQ10)',
  'Alpha Lipoic Acid',
  'Glutathione',
  'Resveratrol',
  'Astaxanthin',
  'Lycopene',
  'Lutein',
  'Zeaxanthin',
  
  // Fibers
  'Dietary Fiber',
  'Inulin',
  'Psyllium Husk',
  'Beta-Glucan',
  
  // Enzymes
  'Digestive Enzyme',
  'Protease',
  'Amylase',
  'Lipase',
  'Bromelain',
  'Papain',
  
  // Sweeteners & Additives
  'Stevia',
  'Monk Fruit Extract',
  'Erythritol',
  'Xylitol',
  'Natural Flavor',
  'Natural Color',
  
  // Functional Ingredients
  'Nootropic',
  'Adaptogen',
  'Superfood Powder',
  'Green Powder',
  
  // Other
  'Other Ingredient',
] as const

// Applications (Food Supplement Industry)
export const FOOD_SUPPLEMENT_APPLICATIONS = [
  // Primary Applications
  'Dietary Supplement (Capsule)',
  'Dietary Supplement (Tablet)',
  'Dietary Supplement (Softgel)',
  'Dietary Supplement (Powder)',
  'Dietary Supplement (Liquid)',
  'Dietary Supplement (Gummy)',
  
  // Food & Beverage
  'Functional Food',
  'Health Food',
  'Nutritional Bar',
  'Ready-to-Drink Beverage',
  'Powder Drink Mix',
  'Energy Drink',
  'Sports Drink',
  'Protein Shake',
  'Meal Replacement',
  
  // Specific Food Categories
  'Bakery & Confectionery',
  'Dairy Products',
  'Yogurt',
  'Breakfast Cereal',
  'Snacks',
  'Infant Formula',
  'Baby Food',
  
  // Sports Nutrition
  'Sports Nutrition',
  'Pre-Workout',
  'Post-Workout',
  'Intra-Workout',
  'Protein Powder',
  'Weight Management',
  
  // Specialized
  'Medical Nutrition',
  'Clinical Nutrition',
  'Enteral Nutrition',
  'Geriatric Nutrition',
  
  // Personal Care & Cosmetics
  'Cosmetic Ingredient',
  'Skincare',
  'Hair Care',
  'Nutraceutical Cosmetic',
  
  // Animal Nutrition
  'Pet Food Supplement',
  'Animal Feed Additive',
  'Veterinary Supplement',
  
  // Pharmaceutical
  'Pharmaceutical Ingredient',
  'API (Active Pharmaceutical Ingredient)',
  'Pharmaceutical Excipient',
  
  // Other
  'Other Application',
] as const

// Sample Types
export const FOOD_SUPPLEMENT_SAMPLE_TYPES = [
  'Free Sample (Buyer Pays Shipping)',
  'Free Sample (Seller Pays Shipping)',
  'Paid Sample (Refundable with Order)',
  'Paid Sample (Non-Refundable)',
] as const

// Form Types (Physical Form)
export const FOOD_SUPPLEMENT_FORMS = [
  'Powder',
  'Granule',
  'Crystal',
  'Liquid',
  'Oil',
  'Paste',
  'Solid',
  'Extract',
  'Resin',
] as const

// Grades
export const FOOD_SUPPLEMENT_GRADES = [
  'Food Grade',
  'Pharmaceutical Grade',
  'USP Grade',
  'BP Grade',
  'EP Grade',
  'JP Grade',
  'Technical Grade',
  'Feed Grade',
  'Cosmetic Grade',
] as const

// Storage Conditions
export const FOOD_SUPPLEMENT_STORAGE = [
  'Room Temperature (15-25°C)',
  'Cool & Dry Place (below 25°C)',
  'Refrigerated (2-8°C)',
  'Frozen (-18°C or below)',
  'Protect from Light',
  'Protect from Moisture',
  'Airtight Container',
] as const

export type FoodSupplementCountry = typeof FOOD_SUPPLEMENT_COUNTRIES[number]
export type FoodSupplementCertificate = typeof FOOD_SUPPLEMENT_CERTIFICATES[number]
export type FoodSupplementPackaging = typeof FOOD_SUPPLEMENT_PACKAGING[number]
export type FoodSupplementPaymentTerm = typeof FOOD_SUPPLEMENT_PAYMENT_TERMS[number]
export type FoodSupplementIncoterm = typeof FOOD_SUPPLEMENT_INCOTERMS[number]
export type FoodSupplementCategory = typeof FOOD_SUPPLEMENT_CATEGORIES[number]
export type FoodSupplementApplication = typeof FOOD_SUPPLEMENT_APPLICATIONS[number]
export type FoodSupplementSampleType = typeof FOOD_SUPPLEMENT_SAMPLE_TYPES[number]
export type FoodSupplementForm = typeof FOOD_SUPPLEMENT_FORMS[number]
export type FoodSupplementGrade = typeof FOOD_SUPPLEMENT_GRADES[number]
export type FoodSupplementStorage = typeof FOOD_SUPPLEMENT_STORAGE[number]

