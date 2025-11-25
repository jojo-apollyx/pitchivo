'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Key, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Provider {
  id: string
  name: string
  display_name: string
  description: string | null
  base_url: string | null
  documentation_url: string | null
  is_active: boolean
  created_at: string
}

interface ApiKey {
  id: string
  provider_id: string
  key_name: string
  is_active: boolean
  priority: number
  free_tier_limit: number | null
  free_tier_reset_date: string | null
  notes: string | null
  created_at: string
}

async function fetchProviders() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads_enrichment_providers')
    .select('*')
    .order('display_name')

  if (error) throw error
  return data || []
}

async function fetchApiKeys(providerId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads_enrichment_api_keys')
    .select('*')
    .eq('provider_id', providerId)
    .order('priority')

  if (error) throw error
  return data || []
}

async function fetchProviderStats(providerId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_enrichment_provider_stats', {
    p_provider_id: providerId,
    p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    p_end_date: new Date().toISOString().split('T')[0],
  })

  if (error) throw error
  return data?.[0] || null
}

export function EnrichmentSupplierTab() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false)
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null)

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['enrichment-providers'],
    queryFn: fetchProviders,
  })

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['enrichment-api-keys', selectedProvider?.id],
    queryFn: () => selectedProvider ? fetchApiKeys(selectedProvider.id) : Promise.resolve([]),
    enabled: !!selectedProvider,
  })

  const { data: providerStats } = useQuery({
    queryKey: ['enrichment-provider-stats', selectedProvider?.id],
    queryFn: () => selectedProvider ? fetchProviderStats(selectedProvider.id) : Promise.resolve(null),
    enabled: !!selectedProvider,
  })

  const handleCreateProvider = async (formData: FormData) => {
    try {
      const { error } = await supabase
        .from('leads_enrichment_providers')
        .insert({
          name: formData.get('name') as string,
          display_name: formData.get('display_name') as string,
          description: formData.get('description') as string || null,
          base_url: formData.get('base_url') as string || null,
          documentation_url: formData.get('documentation_url') as string || null,
          is_active: formData.get('is_active') === 'on',
        })

      if (error) throw error
      toast.success('Provider created successfully')
      setIsProviderDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['enrichment-providers'] })
    } catch (error: any) {
      toast.error(`Failed to create provider: ${error.message}`)
    }
  }

  const handleUpdateProvider = async (formData: FormData) => {
    if (!editingProvider) return

    try {
      const { error } = await supabase
        .from('leads_enrichment_providers')
        .update({
          display_name: formData.get('display_name') as string,
          description: formData.get('description') as string || null,
          base_url: formData.get('base_url') as string || null,
          documentation_url: formData.get('documentation_url') as string || null,
          is_active: formData.get('is_active') === 'on',
        })
        .eq('id', editingProvider.id)

      if (error) throw error
      toast.success('Provider updated successfully')
      setIsProviderDialogOpen(false)
      setEditingProvider(null)
      queryClient.invalidateQueries({ queryKey: ['enrichment-providers'] })
    } catch (error: any) {
      toast.error(`Failed to update provider: ${error.message}`)
    }
  }

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider? This will also delete all associated API keys.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('leads_enrichment_providers')
        .delete()
        .eq('id', providerId)

      if (error) throw error
      toast.success('Provider deleted successfully')
      if (selectedProvider?.id === providerId) {
        setSelectedProvider(null)
      }
      queryClient.invalidateQueries({ queryKey: ['enrichment-providers'] })
    } catch (error: any) {
      toast.error(`Failed to delete provider: ${error.message}`)
    }
  }

  const handleCreateApiKey = async (formData: FormData) => {
    if (!selectedProvider) return

    try {
      const resetDate = formData.get('free_tier_reset_date') as string
      const { error } = await supabase
        .from('leads_enrichment_api_keys')
        .insert({
          provider_id: selectedProvider.id,
          key_name: formData.get('key_name') as string,
          api_key: formData.get('api_key') as string,
          is_active: formData.get('is_active') === 'on',
          priority: parseInt(formData.get('priority') as string) || 0,
          free_tier_limit: formData.get('free_tier_limit') ? parseInt(formData.get('free_tier_limit') as string) : null,
          free_tier_reset_date: resetDate || null,
          notes: formData.get('notes') as string || null,
        })

      if (error) throw error
      toast.success('API key created successfully')
      setIsApiKeyDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['enrichment-api-keys', selectedProvider.id] })
    } catch (error: any) {
      toast.error(`Failed to create API key: ${error.message}`)
    }
  }

  const handleUpdateApiKey = async (formData: FormData) => {
    if (!editingApiKey || !selectedProvider) return

    try {
      const resetDate = formData.get('free_tier_reset_date') as string
      const apiKeyValue = formData.get('api_key') as string
      
      const updateData: any = {
        key_name: formData.get('key_name') as string,
        is_active: formData.get('is_active') === 'on',
        priority: parseInt(formData.get('priority') as string) || 0,
        free_tier_limit: formData.get('free_tier_limit') ? parseInt(formData.get('free_tier_limit') as string) : null,
        free_tier_reset_date: resetDate || null,
        notes: formData.get('notes') as string || null,
      }

      // Only update API key if a new value was provided
      if (apiKeyValue && apiKeyValue !== '••••••••') {
        updateData.api_key = apiKeyValue
      }

      const { error } = await supabase
        .from('leads_enrichment_api_keys')
        .update(updateData)
        .eq('id', editingApiKey.id)

      if (error) throw error
      toast.success('API key updated successfully')
      setIsApiKeyDialogOpen(false)
      setEditingApiKey(null)
      queryClient.invalidateQueries({ queryKey: ['enrichment-api-keys', selectedProvider.id] })
    } catch (error: any) {
      toast.error(`Failed to update API key: ${error.message}`)
    }
  }

  const handleDeleteApiKey = async (apiKeyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('leads_enrichment_api_keys')
        .delete()
        .eq('id', apiKeyId)

      if (error) throw error
      toast.success('API key deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['enrichment-api-keys', selectedProvider?.id] })
    } catch (error: any) {
      toast.error(`Failed to delete API key: ${error.message}`)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading providers...</div>
  }

  return (
    <div className="space-y-6">
      {/* Providers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enrichment Providers</CardTitle>
              <CardDescription>Manage data enrichment service providers</CardDescription>
            </div>
            <Button onClick={() => {
              setEditingProvider(null)
              setIsProviderDialogOpen(true)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedProvider?.id === provider.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent/5'
                }`}
                onClick={() => setSelectedProvider(provider)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{provider.display_name}</h3>
                        {provider.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {provider.description || provider.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingProvider(provider)
                        setIsProviderDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProvider(provider.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Keys for Selected Provider */}
      {selectedProvider && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API Keys - {selectedProvider.display_name}</CardTitle>
                <CardDescription>Manage API keys and quotas for {selectedProvider.display_name}</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingApiKey(null)
                setIsApiKeyDialogOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add API Key
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {providerStats && (
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4" />
                  <span className="font-semibold">Last 30 Days Statistics</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total Requests</div>
                    <div className="font-semibold">{providerStats.total_requests || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Successful</div>
                    <div className="font-semibold text-green-600">{providerStats.successful_requests || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Failed</div>
                    <div className="font-semibold text-red-600">{providerStats.failed_requests || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Daily</div>
                    <div className="font-semibold">{Math.round(providerStats.avg_daily_requests || 0)}</div>
                  </div>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Free Tier Limit</TableHead>
                  <TableHead>Reset Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No API keys configured
                    </TableCell>
                  </TableRow>
                ) : (
                  apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.key_name}</TableCell>
                      <TableCell>{key.priority}</TableCell>
                      <TableCell>{key.free_tier_limit || 'Unlimited'}</TableCell>
                      <TableCell>
                        {key.free_tier_reset_date
                          ? format(new Date(key.free_tier_reset_date), 'MMM dd, yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {key.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingApiKey(key)
                              setIsApiKeyDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteApiKey(key.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Provider Dialog */}
      <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? 'Edit Provider' : 'Add New Provider'}
            </DialogTitle>
            <DialogDescription>
              {editingProvider
                ? 'Update provider information'
                : 'Add a new enrichment service provider'}
            </DialogDescription>
          </DialogHeader>
          <form
            action={editingProvider ? handleUpdateProvider : handleCreateProvider}
            className="space-y-4"
          >
            {!editingProvider && (
              <div className="space-y-2">
                <Label htmlFor="name">Internal Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="hunter_io"
                  required
                  disabled={!!editingProvider}
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase, underscore-separated (e.g., hunter_io, clearbit)
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={editingProvider?.display_name}
                placeholder="Hunter.io"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingProvider?.description || ''}
                placeholder="Email finder and verifier service"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_url">Base URL</Label>
              <Input
                id="base_url"
                name="base_url"
                type="url"
                defaultValue={editingProvider?.base_url || ''}
                placeholder="https://api.hunter.io/v2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentation_url">Documentation URL</Label>
              <Input
                id="documentation_url"
                name="documentation_url"
                type="url"
                defaultValue={editingProvider?.documentation_url || ''}
                placeholder="https://hunter.io/api-documentation"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                name="is_active"
                defaultChecked={editingProvider?.is_active ?? true}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsProviderDialogOpen(false)
                  setEditingProvider(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingProvider ? 'Update' : 'Create'} Provider
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingApiKey ? 'Edit API Key' : 'Add New API Key'}
            </DialogTitle>
            <DialogDescription>
              {editingApiKey
                ? 'Update API key information'
                : `Add a new API key for ${selectedProvider?.display_name}`}
            </DialogDescription>
          </DialogHeader>
          <form
            action={editingApiKey ? handleUpdateApiKey : handleCreateApiKey}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="key_name">Key Name *</Label>
              <Input
                id="key_name"
                name="key_name"
                defaultValue={editingApiKey?.key_name}
                placeholder="Primary Key"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_key">
                API Key {!editingApiKey && '*'}
              </Label>
              <Input
                id="api_key"
                name="api_key"
                type="password"
                defaultValue={editingApiKey ? '••••••••' : ''}
                placeholder={editingApiKey ? "Leave blank to keep current key" : "Enter API key"}
                required={!editingApiKey}
              />
              {editingApiKey && (
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep current key, or enter new key to update
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  defaultValue={editingApiKey?.priority ?? 0}
                  min="0"
                />
                <p className="text-xs text-muted-foreground">0 = primary, higher = backup</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="free_tier_limit">Free Tier Limit</Label>
                <Input
                  id="free_tier_limit"
                  name="free_tier_limit"
                  type="number"
                  defaultValue={editingApiKey?.free_tier_limit || ''}
                  placeholder="25"
                />
                <p className="text-xs text-muted-foreground">Monthly limit (leave empty for unlimited)</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="free_tier_reset_date">Free Tier Reset Date</Label>
              <Input
                id="free_tier_reset_date"
                name="free_tier_reset_date"
                type="date"
                defaultValue={
                  editingApiKey?.free_tier_reset_date
                    ? editingApiKey.free_tier_reset_date.split('T')[0]
                    : ''
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={editingApiKey?.notes || ''}
                placeholder="Additional notes about this API key"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                name="is_active"
                defaultChecked={editingApiKey?.is_active ?? true}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsApiKeyDialogOpen(false)
                  setEditingApiKey(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingApiKey ? 'Update' : 'Create'} API Key
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

