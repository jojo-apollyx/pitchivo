'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface SequencesTabProps {
  campaign: any
  onRefresh: () => void
}

export function SequencesTab({ campaign, onRefresh }: SequencesTabProps) {
  const [sequences, setSequences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSequences()
  }, [campaign.smartlead_campaign_id])

  async function loadSequences() {
    if (!campaign.smartlead_campaign_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/smartlead/campaigns/${campaign.campaign_id}/sequences`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load sequences')
      }
      
      const data = await response.json()
      // API returns { success: true, sequences: [...] }
      const sequencesArray = data.sequences || []
      setSequences(Array.isArray(sequencesArray) ? sequencesArray : [sequencesArray])
    } catch (error) {
      console.error('Error loading sequences:', error)
      toast.error('Failed to load sequences')
    } finally {
      setLoading(false)
    }
  }

  if (!campaign.smartlead_campaign_id) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaign not synced with Smartlead</p>
        <p className="text-sm text-muted-foreground mt-2">Sequences are only available for synced campaigns</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Sequences</h3>
          <p className="text-sm text-muted-foreground">
            Manage your campaign email sequences
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Add Sequence
        </Button>
      </div>

      {sequences.length === 0 ? (
        <Alert>
          <AlertDescription>
            No sequences found for this campaign. Create sequences in Smartlead to see them here.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {sequences.map((sequence, index) => (
            <Card key={sequence.id || index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">
                        Email {sequence.seq_number || index + 1}
                      </CardTitle>
                      {sequence.sequence_variants && sequence.sequence_variants.length > 0 && (
                        <Badge variant="secondary">
                          {sequence.sequence_variants.length} Variant{sequence.sequence_variants.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {sequence.subject && (
                      <CardDescription>
                        Subject: {sequence.subject}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sequence.email_body && (
                  <div 
                    className="prose prose-sm max-w-none text-sm text-muted-foreground line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: sequence.email_body }}
                  />
                )}
                
                {/* Show variants if they exist */}
                {sequence.sequence_variants && sequence.sequence_variants.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-sm font-medium">Variants:</p>
                    {sequence.sequence_variants.map((variant: any, vIndex: number) => (
                      <div key={variant.id || vIndex} className="text-sm">
                        <Badge variant="outline" className="mr-2">
                          Variant {variant.variant_label}
                        </Badge>
                        <span className="text-muted-foreground">{variant.subject}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Alert>
        <AlertDescription>
          Sequence management is currently view-only. To edit sequences, please use the Smartlead dashboard.
          Full editing capabilities coming soon.
        </AlertDescription>
      </Alert>
    </div>
  )
}

