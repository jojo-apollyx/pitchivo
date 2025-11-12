'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  // Define field groups
  const basicSpecFields = ['einecs', 'shelfLife']
  const physicalCharFields = ['appearance', 'odor', 'taste', 'solubility']
  const chemicalAnalysisFields = [
    'assay',
    'moisture',
    'ashContent',
    'lossOnDrying',
    'ph',
    'bulkDensity',
    'particleSize',
  ]
  const heavyMetalsFields = ['lead', 'arsenic', 'cadmium', 'mercury']
  const microbiologicalFields = [
    'totalPlateCount',
    'yeastMold',
    'eColiPresence',
    'salmonellaPresence',
    'staphylococcusPresence',
  ]
  const complianceFields = [
    'pesticideResidue',
    'certificateExpiryDate',
    'gmoStatus',
    'irradiationStatus',
    'allergenInfo',
    'bseStatement',
  ]

  // If no technical fields are visible, don't render the section
  const hasAnyVisibleField =
    hasVisibleFields(basicSpecFields) ||
    hasVisibleFields(physicalCharFields) ||
    hasVisibleFields(chemicalAnalysisFields) ||
    hasVisibleFields(heavyMetalsFields) ||
    hasVisibleFields(microbiologicalFields) ||
    hasVisibleFields(complianceFields) ||
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
                    value={formData.einecs}
                    onChange={(e) => onChange({ einecs: e.target.value })}
                    placeholder="e.g., 200-066-2"
                  />
                </div>
              )}
              {visibleFields.has('shelfLife') && (
                <div className="flex flex-col">
                  <Label htmlFor="shelfLife" className="mb-1 whitespace-nowrap">
                    Shelf Life (months)
                  </Label>
                  <Input
                    id="shelfLife"
                    type="number"
                    value={formData.shelfLife || ''}
                    onChange={(e) => onChange({ shelfLife: parseInt(e.target.value) || null })}
                    placeholder="e.g., 24"
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
                    value={formData.appearance}
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
                    value={formData.odor}
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
                    value={formData.taste}
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
                    value={formData.solubility}
                    onChange={(e) => onChange({ solubility: e.target.value })}
                    placeholder="e.g., Soluble in water"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Storage Conditions */}
        {visibleFields.has('storageConditions') && (
          <div>
            <SearchableMultiSelect
              label="Storage Conditions"
              options={FOOD_SUPPLEMENT_STORAGE}
              selected={formData.storageConditions}
              onChange={(selected) => onChange({ storageConditions: selected })}
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
                    Assay / Purity (%)
                  </Label>
                  <Input
                    id="assay"
                    type="number"
                    step="0.01"
                    value={formData.assay || ''}
                    onChange={(e) => onChange({ assay: parseFloat(e.target.value) || null })}
                    placeholder="e.g., 99.5"
                  />
                </div>
              )}
              {visibleFields.has('moisture') && (
                <div className="flex flex-col">
                  <Label htmlFor="moisture" className="mb-1 whitespace-nowrap">
                    Moisture (%)
                  </Label>
                  <Input
                    id="moisture"
                    type="number"
                    step="0.01"
                    value={formData.moisture || ''}
                    onChange={(e) => onChange({ moisture: parseFloat(e.target.value) || null })}
                    placeholder="e.g., 0.5"
                  />
                </div>
              )}
              {visibleFields.has('ashContent') && (
                <div className="flex flex-col">
                  <Label htmlFor="ashContent" className="mb-1 whitespace-nowrap">
                    Ash Content (%)
                  </Label>
                  <Input
                    id="ashContent"
                    type="number"
                    step="0.01"
                    value={formData.ashContent || ''}
                    onChange={(e) => onChange({ ashContent: parseFloat(e.target.value) || null })}
                    placeholder="e.g., 0.2"
                  />
                </div>
              )}
              {visibleFields.has('lossOnDrying') && (
                <div className="flex flex-col">
                  <Label htmlFor="lossOnDrying" className="mb-1 whitespace-nowrap">
                    Loss on Drying (%)
                  </Label>
                  <Input
                    id="lossOnDrying"
                    type="number"
                    step="0.01"
                    value={formData.lossOnDrying || ''}
                    onChange={(e) =>
                      onChange({ lossOnDrying: parseFloat(e.target.value) || null })
                    }
                    placeholder="e.g., 0.5"
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
                    value={formData.ph}
                    onChange={(e) => onChange({ ph: e.target.value })}
                    placeholder="e.g., 5.0-7.0"
                  />
                </div>
              )}
              {visibleFields.has('bulkDensity') && (
                <div className="flex flex-col">
                  <Label htmlFor="bulkDensity" className="mb-1 whitespace-nowrap">
                    Bulk Density (g/ml)
                  </Label>
                  <Input
                    id="bulkDensity"
                    type="number"
                    step="0.01"
                    value={formData.bulkDensity || ''}
                    onChange={(e) =>
                      onChange({ bulkDensity: parseFloat(e.target.value) || null })
                    }
                    placeholder="e.g., 0.5"
                  />
                </div>
              )}
              {visibleFields.has('particleSize') && (
                <div className="flex flex-col">
                  <Label htmlFor="particleSize" className="mb-1 whitespace-nowrap">
                    Particle Size
                  </Label>
                  <Input
                    id="particleSize"
                    value={formData.particleSize}
                    onChange={(e) => onChange({ particleSize: e.target.value })}
                    placeholder="e.g., 80 mesh"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Heavy Metals */}
        {hasVisibleFields(heavyMetalsFields) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Heavy Metals (ppm)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {visibleFields.has('lead') && (
                <div className="flex flex-col">
                  <Label htmlFor="lead" className="text-xs mb-1 whitespace-nowrap">
                    Lead (Pb)
                  </Label>
                  <Input
                    id="lead"
                    type="number"
                    step="0.01"
                    value={formData.lead || ''}
                    onChange={(e) => onChange({ lead: parseFloat(e.target.value) || null })}
                    placeholder="0.5"
                  />
                </div>
              )}
              {visibleFields.has('arsenic') && (
                <div className="flex flex-col">
                  <Label htmlFor="arsenic" className="text-xs mb-1 whitespace-nowrap">
                    Arsenic (As)
                  </Label>
                  <Input
                    id="arsenic"
                    type="number"
                    step="0.01"
                    value={formData.arsenic || ''}
                    onChange={(e) => onChange({ arsenic: parseFloat(e.target.value) || null })}
                    placeholder="0.5"
                  />
                </div>
              )}
              {visibleFields.has('cadmium') && (
                <div className="flex flex-col">
                  <Label htmlFor="cadmium" className="text-xs mb-1 whitespace-nowrap">
                    Cadmium (Cd)
                  </Label>
                  <Input
                    id="cadmium"
                    type="number"
                    step="0.01"
                    value={formData.cadmium || ''}
                    onChange={(e) => onChange({ cadmium: parseFloat(e.target.value) || null })}
                    placeholder="0.5"
                  />
                </div>
              )}
              {visibleFields.has('mercury') && (
                <div className="flex flex-col">
                  <Label htmlFor="mercury" className="text-xs mb-1 whitespace-nowrap">
                    Mercury (Hg)
                  </Label>
                  <Input
                    id="mercury"
                    type="number"
                    step="0.01"
                    value={formData.mercury || ''}
                    onChange={(e) => onChange({ mercury: parseFloat(e.target.value) || null })}
                    placeholder="0.1"
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
              {visibleFields.has('totalPlateCount') && (
                <div className="flex flex-col">
                  <Label htmlFor="totalPlateCount" className="mb-1 whitespace-nowrap">
                    Total Plate Count (cfu/g)
                  </Label>
                  <Input
                    id="totalPlateCount"
                    type="number"
                    value={formData.totalPlateCount || ''}
                    onChange={(e) =>
                      onChange({ totalPlateCount: parseInt(e.target.value) || null })
                    }
                    placeholder="e.g., 1000"
                  />
                </div>
              )}
              {visibleFields.has('yeastMold') && (
                <div className="flex flex-col">
                  <Label htmlFor="yeastMold" className="mb-1 whitespace-nowrap">
                    Yeast & Mold (cfu/g)
                  </Label>
                  <Input
                    id="yeastMold"
                    type="number"
                    value={formData.yeastMold || ''}
                    onChange={(e) => onChange({ yeastMold: parseInt(e.target.value) || null })}
                    placeholder="e.g., 100"
                  />
                </div>
              )}
              {visibleFields.has('eColiPresence') && (
                <div className="flex flex-col">
                  <Label htmlFor="eColiPresence" className="mb-1 whitespace-nowrap">
                    E. Coli
                  </Label>
                  <Select
                    value={formData.eColiPresence}
                    onValueChange={(value) => onChange({ eColiPresence: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negative">Negative</SelectItem>
                      <SelectItem value="Positive">Positive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {visibleFields.has('salmonellaPresence') && (
                <div className="flex flex-col">
                  <Label htmlFor="salmonellaPresence" className="mb-1 whitespace-nowrap">
                    Salmonella
                  </Label>
                  <Select
                    value={formData.salmonellaPresence}
                    onValueChange={(value) => onChange({ salmonellaPresence: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negative">Negative</SelectItem>
                      <SelectItem value="Positive">Positive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {visibleFields.has('staphylococcusPresence') && (
                <div className="flex flex-col">
                  <Label htmlFor="staphylococcusPresence" className="mb-1 whitespace-nowrap">
                    Staphylococcus
                  </Label>
                  <Select
                    value={formData.staphylococcusPresence}
                    onValueChange={(value) => onChange({ staphylococcusPresence: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negative">Negative</SelectItem>
                      <SelectItem value="Positive">Positive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pesticide & Compliance */}
        {hasVisibleFields(complianceFields) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Compliance & Safety</h3>
            <div className="space-y-4">
              {visibleFields.has('pesticideResidue') && (
                <div>
                  <Label htmlFor="pesticideResidue">Pesticide Residue Status</Label>
                  <Input
                    id="pesticideResidue"
                    value={formData.pesticideResidue}
                    onChange={(e) => onChange({ pesticideResidue: e.target.value })}
                    placeholder="e.g., Complies with EU/USP/JP standards"
                  />
                </div>
              )}
              {visibleFields.has('certificateExpiryDate') && (
                <div>
                  <Label htmlFor="certificateExpiryDate">Certificate Expiry Date</Label>
                  <DatePicker
                    value={formData.certificateExpiryDate}
                    onChange={(value) => onChange({ certificateExpiryDate: value })}
                    placeholder="Select expiry date"
                    className="mt-1"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleFields.has('gmoStatus') && (
                  <div className="flex flex-col">
                    <Label htmlFor="gmoStatus" className="mb-1 whitespace-nowrap">
                      GMO Status
                    </Label>
                    <Select
                      value={formData.gmoStatus}
                      onValueChange={(value) => onChange({ gmoStatus: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Non-GMO">Non-GMO</SelectItem>
                        <SelectItem value="GMO">GMO</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {visibleFields.has('irradiationStatus') && (
                  <div className="flex flex-col">
                    <Label htmlFor="irradiationStatus" className="mb-1 whitespace-nowrap">
                      Irradiation Status
                    </Label>
                    <Select
                      value={formData.irradiationStatus}
                      onValueChange={(value) => onChange({ irradiationStatus: value })}
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
                {visibleFields.has('allergenInfo') && (
                  <div>
                    <Label htmlFor="allergenInfo">Allergen Information</Label>
                    <Input
                      id="allergenInfo"
                      value={formData.allergenInfo}
                      onChange={(e) => onChange({ allergenInfo: e.target.value })}
                      placeholder="e.g., None"
                    />
                  </div>
                )}
                {visibleFields.has('bseStatement') && (
                  <div>
                    <Label htmlFor="bseStatement">BSE/TSE Statement</Label>
                    <Input
                      id="bseStatement"
                      value={formData.bseStatement}
                      onChange={(e) => onChange({ bseStatement: e.target.value })}
                      placeholder="e.g., BSE/TSE Free"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

