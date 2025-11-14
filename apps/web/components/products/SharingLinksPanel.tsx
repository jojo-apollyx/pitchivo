/**
 * Sharing Links Panel
 * Clear, organized panel showing all ways to share a product with different access levels
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Copy, Loader2, QrCode, Plus, X, ExternalLink, Info } from 'lucide-react'
import { toast } from 'sonner'
import { ACCESS_LEVEL_CONFIG, CHANNEL_PRESETS, type ChannelPreset } from '@/lib/constants/access-levels'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MarketingChannel {
  id: string
  name: string
  icon: string
  token?: string
  url?: string
  expiresInDays: number
  generatedAt?: Date
}

interface SharingLinksPanelProps {
  productId: string
  onShowQR?: (url: string, channelName: string) => void
}

export function SharingLinksPanel({ productId, onShowQR }: SharingLinksPanelProps) {
  const [channels, setChannels] = useState<MarketingChannel[]>([])
  const [generatingTokens, setGeneratingTokens] = useState<Set<string>>(new Set())
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<ChannelPreset | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const publicUrl = `${baseUrl}/products/${productId}`
  const merchantUrl = `${publicUrl}?merchant=true`

  // Generate secure token for marketing channel
  const generateChannelLink = async (channel: MarketingChannel) => {
    setGeneratingTokens(prev => new Set(prev).add(channel.id))

    try {
      const response = await fetch('/api/products/tokens/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          channel_id: channel.id,
          channel_name: channel.name,
          access_level: 'after_click',
          expires_in_days: channel.expiresInDays,
        }),
      })

      const data = await response.json()

      if (data.success && data.url) {
        // Update channel with generated link
        setChannels(prev =>
          prev.map(c =>
            c.id === channel.id
              ? {
                  ...c,
                  token: data.token,
                  url: data.url,
                  generatedAt: new Date(),
                }
              : c
          )
        )
        return data.url
      }

      throw new Error(data.error || 'Failed to generate link')
    } catch (error) {
      console.error('Error generating link:', error)
      toast.error(`Failed to generate link for ${channel.name}`)
      return null
    } finally {
      setGeneratingTokens(prev => {
        const next = new Set(prev)
        next.delete(channel.id)
        return next
      })
    }
  }

  const handleCopyLink = async (url: string, label: string) => {
    await navigator.clipboard.writeText(url)
    toast.success(`${label} copied to clipboard!`)
  }

  const handleCopyOrGenerate = async (channel: MarketingChannel) => {
    if (channel.url) {
      // Already generated, just copy
      await handleCopyLink(channel.url, channel.name)
    } else {
      // Generate and copy
      const url = await generateChannelLink(channel)
      if (url) {
        await handleCopyLink(url, channel.name)
      }
    }
  }

  const handleAddChannel = (preset: ChannelPreset) => {
    const newChannel: MarketingChannel = {
      id: `${preset.id}_${Date.now()}`,
      name: preset.name,
      icon: preset.icon,
      expiresInDays: preset.expiresInDays,
    }
    setChannels(prev => [...prev, newChannel])
    setSelectedPreset(null)
    setShowAddChannel(false)
    toast.success(`${preset.name} added`)
  }

  const handleRemoveChannel = (channelId: string) => {
    setChannels(prev => prev.filter(c => c.id !== channelId))
    toast.success('Channel removed')
  }

  const isGenerating = (channelId: string) => generatingTokens.has(channelId)

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Section 1: Browse Mode (Public) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{ACCESS_LEVEL_CONFIG.public.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{ACCESS_LEVEL_CONFIG.public.userLabel}</h3>
              <p className="text-xs text-muted-foreground">
                {ACCESS_LEVEL_CONFIG.public.description}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{ACCESS_LEVEL_CONFIG.public.example}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-start gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-1">Public Product Link</p>
                <p className="text-xs text-muted-foreground truncate font-mono">{publicUrl}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => handleCopyLink(publicUrl, 'Public link')}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy Link
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(publicUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </section>

        <div className="border-t" />

        {/* Section 2: Link Access (Marketing) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{ACCESS_LEVEL_CONFIG.after_click.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{ACCESS_LEVEL_CONFIG.after_click.userLabel}</h3>
              <p className="text-xs text-muted-foreground">
                {ACCESS_LEVEL_CONFIG.after_click.description}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{ACCESS_LEVEL_CONFIG.after_click.example}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {channels.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed text-center">
              <p className="text-xs text-muted-foreground mb-2">
                No marketing channels yet
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddChannel(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Channel
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {channels.map(channel => (
                <div key={channel.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">{channel.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{channel.name}</p>
                      {channel.url ? (
                        <>
                          <p className="text-xs text-muted-foreground truncate font-mono">
                            {channel.url}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Expires in {channel.expiresInDays} days
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Click to generate secure link
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveChannel(channel.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => handleCopyOrGenerate(channel)}
                      disabled={isGenerating(channel.id)}
                    >
                      {isGenerating(channel.id) ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          {channel.url ? 'Copy Link' : 'Generate & Copy'}
                        </>
                      )}
                    </Button>
                    {channel.url && onShowQR && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onShowQR(channel.url!, channel.name)}
                      >
                        <QrCode className="h-3 w-3" />
                      </Button>
                    )}
                    {channel.url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(channel.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showAddChannel && channels.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddChannel(true)}
              className="w-full text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Another Channel
            </Button>
          )}

          {showAddChannel && (
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <p className="text-xs font-medium">Choose a channel type:</p>
              <div className="grid grid-cols-2 gap-2">
                {CHANNEL_PRESETS.map(preset => (
                  <Button
                    key={preset.id}
                    size="sm"
                    variant="outline"
                    className="text-xs justify-start h-auto py-2"
                    onClick={() => handleAddChannel(preset)}
                  >
                    <span className="mr-1">{preset.icon}</span>
                    <span className="text-left flex-1">{preset.name}</span>
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddChannel(false)}
                className="w-full text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </section>

        <div className="border-t" />

        {/* Section 3: Full Access (After RFQ) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{ACCESS_LEVEL_CONFIG.after_rfq.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{ACCESS_LEVEL_CONFIG.after_rfq.userLabel}</h3>
              <p className="text-xs text-muted-foreground">
                {ACCESS_LEVEL_CONFIG.after_rfq.description}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{ACCESS_LEVEL_CONFIG.after_rfq.example}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
            <p className="text-xs text-muted-foreground mb-2">
              <strong>Automatic Upgrade:</strong> When someone submits an RFQ (Request for Quote),
              they automatically receive a secure link with full access.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span>✓ Complete product details</span>
              <span>✓ File downloads</span>
              <span>✓ 30-day access</span>
            </div>
          </div>
        </section>

        <div className="border-t" />

        {/* Merchant Link */}
        <section>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground mb-2">
              Merchant Preview Link
            </summary>
            <div className="p-3 rounded-lg border bg-card">
              <p className="text-xs text-muted-foreground mb-2">
                Use this link to preview with full merchant access:
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleCopyLink(merchantUrl, 'Merchant link')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Merchant Link
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(merchantUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </details>
        </section>
      </div>
    </TooltipProvider>
  )
}

