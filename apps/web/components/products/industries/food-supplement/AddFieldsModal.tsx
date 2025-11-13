'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export type TechnicalFieldCategory = {
  name: string
  fields: Array<{ key: string; label: string }>
}

const TECHNICAL_FIELD_GROUPS: TechnicalFieldCategory[] = [
  {
    name: 'Basic Specifications',
    fields: [
      { key: 'einecs', label: 'EINECS Number' },
      { key: 'shelfLife', label: 'Shelf Life (months)' },
    ],
  },
  {
    name: 'Origin & Source',
    fields: [
      { key: 'botanicalName', label: 'Botanical/Latin Name' },
      { key: 'extractionRatio', label: 'Extraction Ratio' },
      { key: 'carrierMaterial', label: 'Carrier Material' },
    ],
  },
  {
    name: 'Physical Characteristics',
    fields: [
      { key: 'appearance', label: 'Appearance' },
      { key: 'odor', label: 'Odor' },
      { key: 'taste', label: 'Taste' },
      { key: 'solubility', label: 'Solubility' },
      { key: 'meshSize', label: 'Mesh Size' },
    ],
  },
  {
    name: 'Chemical Analysis',
    fields: [
      { key: 'assay', label: 'Assay / Purity (%)' },
      { key: 'moisture', label: 'Moisture (%)' },
      { key: 'ashContent', label: 'Ash Content (%)' },
      { key: 'lossOnDrying', label: 'Loss on Drying (%)' },
      { key: 'ph', label: 'pH' },
      { key: 'bulkDensity', label: 'Bulk Density (g/ml)' },
      { key: 'particleSize', label: 'Particle Size' },
      { key: 'residualSolvents', label: 'Residual Solvents' },
    ],
  },
  {
    name: 'Heavy Metals & Mycotoxins',
    fields: [
      { key: 'lead', label: 'Lead (Pb) ppm' },
      { key: 'arsenic', label: 'Arsenic (As) ppm' },
      { key: 'cadmium', label: 'Cadmium (Cd) ppm' },
      { key: 'mercury', label: 'Mercury (Hg) ppm' },
      { key: 'aflatoxins', label: 'Aflatoxins (ppb)' },
    ],
  },
  {
    name: 'Microbiological',
    fields: [
      { key: 'totalPlateCount', label: 'Total Plate Count (cfu/g)' },
      { key: 'yeastMold', label: 'Yeast & Mold (cfu/g)' },
      { key: 'eColiPresence', label: 'E. Coli' },
      { key: 'salmonellaPresence', label: 'Salmonella' },
      { key: 'staphylococcusPresence', label: 'Staphylococcus' },
    ],
  },
  {
    name: 'Compliance & Certifications',
    fields: [
      { key: 'pesticideResidue', label: 'Pesticide Residue Status' },
      { key: 'gmoStatus', label: 'GMO Status' },
      { key: 'irradiationStatus', label: 'Irradiation Status' },
      { key: 'allergenInfo', label: 'Allergen Information' },
      { key: 'bseStatement', label: 'BSE/TSE Statement' },
      { key: 'halalCertified', label: 'Halal Certified' },
      { key: 'kosherCertified', label: 'Kosher Certified' },
      { key: 'organicCertificationBody', label: 'Organic Certifier' },
    ],
  },
  {
    name: 'Packaging & Logistics',
    fields: [
      { key: 'grossWeight', label: 'Gross Weight per Package' },
      { key: 'packagesPerPallet', label: 'Packages per Pallet' },
      { key: 'storageTemperature', label: 'Storage Temperature' },
      { key: 'storageConditions', label: 'Storage Conditions' },
    ],
  },
  {
    name: 'Commercial Terms',
    fields: [
      { key: 'moq', label: 'MOQ (Minimum Order Quantity)' },
      { key: 'sampleAvailability', label: 'Sample Availability' },
    ],
  },
]

interface AddFieldsModalProps {
  visibleFields: Set<string>
  onFieldsAdd: (fields: string[]) => void
}

export function AddFieldsModal({ visibleFields, onFieldsAdd }: AddFieldsModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())

  const toggleField = (fieldKey: string) => {
    const newSelected = new Set(selectedFields)
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey)
    } else {
      newSelected.add(fieldKey)
    }
    setSelectedFields(newSelected)
  }

  const handleAdd = () => {
    onFieldsAdd(Array.from(selectedFields))
    setSelectedFields(new Set())
    setOpen(false)
  }

  // Get available fields (not already visible)
  const availableGroups = TECHNICAL_FIELD_GROUPS.map((group) => ({
    ...group,
    fields: group.fields.filter((field) => !visibleFields.has(field.key)),
  })).filter((group) => group.fields.length > 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full" size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Add More Fields
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Technical Fields</DialogTitle>
          <DialogDescription>
            Select additional fields to add to your product form
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto pr-4">
          <div className="space-y-6">
            {availableGroups.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                All available fields are already visible
              </p>
            ) : (
              availableGroups.map((group) => (
                <div key={group.name}>
                  <h3 className="text-sm font-semibold mb-3 text-foreground">
                    {group.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.fields.map((field) => (
                      <Badge
                        key={field.key}
                        variant={selectedFields.has(field.key) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => toggleField(field.key)}
                      >
                        {field.label}
                        {selectedFields.has(field.key) && (
                          <X className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={selectedFields.size === 0}
          >
            Add {selectedFields.size > 0 && `(${selectedFields.size})`} Field
            {selectedFields.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { TECHNICAL_FIELD_GROUPS }

