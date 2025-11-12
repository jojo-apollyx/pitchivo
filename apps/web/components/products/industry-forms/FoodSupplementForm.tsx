'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

// Schema for food supplement product form
const foodSupplementSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  cas_number: z.string().optional(),
  molecular_formula: z.string().optional(),
  purity: z.string().optional(),
  appearance: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
})

export type FoodSupplementFormData = z.infer<typeof foodSupplementSchema>

interface FoodSupplementFormProps {
  productNameRaw: string
  onSubmit: (data: FoodSupplementFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function FoodSupplementForm({
  productNameRaw,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FoodSupplementFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FoodSupplementFormData>({
    resolver: zodResolver(foodSupplementSchema),
    defaultValues: {
      product_name: productNameRaw,
      cas_number: '',
      molecular_formula: '',
      purity: '',
      appearance: '',
      description: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product_name">Product Name *</Label>
          <Input
            id="product_name"
            {...register('product_name')}
            placeholder="Enter product name"
          />
          {errors.product_name && (
            <p className="text-sm text-destructive">{errors.product_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cas_number">CAS Number</Label>
          <Input
            id="cas_number"
            {...register('cas_number')}
            placeholder="e.g., 50-81-7"
          />
          {errors.cas_number && (
            <p className="text-sm text-destructive">{errors.cas_number.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="molecular_formula">Molecular Formula</Label>
          <Input
            id="molecular_formula"
            {...register('molecular_formula')}
            placeholder="e.g., C6H8O6"
          />
          {errors.molecular_formula && (
            <p className="text-sm text-destructive">{errors.molecular_formula.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="purity">Purity</Label>
          <Input
            id="purity"
            {...register('purity')}
            placeholder="e.g., 99%"
          />
          {errors.purity && (
            <p className="text-sm text-destructive">{errors.purity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="appearance">Appearance</Label>
          <Input
            id="appearance"
            {...register('appearance')}
            placeholder="e.g., White crystalline powder"
          />
          {errors.appearance && (
            <p className="text-sm text-destructive">{errors.appearance.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            {...register('description')}
            rows={4}
            className="w-full px-3 py-2 text-base rounded-xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
            placeholder="Describe your product..."
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Product'
          )}
        </Button>
      </div>
    </form>
  )
}

