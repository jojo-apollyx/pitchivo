'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagListField } from '@/components/ui/tag-list-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select'
import { FOOD_SUPPLEMENT_STORAGE } from '@/lib/constants/industries/food-supplement/options'
import type { FoodSupplementProductData } from './types'

interface TechnicalFieldsSectionProps {
  formData: FoodSupplementProductData
  onChange: (updates: Partial<FoodSupplementProductData>) => void
  visibleFields: Set<string>
}

export function TechnicalFieldsSection({
  formData,
  onChange,
  visibleFields,
}: TechnicalFieldsSectionProps) {
  // Helper to check if any field in a group is visible
  const hasVisibleFields = (fields: string[]) => {
    return fields.some((field) => visibleFields.has(field))
  }

  // Helper to check if a field is visible AND has a value
  const shouldShowField = (fieldName: string, value: any): boolean => {
    if (!visibleFields.has(fieldName)) return false
    
    // Check if field has a meaningful value
    if (value === null || value === undefined) return false
    
    // For strings, check if empty or "unknown"
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed === '' || trimmed.toLowerCase() === 'unknown') {
        return false
      }
    }
    
    // For numbers, check if 0 or null
    if (typeof value === 'number' && value === 0) {
      return false
    }
    
    return true
  }

  // Define field groups (snake_case)
  const basicSpecFields = ['einecs', 'shelf_life', 'fda_number']
  const originSourceFields = ['botanical_name', 'extraction_ratio', 'carrier_material']
  const physicalCharFields = ['appearance', 'odor', 'taste', 'solubility', 'mesh_size', 'bulk_density', 'particle_size']
  const chemicalAnalysisFields = [
    'assay',
    'moisture',
    'ash_content',
    'loss_on_drying',
    'ph',
    'residual_solvents',
  ]
  const heavyMetalsFields = ['lead', 'arsenic', 'cadmium', 'mercury', 'heavy_metals_total', 'pesticide_residue', 'aflatoxins']
  const microbiologicalFields = [
    'total_plate_count',
    'yeast_mold',
    'e_coli_presence',
    'salmonella_presence',
    'staphylococcus_presence',
    'coliforms',
  ]
  const complianceFields = [
    'gmo_status',
    'irradiation_status',
    'allergen_info',
    'bse_statement',
    'halal_certified',
    'kosher_certified',
    'organic_certification_body',
  ]
  const logisticsFields = [
    'gross_weight',
    'packages_per_pallet',
    'storage_temperature',
  ]
  const commercialFields = ['sample_availability']

  // If no technical fields are visible, don't render the section
  const hasAnyVisibleField =
    hasVisibleFields(basicSpecFields) ||
    hasVisibleFields(originSourceFields) ||
    hasVisibleFields(physicalCharFields) ||
    hasVisibleFields(chemicalAnalysisFields) ||
    hasVisibleFields(heavyMetalsFields) ||
    hasVisibleFields(microbiologicalFields) ||
    hasVisibleFields(complianceFields) ||
    hasVisibleFields(logisticsFields) ||
    hasVisibleFields(commercialFields) ||
    visibleFields.has('storageConditions')

  if (!hasAnyVisibleField) {
    return null
  }

  return (
    <section className="pb-8 border-b border-border/30">
      <h2 className="text-lg font-semibold mb-4">Technical Data & Specifications</h2>
      <div className="space-y-6">
        {/* Basic Specifications */}
        {hasVisibleFields(basicSpecFields) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Basic Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleFields.has('einecs') && (
                <div className="flex flex-col">
                  <Label htmlFor="einecs" className="mb-1 whitespace-nowrap">
                    EINECS Number
                  </Label>
                  <Input
                    id="einecs"
                    value={formData.einecs || ''}
                    onChange={(e) => onChange({ einecs: e.target.value })}
                    placeholder="e.g., 200-066-2"
                  />
                </div>
              )}
              {visibleFields.has('fda_number') && (
                <div className="flex flex-col">
                  <Label htmlFor="fda_number" className="mb-1 whitespace-nowrap">
                    FDA Number
                  </Label>
                  <Input
                    id="fda_number"
                    value={formData.fda_number || ''}
                    onChange={(e) => onChange({ fda_number: e.target.value })}
                    placeholder="e.g., 12345-67890"
                  />
                </div>
              )}
              {visibleFields.has('shelf_life') && (
                <div className="flex flex-col">
                  <Label htmlFor="shelf_life" className="mb-1 whitespace-nowrap">
                    Shelf Life
                  </Label>
                  <Input
                    id="shelf_life"
                    value={formData.shelf_life || ''}
                    onChange={(e) => onChange({ shelf_life: e.target.value })}
                    placeholder="e.g., 24 months"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Origin & Source */}
        {hasVisibleFields(originSourceFields) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Origin & Source</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleFields.has('botanical_name') && (
                <div className="flex flex-col">
                  <Label htmlFor="botanical_name" className="mb-1 whitespace-nowrap">
                    Botanical/Latin Name
                  </Label>
                  <Input
                    id="botanical_name"
                    value={formData.botanical_name || ''}
                    onChange={(e) => onChange({ botanical_name: e.target.value })}
                    placeholder="e.g., Panax ginseng C.A. Meyer"
                  />
                </div>
              )}
              {visibleFields.has('extraction_ratio') && (
                <div className="flex flex-col">
                  <Label htmlFor="extraction_ratio" className="mb-1 whitespace-nowrap">
                    Extraction Ratio
                  </Label>
                  <Input
                    id="extraction_ratio"
                    value={formData.extraction_ratio || ''}
                    onChange={(e) => onChange({ extraction_ratio: e.target.value })}
                    placeholder="e.g., 10:1, 20:1"
                  />
                </div>
              )}
              {visibleFields.has('carrier_material') && (
                <div className="flex flex-col">
                  <Label htmlFor="carrier_material" className="mb-1 whitespace-nowrap">
                    Carrier Material
                  </Label>
                  <Input
                    id="carrier_material"
                    value={formData.carrier_material || ''}
                    onChange={(e) => onChange({ carrier_material: e.target.value })}
                    placeholder="e.g., Maltodextrin"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Physical Characteristics */}
        {hasVisibleFields(physicalCharFields) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Physical Characteristics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleFields.has('appearance') && (
                <div className="flex flex-col">
                  <Label htmlFor="appearance" className="mb-1 whitespace-nowrap">
                    Appearance
                  </Label>
                  <Input
                    id="appearance"
                    value={formData.appearance || ''}
                    onChange={(e) => onChange({ appearance: e.target.value })}
                    placeholder="e.g., White to off-white powder"
                  />
                </div>
              )}
              {visibleFields.has('odor') && (
                <div className="flex flex-col">
                  <Label htmlFor="odor" className="mb-1 whitespace-nowrap">
                    Odor
                  </Label>
                  <Input
                    id="odor"
                    value={formData.odor || ''}
                    onChange={(e) => onChange({ odor: e.target.value })}
                    placeholder="e.g., Mild"
                  />
                </div>
              )}
              {visibleFields.has('taste') && (
                <div className="flex flex-col">
                  <Label htmlFor="taste" className="mb-1 whitespace-nowrap">
                    Taste
                  </Label>
                  <Input
                    id="taste"
                    value={formData.taste || ''}
                    onChange={(e) => onChange({ taste: e.target.value })}
                    placeholder="e.g., Slightly acidic"
                  />
                </div>
              )}
              {visibleFields.has('solubility') && (
                <div className="flex flex-col">
                  <Label htmlFor="solubility" className="mb-1 whitespace-nowrap">
                    Solubility
                  </Label>
                  <Input
                    id="solubility"
                    value={formData.solubility || ''}
                    onChange={(e) => onChange({ solubility: e.target.value })}
                    placeholder="e.g., Soluble in water"
                  />
                </div>
              )}
              {visibleFields.has('mesh_size') && (
                <div className="flex flex-col">
                  <Label htmlFor="mesh_size" className="mb-1 whitespace-nowrap">
                    Mesh Size
                  </Label>
                  <Input
                    id="mesh_size"
                    value={formData.mesh_size || ''}
                    onChange={(e) => onChange({ mesh_size: e.target.value })}
                    placeholder="e.g., 80 mesh, 100 mesh"
                  />
                </div>
              )}
              {visibleFields.has('bulk_density') && (
                <div className="flex flex-col">
                  <Label htmlFor="bulk_density" className="mb-1 whitespace-nowrap">
                    Bulk Density
                  </Label>
                  <Input
                    id="bulk_density"
                    value={formData.bulk_density || ''}
                    onChange={(e) => onChange({ bulk_density: e.target.value })}
                    placeholder="e.g., 0.5 g/ml"
                  />
                </div>
              )}
              {visibleFields.has('particle_size') && (
                <div className="flex flex-col">
                  <Label htmlFor="particle_size" className="mb-1 whitespace-nowrap">
                    Particle Size
                  </Label>
                  <Input
                    id="particle_size"
                    value={formData.particle_size || ''}
                    onChange={(e) => onChange({ particle_size: e.target.value })}
                    placeholder="e.g., 80 mesh"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Storage Conditions */}
        {visibleFields.has('storage_conditions') && (
          <div>
            <SearchableMultiSelect
              label="Storage Conditions"
              options={FOOD_SUPPLEMENT_STORAGE}
              selected={formData.storage_conditions || []}
              onChange={(selected) => onChange({ storage_conditions: selected })}
              placeholder="Search storage conditions..."
            />
          </div>
        )}

        {/* Chemical Analysis */}
        {hasVisibleFields(chemicalAnalysisFields) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Chemical Analysis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleFields.has('assay') && (
                <div className="flex flex-col">
                  <Label htmlFor="assay" className="mb-1 whitespace-nowrap">
                    Assay / Purity
                  </Label>
                  <Input
                    id="assay"
                    value={formData.assay || ''}
                    onChange={(e) => onChange({ assay: e.target.value })}
                    placeholder="e.g., 99.5%, ≥ 98%"
                  />
                </div>
              )}
              {visibleFields.has('moisture') && (
                <div className="flex flex-col">
                  <Label htmlFor="moisture" className="mb-1 whitespace-nowrap">
                    Moisture
                  </Label>
                  <Input
                    id="moisture"
                    value={formData.moisture || ''}
                    onChange={(e) => onChange({ moisture: e.target.value })}
                    placeholder="e.g., ≤ 0.5%"
                  />
                </div>
              )}
              {visibleFields.has('ash_content') && (
                <div className="flex flex-col">
                  <Label htmlFor="ash_content" className="mb-1 whitespace-nowrap">
                    Ash Content
                  </Label>
                  <Input
                    id="ash_content"
                    value={formData.ash_content || ''}
                    onChange={(e) => onChange({ ash_content: e.target.value })}
                    placeholder="e.g., ≤ 0.2%"
                  />
                </div>
              )}
              {visibleFields.has('loss_on_drying') && (
                <div className="flex flex-col">
                  <Label htmlFor="loss_on_drying" className="mb-1 whitespace-nowrap">
                    Loss on Drying
                  </Label>
                  <Input
                    id="loss_on_drying"
                    value={formData.loss_on_drying || ''}
                    onChange={(e) => onChange({ loss_on_drying: e.target.value })}
                    placeholder="e.g., ≤ 0.5%"
                  />
                </div>
              )}
              {visibleFields.has('ph') && (
                <div className="flex flex-col">
                  <Label htmlFor="ph" className="mb-1 whitespace-nowrap">
                    pH
                  </Label>
                  <Input
                    id="ph"
                    value={formData.ph || ''}
                    onChange={(e) => onChange({ ph: e.target.value })}
                    placeholder="e.g., 5.0-7.0"
                  />
                </div>
              )}
              {visibleFields.has('residual_solvents') && (
                <div className="flex flex-col">
                  <Label htmlFor="residual_solvents" className="mb-1 whitespace-nowrap">
                    Residual Solvents
                  </Label>
                  <Input
                    id="residual_solvents"
                    value={formData.residual_solvents || ''}
                    onChange={(e) => onChange({ residual_solvents: e.target.value })}
                    placeholder="e.g., < 10 ppm"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Heavy Metals & Mycotoxins */}
        {hasVisibleFields(heavyMetalsFields) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Heavy Metals & Contaminants</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleFields.has('lead') && (
                <div className="flex flex-col">
                  <Label htmlFor="lead" className="mb-1 whitespace-nowrap">
                    Lead (Pb)
                  </Label>
                  <Input
                    id="lead"
                    value={formData.lead || ''}
                    onChange={(e) => onChange({ lead: e.target.value })}
                    placeholder="e.g., < 1.0 ppm"
                  />
                </div>
              )}
              {visibleFields.has('arsenic') && (
                <div className="flex flex-col">
                  <Label htmlFor="arsenic" className="mb-1 whitespace-nowrap">
                    Arsenic (As)
                  </Label>
                  <Input
                    id="arsenic"
                    value={formData.arsenic || ''}
                    onChange={(e) => onChange({ arsenic: e.target.value })}
                    placeholder="e.g., < 0.5 ppm"
                  />
                </div>
              )}
              {visibleFields.has('cadmium') && (
                <div className="flex flex-col">
                  <Label htmlFor="cadmium" className="mb-1 whitespace-nowrap">
                    Cadmium (Cd)
                  </Label>
                  <Input
                    id="cadmium"
                    value={formData.cadmium || ''}
                    onChange={(e) => onChange({ cadmium: e.target.value })}
                    placeholder="e.g., < 0.3 ppm"
                  />
                </div>
              )}
              {visibleFields.has('mercury') && (
                <div className="flex flex-col">
                  <Label htmlFor="mercury" className="mb-1 whitespace-nowrap">
                    Mercury (Hg)
                  </Label>
                  <Input
                    id="mercury"
                    value={formData.mercury || ''}
                    onChange={(e) => onChange({ mercury: e.target.value })}
                    placeholder="e.g., < 0.1 ppm"
                  />
                </div>
              )}
              {visibleFields.has('heavy_metals_total') && (
                <div className="flex flex-col">
                  <Label htmlFor="heavy_metals_total" className="mb-1 whitespace-nowrap">
                    Heavy Metals (Total)
                  </Label>
                  <Input
                    id="heavy_metals_total"
                    value={formData.heavy_metals_total || ''}
                    onChange={(e) => onChange({ heavy_metals_total: e.target.value })}
                    placeholder="e.g., < 10 ppm"
                  />
                </div>
              )}
              {visibleFields.has('pesticide_residue') && (
                <div className="flex flex-col">
                  <Label htmlFor="pesticide_residue" className="mb-1 whitespace-nowrap">
                    Pesticide Residue
                  </Label>
                  <Input
                    id="pesticide_residue"
                    value={formData.pesticide_residue || ''}
                    onChange={(e) => onChange({ pesticide_residue: e.target.value })}
                    placeholder="e.g., Non detected, < 0.1 ppm"
                  />
                </div>
              )}
              {visibleFields.has('aflatoxins') && (
                <div className="flex flex-col">
                  <Label htmlFor="aflatoxins" className="mb-1 whitespace-nowrap">
                    Aflatoxins
                  </Label>
                  <Input
                    id="aflatoxins"
                    value={formData.aflatoxins || ''}
                    onChange={(e) => onChange({ aflatoxins: e.target.value })}
                    placeholder="e.g., < 5 ppb"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Microbiological */}
        {hasVisibleFields(microbiologicalFields) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Microbiological</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleFields.has('total_plate_count') && (
                <div className="flex flex-col">
                  <Label htmlFor="total_plate_count" className="mb-1 whitespace-nowrap">
                    Total Plate Count
                  </Label>
                  <Input
                    id="total_plate_count"
                    value={formData.total_plate_count || ''}
                    onChange={(e) => onChange({ total_plate_count: e.target.value })}
                    placeholder="e.g., < 1000 cfu/g"
                  />
                </div>
              )}
              {visibleFields.has('yeast_mold') && (
                <div className="flex flex-col">
                  <Label htmlFor="yeast_mold" className="mb-1 whitespace-nowrap">
                    Yeast & Mold
                  </Label>
                  <Input
                    id="yeast_mold"
                    value={formData.yeast_mold || ''}
                    onChange={(e) => onChange({ yeast_mold: e.target.value })}
                    placeholder="e.g., < 100 cfu/g"
                  />
                </div>
              )}
              {visibleFields.has('coliforms') && (
                <div className="flex flex-col">
                  <Label htmlFor="coliforms" className="mb-1 whitespace-nowrap">
                    Coliforms
                  </Label>
                  <Input
                    id="coliforms"
                    value={formData.coliforms || ''}
                    onChange={(e) => onChange({ coliforms: e.target.value })}
                    placeholder="e.g., < 10 cfu/g"
                  />
                </div>
              )}
              {shouldShowField('e_coli_presence', formData.e_coli_presence) && (
                <div className="flex flex-col">
                  <Label htmlFor="e_coli_presence" className="mb-1 whitespace-nowrap">
                    E. Coli
                  </Label>
                  <Select
                    value={formData.e_coli_presence || ''}
                    onValueChange={(value) => onChange({ e_coli_presence: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negative">Negative</SelectItem>
                      <SelectItem value="Positive">Positive</SelectItem>
                      <SelectItem value="Not detected">Not detected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {shouldShowField('salmonella_presence', formData.salmonella_presence) && (
                <div className="flex flex-col">
                  <Label htmlFor="salmonella_presence" className="mb-1 whitespace-nowrap">
                    Salmonella
                  </Label>
                  <Select
                    value={formData.salmonella_presence || ''}
                    onValueChange={(value) => onChange({ salmonella_presence: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negative">Negative</SelectItem>
                      <SelectItem value="Positive">Positive</SelectItem>
                      <SelectItem value="Not detected">Not detected</SelectItem>
                      <SelectItem value="Negative in 25g">Negative in 25g</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {shouldShowField('staphylococcus_presence', formData.staphylococcus_presence) && (
                <div className="flex flex-col">
                  <Label htmlFor="staphylococcus_presence" className="mb-1 whitespace-nowrap">
                    Staphylococcus
                  </Label>
                  <Select
                    value={formData.staphylococcus_presence || ''}
                    onValueChange={(value) => onChange({ staphylococcus_presence: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negative">Negative</SelectItem>
                      <SelectItem value="Positive">Positive</SelectItem>
                      <SelectItem value="Not detected">Not detected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compliance & Safety */}
        {hasVisibleFields(complianceFields) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Compliance & Safety</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shouldShowField('gmo_status', formData.gmo_status) && (
                  <div className="flex flex-col">
                    <Label htmlFor="gmo_status" className="mb-1 whitespace-nowrap">
                      GMO Status
                    </Label>
                    <Select
                      value={formData.gmo_status || ''}
                      onValueChange={(value) => onChange({ gmo_status: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Non-GMO">Non-GMO</SelectItem>
                        <SelectItem value="GMO">GMO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {shouldShowField('irradiation_status', formData.irradiation_status) && (
                  <div className="flex flex-col">
                    <Label htmlFor="irradiation_status" className="mb-1 whitespace-nowrap">
                      Irradiation Status
                    </Label>
                    <Select
                      value={formData.irradiation_status || ''}
                      onValueChange={(value) => onChange({ irradiation_status: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Non-Irradiated">Non-Irradiated</SelectItem>
                        <SelectItem value="Irradiated">Irradiated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {visibleFields.has('allergen_info') && (
                <TagListField
                  label="Allergen Information"
                  value={formData.allergen_info || []}
                  onChange={(value) => onChange({ allergen_info: value })}
                  placeholder="Enter allergen name..."
                  emptyMessage="No allergens specified. Click 'Add' to add allergen information."
                />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleFields.has('bse_statement') && (
                  <div>
                    <Label htmlFor="bse_statement">BSE/TSE Statement</Label>
                    <Input
                      id="bse_statement"
                      value={formData.bse_statement || ''}
                      onChange={(e) => onChange({ bse_statement: e.target.value })}
                      placeholder="e.g., BSE/TSE Free"
                    />
                  </div>
                )}
                {visibleFields.has('halal_certified') && (
                  <div>
                    <Label htmlFor="halal_certified">Halal Certified</Label>
                    <Select
                      value={formData.halal_certified || ''}
                      onValueChange={(value) => onChange({ halal_certified: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {visibleFields.has('kosher_certified') && (
                  <div>
                    <Label htmlFor="kosher_certified">Kosher Certified</Label>
                    <Select
                      value={formData.kosher_certified || ''}
                      onValueChange={(value) => onChange({ kosher_certified: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {visibleFields.has('organic_certification_body') && (
                  <div>
                    <Label htmlFor="organic_certification_body">Organic Certifier</Label>
                    <Input
                      id="organic_certification_body"
                      value={formData.organic_certification_body || ''}
                      onChange={(e) => onChange({ organic_certification_body: e.target.value })}
                      placeholder="e.g., USDA Organic, EU Organic"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Packaging & Logistics */}
        {hasVisibleFields(logisticsFields) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Packaging & Logistics</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleFields.has('gross_weight') && (
                  <div className="flex flex-col">
                    <Label htmlFor="gross_weight" className="mb-1 whitespace-nowrap">
                      Gross Weight per Package
                    </Label>
                    <Input
                      id="gross_weight"
                      value={formData.gross_weight || ''}
                      onChange={(e) => onChange({ gross_weight: e.target.value })}
                      placeholder="e.g., 26 kg"
                    />
                  </div>
                )}
                {visibleFields.has('packages_per_pallet') && (
                  <div className="flex flex-col">
                    <Label htmlFor="packages_per_pallet" className="mb-1 whitespace-nowrap">
                      Packages per Pallet
                    </Label>
                    <Input
                      id="packages_per_pallet"
                      value={formData.packages_per_pallet || ''}
                      onChange={(e) => onChange({ packages_per_pallet: e.target.value })}
                      placeholder="e.g., 40 packages"
                    />
                  </div>
                )}
              </div>
              {visibleFields.has('storage_temperature') && (
                <div>
                  <Label htmlFor="storage_temperature">Storage Temperature</Label>
                  <Input
                    id="storage_temperature"
                    value={formData.storage_temperature || ''}
                    onChange={(e) => onChange({ storage_temperature: e.target.value })}
                    placeholder="e.g., Room Temperature (15-25°C)"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commercial Terms */}
        {hasVisibleFields(commercialFields) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Commercial Terms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleFields.has('sample_availability') && (
                <div className="flex flex-col">
                  <Label htmlFor="sample_availability" className="mb-1 whitespace-nowrap">
                    Sample Availability
                  </Label>
                  <Input
                    id="sample_availability"
                    value={formData.sample_availability || ''}
                    onChange={(e) => onChange({ sample_availability: e.target.value })}
                    placeholder="e.g., Free sample available"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}


