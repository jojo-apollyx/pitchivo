/**
 * Sharing Links Panel - Redesigned for Clarity
 * Simple, intuitive panel for generating and sharing product links
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Copy, Loader2, QrCode, Plus, X, ExternalLink, Eye, Mail, CheckCircle2, Globe, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { CHANNEL_PRESETS, type ChannelPreset } from '@/lib/constants/access-levels'
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
      <div className="space-y-5">
        {/* Info Banner */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <p className="text-xs text-foreground font-medium mb-1">
            💡 What are these links for?
          </p>
          <p className="text-xs text-muted-foreground">
            Share your product with different people and control what information they can see. 
            You can create multiple links for different marketing channels.
          </p>
        </div>

        {/* Section 1: Basic Product Link */}
        <section className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Basic Product Link</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Anyone with this link sees basic product information only. Perfect for public listings or website.
              </p>
              <div className="p-3 rounded-lg border bg-card space-y-2">
                <p className="text-xs text-muted-foreground truncate font-mono">{publicUrl}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => handleCopyLink(publicUrl, 'Basic link')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(publicUrl, '_blank')}
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t" />

        {/* Section 2: Marketing Channel Links (More Info) */}
        <section className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-accent/10 p-2 mt-0.5">
              <Mail className="h-4 w-4 text-accent-dark" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Marketing Channel Links</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Create special links for emails, social media, or events. People who click these links see more details like pricing and specifications.
              </p>

              {channels.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed text-center">
                  <p className="text-xs text-muted-foreground mb-3">
                    No marketing channels created yet
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddChannel(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create Your First Channel
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {channels.map(channel => (
                    <div key={channel.id} className="p-3 rounded-lg border bg-card hover:border-primary/30 transition-colors">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-base mt-0.5">{channel.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-xs font-medium">{channel.name}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveChannel(channel.id)}
                              className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                              title="Remove channel"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          {channel.url ? (
                            <>
                              <p className="text-xs text-muted-foreground truncate font-mono mb-1">
                                {channel.url}
                              </p>
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                Expires in {channel.expiresInDays} days
                              </Badge>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Click "Generate" to create this link
                            </p>
                          )}
                        </div>
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
                          ) : channel.url ? (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Generate
                            </>
                          )}
                        </Button>
                        {channel.url && onShowQR && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onShowQR(channel.url!, channel.name)}
                            title="Show QR code"
                          >
                            <QrCode className="h-3 w-3" />
                          </Button>
                        )}
                        {channel.url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(channel.url, '_blank')}
                            title="Open in new tab"
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
                  className="w-full text-xs mt-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Another Channel
                </Button>
              )}

              {showAddChannel && (
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2 mt-2">
                  <p className="text-xs font-medium">Choose a channel type:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CHANNEL_PRESETS.map(preset => (
                      <Button
                        key={preset.id}
                        size="sm"
                        variant="outline"
                        className="text-xs justify-start h-auto py-2 hover:bg-primary/10 hover:border-primary/30"
                        onClick={() => handleAddChannel(preset)}
                      >
                        <span className="mr-2">{preset.icon}</span>
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
            </div>
          </div>
        </section>

        <div className="border-t" />

        {/* Section 3: Complete Access (After Quote Request) */}
        <section className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-green-100 dark:bg-green-950/30 p-2 mt-0.5">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Complete Access</h3>
              <p className="text-xs text-muted-foreground mb-3">
                When someone submits a quote request (RFQ), they automatically get a special link that shows everything including downloadable files.
              </p>
              <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50">
                <p className="text-xs font-medium mb-2 text-foreground">
                  🎁 Automatic Benefit
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span>Full product specifications</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span>Download certificates & documents</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <span>Valid for 30 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t" />

        {/* Merchant Preview Link */}
        <section>
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground mb-2 flex items-center gap-2 list-none">
              <Eye className="h-3 w-3" />
              <span>Preview Link (For Testing)</span>
              <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-3 rounded-lg border bg-muted/30 mt-2">
              <p className="text-xs text-muted-foreground mb-3">
                This special link lets you preview your product page with all information visible, even before publishing. Don't share this publicly!
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleCopyLink(merchantUrl, 'Preview link')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Preview Link
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(merchantUrl, '_blank')}
                  title="Open preview in new tab"
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

