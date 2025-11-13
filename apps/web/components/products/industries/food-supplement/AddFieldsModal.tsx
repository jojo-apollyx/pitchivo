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
      { key: 'shelf_life', label: 'Shelf Life' },
      { key: 'fda_number', label: 'FDA Number' },
    ],
  },
  {
    name: 'Origin & Source',
    fields: [
      { key: 'botanical_name', label: 'Botanical/Latin Name' },
      { key: 'extraction_ratio', label: 'Extraction Ratio' },
      { key: 'carrier_material', label: 'Carrier Material' },
    ],
  },
  {
    name: 'Physical Characteristics',
    fields: [
      { key: 'appearance', label: 'Appearance' },
      { key: 'odor', label: 'Odor' },
      { key: 'taste', label: 'Taste' },
      { key: 'solubility', label: 'Solubility' },
      { key: 'mesh_size', label: 'Mesh Size' },
      { key: 'bulk_density', label: 'Bulk Density' },
      { key: 'particle_size', label: 'Particle Size' },
    ],
  },
  {
    name: 'Chemical Analysis',
    fields: [
      { key: 'assay', label: 'Assay / Purity' },
      { key: 'moisture', label: 'Moisture' },
      { key: 'ash_content', label: 'Ash Content' },
      { key: 'loss_on_drying', label: 'Loss on Drying' },
      { key: 'ph', label: 'pH' },
      { key: 'residual_solvents', label: 'Residual Solvents' },
    ],
  },
  {
    name: 'Heavy Metals & Contaminants',
    fields: [
      { key: 'lead', label: 'Lead (Pb)' },
      { key: 'arsenic', label: 'Arsenic (As)' },
      { key: 'cadmium', label: 'Cadmium (Cd)' },
      { key: 'mercury', label: 'Mercury (Hg)' },
      { key: 'heavy_metals_total', label: 'Heavy Metals (Total)' },
      { key: 'pesticide_residue', label: 'Pesticide Residue' },
      { key: 'aflatoxins', label: 'Aflatoxins' },
    ],
  },
  {
    name: 'Microbiological',
    fields: [
      { key: 'total_plate_count', label: 'Total Plate Count' },
      { key: 'yeast_mold', label: 'Yeast & Mold' },
      { key: 'coliforms', label: 'Coliforms' },
      { key: 'e_coli_presence', label: 'E. Coli' },
      { key: 'salmonella_presence', label: 'Salmonella' },
      { key: 'staphylococcus_presence', label: 'Staphylococcus' },
    ],
  },
  {
    name: 'Compliance & Safety',
    fields: [
      { key: 'gmo_status', label: 'GMO Status' },
      { key: 'irradiation_status', label: 'Irradiation Status' },
      { key: 'allergen_info', label: 'Allergen Information' },
      { key: 'bse_statement', label: 'BSE/TSE Statement' },
      { key: 'halal_certified', label: 'Halal Certified' },
      { key: 'kosher_certified', label: 'Kosher Certified' },
      { key: 'organic_certification_body', label: 'Organic Certifier' },
    ],
  },
  {
    name: 'Packaging & Logistics',
    fields: [
      { key: 'gross_weight', label: 'Gross Weight per Package' },
      { key: 'packages_per_pallet', label: 'Packages per Pallet' },
      { key: 'storage_temperature', label: 'Storage Temperature' },
      { key: 'storage_conditions', label: 'Storage Conditions' },
    ],
  },
  {
    name: 'Commercial Terms',
    fields: [
      { key: 'sample_availability', label: 'Sample Availability' },
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

