'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Send, Mail, Building2, Phone, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

const rfqSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().min(1, 'Company name is required'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Please provide more details (at least 10 characters)'),
  quantity: z.string().optional(),
  targetDate: z.string().optional(),
})

type RfqFormData = z.infer<typeof rfqSchema>

interface RfqFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productName: string
  onSuccess?: () => void
}

export function RfqFormDialog({
  open,
  onOpenChange,
  productId,
  productName,
  onSuccess,
}: RfqFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RfqFormData>({
    resolver: zodResolver(rfqSchema),
  })

  const onSubmit = async (data: RfqFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/products/rfq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          ...data,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit RFQ')
      }

      const result = await response.json()

      reset()
      onOpenChange(false)
      onSuccess?.()

      // Redirect to upgrade URL if provided (gives user full access)
      if (result.upgrade_url) {
        toast.success('RFQ submitted successfully!', {
          description: 'Redirecting to view full product details...',
        })
        
        // Use window.location.replace to avoid adding to history
        // Small delay to show success message
        setTimeout(() => {
          window.location.replace(result.upgrade_url)
        }, 1000)
      } else {
        toast.success('RFQ submitted successfully!', {
          description: 'We will get back to you soon.',
        })
      }
    } catch (error) {
      console.error('RFQ submission error:', error)
      toast.error('Failed to submit RFQ', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Request for Quotation (RFQ)
          </DialogTitle>
          <DialogDescription>
            Submit your inquiry for <strong>{productName}</strong>. We'll respond within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product Info */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-sm font-medium text-foreground">Product</p>
            <p className="text-sm text-muted-foreground">{productName}</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="John Doe"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john@company.com"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">
              Company <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company"
              {...register('company')}
              placeholder="Company Name"
              className={errors.company ? 'border-destructive' : ''}
            />
            {errors.company && (
              <p className="text-sm text-destructive">{errors.company.message}</p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Quantity (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Estimated Quantity</Label>
            <Input
              id="quantity"
              {...register('quantity')}
              placeholder="e.g., 1000 kg, 500 units"
            />
          </div>

          {/* Target Date (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Delivery Date</Label>
            <Input
              id="targetDate"
              type="date"
              {...register('targetDate')}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Please provide details about your requirements, specifications, or any questions you have..."
              rows={5}
              className={errors.message ? 'border-destructive' : ''}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit RFQ
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

